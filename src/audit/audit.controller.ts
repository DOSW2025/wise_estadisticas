import { Controller, Get, Query, Req, ForbiddenException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ApiTags, ApiQuery, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit/logs
   * - Requiere rol admin (chequeo simple en runtime)
   * - Query: limit, offset, startDate, endDate, action
   */
  @Get('logs')
  @ApiQuery({ name: 'limit', required: false, description: 'Número de resultados por página', example: 100 })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación', example: 0 })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (ISO)', example: '2025-01-01T00:00:00Z' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (ISO)', example: '2025-12-31T23:59:59Z' })
  @ApiQuery({ name: 'action', required: false, description: 'Filtro por tipo de acción (contains)', example: 'MATERIAL_DOWNLOADED' })
  @ApiOkResponse({ description: '200 OK - Lista paginada de logs de auditoría' })
  @ApiBadRequestResponse({ description: '400 Bad Request - Parámetros inválidos' })
  @ApiUnauthorizedResponse({ description: '401 Unauthorized - Autenticación requerida' })
  @ApiForbiddenResponse({ description: '403 Forbidden - Se requiere rol admin' })
  async getLogs(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('action') action?: string,
  ) {
    // Simple role check: requiere que req.user.role === 'ADMIN'
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }
    if (user.role !== 'ADMIN' && user.role !== 'ADMINISTRATOR' && user.role !== 'Admin') {
      throw new ForbiddenException('Admin role required');
    }

    const filters: any = {};
    if (action) filters.action = action;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit, 10);
    if (offset) filters.offset = parseInt(offset, 10);

    return this.auditService.findAll(filters);
  }
}
