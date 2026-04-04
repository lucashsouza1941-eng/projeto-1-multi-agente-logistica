import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class LogClientErrorDto {
  @IsString()
  @MaxLength(8000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  stack?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  userAgent?: string;
}
