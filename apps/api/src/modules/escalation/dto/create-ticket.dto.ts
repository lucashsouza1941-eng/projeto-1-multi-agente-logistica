import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: 'Carga atrasada — cliente X' })
  @IsString()
  @MinLength(1)
  subject!: string;

  @ApiProperty({ example: 'Detalhes da ocorrência…' })
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty({ example: 'high' })
  @IsString()
  @MinLength(1)
  priority!: string;
}
