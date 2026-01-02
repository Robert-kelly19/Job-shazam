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
    const buffer = await this.downloadCv(cv);
    const filetype = this.fileType(cv);
    const Text = await this.getText(buffer, filetype);

    const prompt = `
        You're an AI recruiter. Given a resume and a job description, return a match percentage (0–100) and a short explanation.
        
        Resume:
        ${Text}
        
        Job Description:
        ${description}
        
        Respond ONLY in this JSON format:
        {
          "matchPercentage": 85,
          "feedback": "Strong React skills, some AWS experience missing."
        }
      `;

    try {
      const result = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{role: "user", content: prompt}],
        temperature: 0.3,
        stream: true,
      });

      let fullRes = "";
      for await (const chunks of result) {
        const content = chunks.choices?.[0].delta?.content;
        if (content) fullRes += content;
      }

      try {
        return JSON.parse(fullRes);
      } catch (error) {
        console.error(error);
        return {matchPercentage: 0, feedback: "Failed to parse AI response." + fullRes};
      }
    } catch (err) {
      console.error("Error occured while getting response:", err);
      return {
        matchPercentage: 0,
        feedback: "fail to stream response.",
      };
    }
  }
}
