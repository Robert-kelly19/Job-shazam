import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {IsNotEmpty, IsOptional, IsString, IsUUID} from "class-validator";
import {User} from "../user/user.entity";

@Entity("resume")
export class Resume {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  filename: string;

  @Column("text")
  @IsNotEmpty()
  @IsString()
  content: string; // Extracted text from PDF/DOCX or pasted text

  @Column({nullable: true})
  @IsOptional()
  @IsString()
  mimeType?: string; // application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document

  @Column({nullable: true})
  @IsOptional()
  fileSize?: number; // Size in bytes

  @Column()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ManyToOne(() => User, {onDelete: "CASCADE"})
  user: User;

  @CreateDateColumn({name: "created_at"})
  createdAt: Date;

  @Column({default: false})
  isDefault: boolean; // Mark default resume for quick access
}
