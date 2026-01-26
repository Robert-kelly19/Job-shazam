import {Injectable, Inject, HttpException, HttpStatus} from "@nestjs/common";
import {CACHE_MANAGER} from "@nestjs/cache-manager";
import {Cache} from "cache-manager";
import axios from "axios";
import mammoth from "mammoth";
import {matchDto} from "../job/dto/job.dto";
import OpenAI from "openai";
import {GoogleGenerativeAI} from "@google/generative-ai";
import * as crypto from "crypto";

// pdfjs-dist is a CommonJS library with no proper ESM exports
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfjsLib = require("pdfjs-dist/build/pdf");

@Injectable()
export class MatchService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  private async downloadCv(cv: string): Promise<Buffer> {
    // Validate URL format and security
    let url: URL;
    try {
      url = new URL(cv);
    } catch {
      throw new Error("Invalid CV URL format");
    }

    // Block private/local IPs to prevent SSRF attacks
    const hostname = url.hostname.toLowerCase();
    const blockedHosts = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      "metadata.google.internal", // Cloud metadata endpoints
    ];

    if (
      blockedHosts.includes(hostname) ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.startsWith("172.17.") ||
      hostname.startsWith("172.18.") ||
      hostname.startsWith("172.19.") ||
      hostname.startsWith("172.2") ||
      hostname.startsWith("172.30.") ||
      hostname.startsWith("172.31.") ||
      hostname.startsWith("169.254.")
    ) {
      throw new Error("Access to private/local URLs is not allowed");
    }

    // Only allow HTTP/HTTPS protocols
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Only HTTP and HTTPS protocols are allowed");
    }

    const res = await axios.get(cv, {
      responseType: "arraybuffer",
      maxContentLength: 10 * 1024 * 1024, // 10MB limit
      timeout: 15000, // 15 second timeout
      maxRedirects: 5, // Limit redirects
    });

    return Buffer.from(res.data, "binary");
  }

  private async inferFileType(buffer: Buffer): Promise<"pdf" | "docx"> {
    // Try to detect file type from file signature (magic numbers)
    try {
      // For file-type v16, use fileTypeFromBuffer
      const {fileTypeFromBuffer} = await import("file-type");
      const detected = await fileTypeFromBuffer(buffer);

      if (detected?.mime === "application/pdf") return "pdf";
      if (
        detected?.mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return "docx";
      }
    } catch (err) {
      console.warn("file-type detection failed, using fallback", err);
    }

    // Fallback: check for PDF signature
    const pdfSignature = buffer.toString("utf8", 0, 4);
    if (pdfSignature === "%PDF") return "pdf";

    // Fallback: check for DOCX signature (PK zip)
    const zipSignature = buffer.toString("hex", 0, 2);
    if (zipSignature === "504b") return "docx";

    throw new Error(`Unsupported or unrecognized file type - could not detect valid PDF or DOCX`);
  }

  private async getText(buffer: Buffer, fileType: "pdf" | "docx"): Promise<string> {
    if (fileType === "pdf") {
      const pdf = await pdfjsLib.getDocument({data: buffer}).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        text += textContent.items.map((item: any) => item.str).join(" ");
        text += "\n";
      }
      return text;
    } else if (fileType === "docx") {
      const res = await mammoth.extractRawText({buffer});
      return res.value;
    }

    throw new Error(`Unsupported file type: ${fileType}`);
  }

  async getMatch(dto: matchDto) {
    const {cv, description} = dto;

    // Generate cache key from CV and description
    const cacheKey = `match_${this.generateHash(cv)}_${this.generateHash(description)}`;

    // Check cache first
    let cached;
    try {
      cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        console.log("Cache hit for match request");
        return cached;
      }
    } catch (cacheError) {
      console.warn("Cache get failed, proceeding without cache:", cacheError);
    }

    let text = cv;

    // Check if it looks like a URL, otherwise treat as text
    if (cv.startsWith("http")) {
      try {
        const buffer = await this.downloadCv(cv);
        const filetype = await this.inferFileType(buffer);
        text = await this.getText(buffer, filetype);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Failed to process CV file: ${errorMsg}`);
      }
    }

    const prompt = `
        You're an expert ATS (Applicant Tracking System) and career advisor with deep knowledge of hiring patterns and job fit analysis.
        
        Analyze the resume against the job description using these weighted criteria:
        1. Technical skill alignment (40%) - Match technical skills, tools, frameworks, programming languages, platforms
        2. Experience relevance (30%) - Years in relevant roles, domain expertise, project scope experience
        3. Education & certifications (15%) - Degree level, relevant certifications, ongoing learning
        4. Soft skills & culture fit (10%) - Leadership, communication, teamwork, problem-solving
        5. Job-specific requirements (5%) - Specific certifications, security clearances, licenses
        
        Additional Analysis Factors:
        - Extract any salary expectations from resume and compare with job posting
        - Identify required vs nice-to-have skills from job description
        - Assess experience level match (junior/mid/senior)
        - Check for red flags or gaps in employment timeline
        - Evaluate proximity to location if mentioned
        - Flag if specialized knowledge is required (e.g., industry-specific, regulatory, compliance)
        
        Resume Content:
        ${text}
        
        Job Description:
        ${description}
        
        Provide analysis in this EXACT JSON format (no markdown, just raw JSON):
        {
          "matchPercentage": <number 0-100>,
          "breakdown": {
            "technical": <number 0-100>,
            "experience": <number 0-100>,
            "education": <number 0-100>,
            "softSkills": <number 0-100>,
            "jobSpecific": <number 0-100>
          },
          "strengths": ["<specific matched skill or achievement>", "<quantifiable experience>", "..."],
          "missingSkills": ["<critical required skill from job>", "<important certification>", "..."],
          "suggestions": [
            "<specific actionable improvement to better match this role>",
            "<skill to develop with estimated timeline>",
            "<certification or course recommendation>"
          ],
          "keywords": {
            "matched": ["<keyword found in both resume and job description>", "..."],
            "missing": ["<important technical term/keyword from job description not in resume>", "..."]
          },
          "experienceLevelMatch": "<junior|mid|senior> - <explanation>",
          "salaryCompatibility": "<likely match based on experience vs role level or salary if mentioned>",
          "criticalGaps": ["<major gap that could be a dealbreaker>"] or [],
          "overallFitAssessment": "<one sentence summary of how well candidate matches role>"
        }
      `;

    try {
      let result;
      // Initialize OpenAI client at runtime to ensure env vars are loaded
      const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

      try {
        result = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{role: "user", content: prompt}],
          temperature: 0.2,
          response_format: {type: "json_object"},
        });
      } catch {
        // Fallback without response_format if not supported
        console.warn("JSON mode not supported, using regular mode");
        result = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{role: "user", content: prompt}],
          temperature: 0.3,
        });
      }

      const content = result.choices[0].message.content || "{}";
      const cleaned = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned);

        // Validate response structure
        if (
          typeof parsed.matchPercentage !== "number" ||
          !Array.isArray(parsed.strengths) ||
          !Array.isArray(parsed.missingSkills) ||
          !Array.isArray(parsed.suggestions)
        ) {
          throw new Error("Invalid response structure from AI");
        }

        // Cache the successful result for 1 hour
        try {
          await this.cacheManager.set(cacheKey, parsed, 3600000);
        } catch (cacheError) {
          console.warn("Cache set failed:", cacheError);
        }

        return parsed;
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "Content:", cleaned);
        throw new Error("AI returned invalid format. Please try again or contact support.");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.warn("OpenAI failed. Error:", errorMsg);
      console.log(
        "Gemini API Key present:",
        !!process.env.GEMINI_API_KEY,
        "Length:",
        process.env.GEMINI_API_KEY?.length,
      );

      // FALLBACK TO GEMINI
      const isAuthOrQuotaError =
        errorMsg.includes("401") ||
        errorMsg.includes("Incorrect API key") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("rate_limit");

      if (process.env.GEMINI_API_KEY && isAuthOrQuotaError) {
        try {
          console.log("Attempting fallback to Gemini Pro...");
          const geminiResult = await this.callGemini(prompt);

          // Cache the successful Gemini result
          try {
            await this.cacheManager.set(cacheKey, geminiResult, 3600000);
          } catch (cacheError) {
            console.warn("Cache set failed:", cacheError);
          }

          return geminiResult;
        } catch (geminiError) {
          console.error("Gemini fallback also failed:", geminiError);
          // Throw the original OpenAI error to the user if both fail, or a combined message
          throw new HttpException(
            "Both AI services failed. Please check backend API keys.",
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      }

      if (errorMsg.includes("401") || errorMsg.includes("Incorrect API key")) {
        throw new HttpException(
          "Invalid OpenAI API Key. Please check your backend .env configuration.",
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (errorMsg.includes("rate_limit") || errorMsg.includes("429")) {
        throw new HttpException(
          "AI service is currently rate limited. Please try again in a few moments.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (errorMsg.includes("quota") || errorMsg.includes("insufficient_quota")) {
        throw new HttpException(
          "AI service quota exceeded. Please contact support.",
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      throw new HttpException(`AI analysis failed: ${errorMsg}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async callGemini(prompt: string): Promise<Record<string, unknown>> {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({model: "gemini-flash-latest"});
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean up markdown code blocks if present
      text = text
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      return JSON.parse(text);
    } catch (error) {
      throw new Error(`Gemini Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private generateHash(input: string): string {
    return crypto.createHash("sha256").update(input).digest("hex").substring(0, 16);
  }

  async generateTailoredCV(dto: matchDto) {
    const {cv, description} = dto;
    const buffer = await this.downloadCv(cv);
    const filetype = await this.inferFileType(buffer);
    const cvText = await this.getText(buffer, filetype);

    const prompt = `
      You are an expert resume writer. Rewrite the following resume to specifically target the provided job description.
      
      Job Description:
      ${description}
      
      Original Resume:
      ${cvText}
      
      Instructions:
      1. Highlight skills and experiences that match the job description.
      2. Use strong action verbs.
      3. Keep the format structured.
      
      Return the result as a JSON object with the following structure:
      {
        "summary": "Tailored professional summary...",
        "experience": [
          { "role": "...", "company": "...", "duration": "...", "points": ["...", "..."] }
        ],
        "skills": ["...", "..."],
        "education": "..."
      }
    `;

    try {
      const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
      const result = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{role: "user", content: prompt}],
        temperature: 0.5,
      });

      const content = result.choices[0].message.content || "{}";
      // Try to clean markdown fences if present
      const cleaned = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        return JSON.parse(cleaned);
      } catch {
        // Fallback to raw text if JSON parsing fails
        return {error: "Failed to parse JSON", raw: content};
      }
    } catch (err) {
      console.error("Error generating tailored CV:", err);
      throw new Error("Failed to generate tailored CV");
    }
  }
}
