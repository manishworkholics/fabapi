import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for starting a new ingestion job from a URL
 */
export class StartIngestionDto {
  @ApiProperty({
    description: 'Source URL to download the file from',
    example: 'https://example.com/files/project.zip',
  })
  @IsUrl({}, { message: 'sourceUrl must be a valid URL' })
  @IsNotEmpty({ message: 'sourceUrl is required' })
  sourceUrl: string;
}
