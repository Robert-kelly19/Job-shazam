import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Job} from "./job.entity";
import {GetJobsDto, DisplayJobsDto, FilterJobDto} from "./dto/job.dto";

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  async create(jobDto: GetJobsDto): Promise<DisplayJobsDto> {
    // Ensure description is at least an empty string
    if (!jobDto.description) {
      jobDto.description = "";
    }

    const existingJob = await this.jobRepo.findOne({
      where: {applyUrl: jobDto.applyUrl},
    });

    if (existingJob) {
      return new DisplayJobsDto(existingJob);
    }

    const job = this.jobRepo.create({
      ...jobDto,
      detailed: jobDto.detailed,
    });

    const savedJob = await this.jobRepo.save(job);
    return new DisplayJobsDto(savedJob);
  }

  async findAll(): Promise<DisplayJobsDto[]> {
    try {
      console.log("[JobService] Fetching all jobs...");
      const jobs = await this.jobRepo.find({
        order: {postedAt: "DESC"},
      });
      console.log(`[JobService] Found ${jobs.length} jobs.`);
      return jobs.map((job) => new DisplayJobsDto(job));
    } catch (error) {
      console.error("[JobService] findAll failed:", error);
      throw error;
    }
  }

  async findOne(id: string): Promise<DisplayJobsDto | null> {
    const job = await this.jobRepo.findOne({where: {id}});
    return job ? new DisplayJobsDto(job) : null;
  }

  async getFilterJobs(filterDto: FilterJobDto): Promise<DisplayJobsDto[]> {
    const {location, salary, tags} = filterDto;

    const query = this.jobRepo.createQueryBuilder("job");

    if (location) {
      query.andWhere("job.location = :location", {location});
    }

    if (salary) {
      query.andWhere("job.salary ILIKE :salary", {salary: `%${salary}%`});
    }

    if (tags && tags.length) {
      query.andWhere("job.tags && ARRAY[:...tags]", {tags});
    }

    const jobs = await query.getMany();
    return jobs.map((job) => new DisplayJobsDto(job));
  }

  async structureJobDescription(id: string): Promise<DisplayJobsDto | null> {
    const job = await this.jobRepo.findOne({where: {id}});
    if (!job) return null;

    // If already structured, return it
    if (job.detailed && Object.keys(job.detailed).length > 2) {
      return new DisplayJobsDto(job);
    }

    const prompt = `
      You are an expert technical recruiter. Analyze the following job description and extract it into a structured JSON format.
      
      Job Description:
      ${job.description}
      
      Return ONLY the JSON matching this exact structure (no markdown fences, no extra text):
      {
        "aboutUs": "Brief summary of company",
        "roleOverview": "Brief summary of the role",
        "responsibilities": ["bullet", "point", "list"],
        "requirements": {
          "mustHave": ["critical", "skills"],
          "niceToHave": ["bonus", "skills"]
        },
        "whyJoinUs": ["perks", "growth", "culture"],
        "process": ["interview", "steps"],
        "benefits": {
          "health": ["insurance", "wellness"],
          "financial": ["salary", "equity", "bonus"],
          "timeOff": ["vacation", "pto"],
          "learning": ["budget", "courses"],
          "other": ["remote", "gym"]
        }
      }
      
      Guidelines:
      - If a section is not found, leave it as an empty array or null.
      - Be concise but professional.
      - Extract specific data points even if they are buried in long paragraphs.
    `;

    try {
      console.log(`[AI Shazam] Starting structuring for job: ${job.title} (${id})`);
      console.log(`[AI Shazam] API Key Present: ${!!process.env.GEMINI_API_KEY}`);

      const {GoogleGenerativeAI} = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      console.log(`[AI Shazam] Received raw response from AI: ${text.substring(0, 100)}...`);

      // Clean markdown if AI included it
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const structured = JSON.parse(text);
      job.detailed = structured;

      console.log(`[AI Shazam] Successfully parsed JSON and updated job detailed field.`);

      // Also update small description if it was a placeholder
      if (
        job.description &&
        (job.description.includes("Visit the job link") || job.description.length < 50)
      ) {
        job.description = structured.roleOverview || job.title;
      }

      const saved = await this.jobRepo.save(job);
      return new DisplayJobsDto(saved);
    } catch (error) {
      console.error("[AI Shazam] Structuring failed error:", error);
      throw new Error(`Failed to structure job: ${error.message}`);
    }
  }
}
