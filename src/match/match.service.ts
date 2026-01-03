import {Injectable} from "@nestjs/common";
import axios from "axios";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import {matchDto} from "../job/dto/job.dto";
import OpenAI from "openai";

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

@Injectable()
export class MatchService {
  private async downloadCv(cv: string): Promise<Buffer> {
    const res = await axios.get(cv, {responseType: "arraybuffer"});
    return Buffer.from(res.data, "binary");
  }

  private fileType(cv: string): "pdf" | "docx" {
    if (cv.endsWith(".pdf")) return "pdf";
    if (cv.endsWith(".doc") || cv.endsWith(".docx")) return "docx";
    throw new Error("Unsuppoted file type");
  }

  private async getText(buffer: Buffer, fileType: "pdf" | "docx"): Promise<string> {
    if (fileType === "pdf") {
      const data = await pdfParse(buffer);
      return data.text;
    } else if (fileType === "docx") {
      const res = await mammoth.extractRawText({buffer});
      return res.value;
    }

    throw new Error(`Unsupported file type: ${fileType}`);
  }

  async getMatch(dto: matchDto) {
    const {cv, description} = dto;
    let text = cv;

    // simplistic check if it looks like a URL, otherwise treat as text
    if (cv.startsWith("http")) {
      try {
        const buffer = await this.downloadCv(cv);
        const filetype = this.fileType(cv);
        text = await this.getText(buffer, filetype);
      } catch (error) {
        console.error("Failed to download/parse CV URL, treating as text:", error);
      }
    }

    const prompt = `
        You're an AI recruiter. Given a resume and a job description, perform a detailed gap analysis.
        
        Resume Content:
        ${text}
        
        Job Description:
        ${description}
        
        Respond ONLY in this JSON format:
        {
          "matchPercentage": 85,
          "strengths": ["List 3-5 key matched skills or experiences"],
          "missingSkills": ["List 3-5 critical missing requirements"],
          "suggestions": ["List 3 actionable quick improvements"]
        }
      `;

    try {
      const result = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{role: "user", content: prompt}],
        temperature: 0.3,
      });

      const content = result.choices[0].message.content || "{}";
      const cleaned = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        return JSON.parse(cleaned);
      } catch (error) {
        console.error(error);
        return {
          matchPercentage: 0,
          strengths: [],
          missingSkills: [],
          suggestions: ["Failed to parse AI analysis."],
        };
      }
    } catch (err) {
      console.error("Error occured while getting response:", err);
      return {
        matchPercentage: 0,
        strengths: [],
        missingSkills: [],
        suggestions: ["AI Service unavailable."],
      };
    }
  }

  async generateTailoredCV(dto: matchDto) {
    const {cv, description} = dto;
    const buffer = await this.downloadCv(cv);
    const filetype = this.fileType(cv);
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
