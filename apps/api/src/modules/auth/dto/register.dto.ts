import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'admin@logiagent.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha-segura-123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(1)
  name!: string;
}
