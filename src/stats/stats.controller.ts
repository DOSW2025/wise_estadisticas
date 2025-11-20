import { Controller, Get, Query, Post, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { MaterialsSummaryDto, TopMaterialDto } from './dto/materials-summary.dto';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  // GET /stats/materials/summary
  @Get('materials/summary')
  @ApiOkResponse({ description: 'Resumen general de materiales', type: MaterialsSummaryDto })
  async getMaterialsSummary(): Promise<MaterialsSummaryDto> {
    // retornamos un esquema con valores reales desde el servicio
    return this.statsService.getMaterialsSummary();
  }

  // GET /stats/materials/top-rated?limit=10
  @Get('materials/top-rated')
  @ApiQuery({ name: 'limit', required: false, description: 'Número máximo de resultados', example: 10 })
  @ApiOkResponse({ description: 'Top materiales mejor calificados', type: [TopMaterialDto] })
  async getTopRated(@Query('limit') limit?: string): Promise<TopMaterialDto[]> {
    const lim = limit ? Number.parseInt(limit, 10) : 10;
    return this.statsService.getTopRatedMaterials(lim, 5);
  }

  // GET /stats/materials/top-downloaded?limit=10
  @Get('materials/top-downloaded')
  @ApiQuery({ name: 'limit', required: false, description: 'Número máximo de resultados', example: 10 })
  @ApiOkResponse({ description: 'Top materiales más descargados', type: [TopMaterialDto] })
  async getTopDownloaded(@Query('limit') limit?: string): Promise<TopMaterialDto[]> {
    const lim = limit ? Number.parseInt(limit, 10) : 10;
    return this.statsService.getTopDownloadedMaterials(lim);
  }

  // POST /stats/materials/:id/download - Trigger increment on download
  @Post('materials/:id/download')
  @ApiParam({ name: 'id', description: 'Material id' })
  @ApiOkResponse({ description: 'Incrementa contador de descargas y crea auditoría', type: Boolean })
  async incrementDownload(@Param('id') id: string, @Req() req: any): Promise<boolean> {
    const userId = req.user?.id; // si tienes auth middleware
    const ip = req.ip || req.headers?.['x-forwarded-for'] || undefined;
    return this.statsService.incrementMaterialDownload(id, userId, ip);
  }
}
