import { ApiProperty } from '@nestjs/swagger';
import { EmailCategory, EmailPriority } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ReclassifyEmailDto {
  @ApiProperty({ enum: EmailCategory })
  @IsEnum(EmailCategory)
  category!: EmailCategory;

  @ApiProperty({ enum: EmailPriority })
  @IsEnum(EmailPriority)
  priority!: EmailPriority;
}
