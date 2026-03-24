import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsObject } from 'class-validator';

export class UpdateAgentConfigDto {
  @Allow()
  @IsObject()
  @ApiProperty({ description: 'Configuração JSON do agente' })
  config!: Record<string, unknown>;
}
