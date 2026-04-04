import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Integração ERP' })
  @IsString()
  @MinLength(1)
  name!: string;
}
