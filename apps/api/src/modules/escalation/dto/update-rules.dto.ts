import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class UpdateRulesDto {
  @ApiProperty({ description: 'Lista de regras (JSON)' })
  @IsArray()
  rules!: unknown[];
}
