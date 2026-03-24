import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export class UpdateSettingDto {
  @Allow()
  @ApiProperty({ description: 'Valor JSON' })
  value!: unknown;
}
