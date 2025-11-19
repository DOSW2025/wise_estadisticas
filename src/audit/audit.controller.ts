import { Controller, Get, Param, Query, Delete } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit - Obtener todos los logs con filtros
   * Query params: userId, action, resourceType, resourceId, startDate, endDate, limit, offset
   */
  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters: any = {};

    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (resourceType) filters.resourceType = resourceType;
    if (resourceId) filters.resourceId = resourceId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit, 10);
    if (offset) filters.offset = parseInt(offset, 10);

    return this.auditService.findAll(filters);
  }

  /**
   * GET /audit/statistics - Obtener estadísticas de auditoría
   */
  @Get('statistics')
  async getStatistics() {
    return this.auditService.getStatistics();
  }

  /**
   * GET /audit/user/:userId - Obtener logs de un usuario específico
   */
  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.auditService.findByUser(userId, limitNum);
  }

  /**
   * GET /audit/resource/:resourceType - Obtener logs por tipo de recurso
   */
  @Get('resource/:resourceType')
  async findByResourceType(
    @Param('resourceType') resourceType: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.auditService.findByResourceType(resourceType, limitNum);
  }

  /**
   * GET /audit/action/:action - Obtener logs por acción
   */
  @Get('action/:action')
  async findByAction(
    @Param('action') action: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.auditService.findByAction(action, limitNum);
  }

  /**
   * GET /audit/:id - Obtener un log específico
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }

  /**
   * DELETE /audit/cleanup - Eliminar logs antiguos
   * Query param: beforeDate (ISO string)
   */
  @Delete('cleanup')
  async cleanup(@Query('beforeDate') beforeDate: string) {
    if (!beforeDate) {
      return { error: 'beforeDate query parameter is required' };
    }

    const date = new Date(beforeDate);
    const result = await this.auditService.deleteBefore(date);

    return {
      message: 'Logs eliminados exitosamente',
      count: result.count,
      beforeDate: date,
    };
  }
}
