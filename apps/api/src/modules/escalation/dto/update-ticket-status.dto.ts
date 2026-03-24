import { ApiProperty } from '@nestjs/swagger';
import { EscalationTicketStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: EscalationTicketStatus })
  @IsEnum(EscalationTicketStatus)
  status!: EscalationTicketStatus;
}
