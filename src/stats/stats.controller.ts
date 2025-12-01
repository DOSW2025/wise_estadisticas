import { Controller, Get, Query, Post, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiQuery, ApiParam, ApiExtraModels, getSchemaPath, ApiBadRequestResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { MaterialsSummaryDto, TopMaterialDto } from './dto/materials-summary.dto';

@ApiTags('stats')
@ApiExtraModels(TopMaterialDto, MaterialsSummaryDto)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  // GET /stats/materials/summary
  @Get('materials/summary')
  @ApiOkResponse({ description: '200 OK - Resumen general de materiales devuelto correctamente', schema: { $ref: getSchemaPath(MaterialsSummaryDto) } })
  @ApiBadRequestResponse({ description: '400 Bad Request - Parámetros inválidos' })
  @ApiNotFoundResponse({ description: '404 Not Found - Recurso no encontrado' })
  @ApiInternalServerErrorResponse({ description: '500 Internal Server Error - Error interno del servidor' })
  async getMaterialsSummary(): Promise<MaterialsSummaryDto> {
    // retornamos un esquema con valores reales desde el servicio
    return this.statsService.getMaterialsSummary();
  }

  // GET /stats/materials/top-rated?limit=10
  @Get('materials/top-rated')
  @ApiQuery({ name: 'limit', required: false, description: 'Número máximo de resultados', example: 10 })
  @ApiOkResponse({ description: '200 OK - Lista de materiales mejor calificados', schema: { type: 'array', items: { $ref: getSchemaPath(TopMaterialDto) } } })
  @ApiBadRequestResponse({ description: '400 Bad Request - Parámetros inválidos (ej: limit no numérico)' })
  @ApiNotFoundResponse({ description: '404 Not Found - No se encontraron materiales' })
  @ApiInternalServerErrorResponse({ description: '500 Internal Server Error - Error interno del servidor' })
  async getTopRated(@Query('limit') limit?: string): Promise<TopMaterialDto[]> {
    const lim = limit ? Number.parseInt(limit, 10) : 10;
    return this.statsService.getTopRatedMaterials(lim, 5);
  }

  // GET /stats/materials/top-downloaded?limit=10
  @Get('materials/top-downloaded')
  @ApiQuery({ name: 'limit', required: false, description: 'Número máximo de resultados', example: 10 })
  @ApiOkResponse({ description: '200 OK - Lista de materiales más descargados', schema: { type: 'array', items: { $ref: getSchemaPath(TopMaterialDto) } } })
  @ApiBadRequestResponse({ description: '400 Bad Request - Parámetros inválidos (ej: limit no numérico)' })
  @ApiNotFoundResponse({ description: '404 Not Found - No se encontraron materiales' })
  @ApiInternalServerErrorResponse({ description: '500 Internal Server Error - Error interno del servidor' })
  async getTopDownloaded(@Query('limit') limit?: string): Promise<TopMaterialDto[]> {
    const lim = limit ? Number.parseInt(limit, 10) : 10;
    return this.statsService.getTopDownloadedMaterials(lim);
  }

  // POST /stats/materials/:id/download - Trigger increment on download
  @Post('materials/:id/download')
  @ApiParam({ name: 'id', description: 'Material id' })
  @ApiOkResponse({ description: '200 OK - Incremento de descargas registrado correctamente', schema: { type: 'boolean' } })
  @ApiBadRequestResponse({ description: '400 Bad Request - ID inválido' })
  @ApiUnauthorizedResponse({ description: '401 Unauthorized - Autenticación requerida' })
  @ApiNotFoundResponse({ description: '404 Not Found - Material no encontrado' })
  @ApiInternalServerErrorResponse({ description: '500 Internal Server Error - Error al procesar la descarga' })
  async incrementDownload(@Param('id') id: string, @Req() req: any): Promise<boolean> {
    const userId = req.user?.id; // si tienes auth middleware
    const ip = req.ip || req.headers?.['x-forwarded-for'] || undefined;
    // Por ahora solo pasamos ip y userId al servicio
    return this.statsService.incrementMaterialDownload(id, userId, ip);
  }
}
