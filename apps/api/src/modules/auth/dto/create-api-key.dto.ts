import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'user-1' })
  @IsString()
  @MinLength(1)
  userId!: string;

  @ApiProperty({ example: 'Integração ERP' })
  @IsString()
  @MinLength(1)
  name!: string;
}
