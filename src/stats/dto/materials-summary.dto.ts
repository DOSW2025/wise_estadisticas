import { ApiProperty } from '@nestjs/swagger';

export class TopMaterialDto {
  @ApiProperty({ description: 'Material id', example: 'a1b2c3' })
  id: string;

  @ApiProperty({ description: 'Title of the material', example: 'Apuntes de Álgebra' })
  title?: string;

  @ApiProperty({ description: 'Number of downloads', example: 123 })
  downloads?: number;

  @ApiProperty({ description: 'Average rating', example: 4.5 })
  rating?: number;

  @ApiProperty({ description: 'Subject name', example: 'Matemáticas' })
  subject?: string;
}

export class SubjectCountDto {
  @ApiProperty({ description: 'Subject name', example: 'Matemáticas' })
  subject: string;

  @ApiProperty({ description: 'Count of materials for the subject', example: 42 })
  count: number;
}

export class MaterialsSummaryDto {
  @ApiProperty({ description: 'Total number of materials', example: 100 })
  totalMaterials: number;

  @ApiProperty({ description: 'Total downloads across materials', example: 1234 })
  totalDownloads: number;

  @ApiProperty({ description: 'Average rating across materials', example: 4.2 })
  averageRating: number;

  @ApiProperty({ description: 'Top materials by rating', type: [TopMaterialDto] })
  topMaterials: TopMaterialDto[];

  @ApiProperty({ description: 'Count of materials grouped by subject', type: [SubjectCountDto] })
  materialsBySubject: SubjectCountDto[];
}
