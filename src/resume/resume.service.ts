import {Injectable, BadRequestException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Resume} from "./resume.entity";
import mammoth from "mammoth";

// pdfjs-dist is a CommonJS library with no proper ESM exports
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfjsLib = require("pdfjs-dist/build/pdf");

@Injectable()
export class ResumeService {
  constructor(
    @InjectRepository(Resume)
    private readonly resumeRepo: Repository<Resume>,
  ) {}

  async inferFileType(buffer: Buffer): Promise<"pdf" | "docx"> {
    try {
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

    throw new BadRequestException(
      "Unsupported or unrecognized file type - please upload a valid PDF or DOCX file",
    );
  }

  async extractText(buffer: Buffer, fileType: "pdf" | "docx"): Promise<string> {
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

    throw new BadRequestException(`Unsupported file type: ${fileType}`);
  }

  async uploadResume(userId: string, file: Express.Multer.File): Promise<Resume> {
    try {
      // Validate file type
      const validMimes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!validMimes.includes(file.mimetype)) {
        throw new BadRequestException("Only PDF and DOCX files are allowed");
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException("File size must not exceed 10MB");
      }

      // Detect and extract text
      const fileType = await this.inferFileType(file.buffer);
      const content = await this.extractText(file.buffer, fileType);

      if (!content || content.trim().length < 50) {
        throw new BadRequestException(
          "Resume content too short or empty. Please provide a more detailed resume.",
        );
      }

      // Create resume record
      const resume = this.resumeRepo.create({
        userId,
        filename: file.originalname,
        content,
        mimeType: file.mimetype,
        fileSize: file.size,
      });

      return await this.resumeRepo.save(resume);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to process resume: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getUserResumes(userId: string): Promise<Resume[]> {
    return await this.resumeRepo.find({
      where: {userId},
      order: {createdAt: "DESC"},
    });
  }

  async getResume(resumeId: string, userId: string): Promise<Resume> {
    const resume = await this.resumeRepo.findOne({
      where: {id: resumeId, userId},
    });

    if (!resume) {
      throw new BadRequestException("Resume not found");
    }

    return resume;
  }

  async setDefaultResume(resumeId: string, userId: string): Promise<Resume> {
    // Clear all defaults for user
    await this.resumeRepo.update({userId}, {isDefault: false});

    // Set new default
    await this.resumeRepo.update({id: resumeId, userId}, {isDefault: true});

    return this.getResume(resumeId, userId);
  }

  async deleteResume(resumeId: string, userId: string): Promise<void> {
    const resume = await this.getResume(resumeId, userId);
    await this.resumeRepo.remove(resume);
  }
}
