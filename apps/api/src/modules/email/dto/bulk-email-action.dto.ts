import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsIn, IsString } from 'class-validator';

export class BulkEmailActionDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];

  @ApiProperty({ enum: ['approve', 'reject', 'reclassify'] })
  @IsIn(['approve', 'reject', 'reclassify'])
  action!: 'approve' | 'reject' | 'reclassify';
}
