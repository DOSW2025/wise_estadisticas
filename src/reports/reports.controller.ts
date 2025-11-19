import { Controller, Get, Post, Delete, Query, Param, Body } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // GET /reports/overview - Resumen general del sistema
  @Get('overview')
  getSystemOverview() {
    return this.reportsService.getSystemOverview();
  }

  // GET /reports/top-users?limit=10 - Top usuarios por puntos
  @Get('top-users')
  getTopUsersByPoints(@Query('limit') limit?: string) {
    const limitNum = limit ? Number.parseInt(limit, 10) : 10;
    return this.reportsService.getTopUsersByPoints(limitNum);
  }

  // GET /reports/badges - Estadísticas de insignias
  @Get('badges')
  getBadgeStatistics() {
    return this.reportsService.getBadgeStatistics();
  }

  // GET /reports/active-users?limit=10 - Usuarios más activos
  @Get('active-users')
  getMostActiveUsers(@Query('limit') limit?: string) {
    const limitNum = limit ? Number.parseInt(limit, 10) : 10;
    return this.reportsService.getMostActiveUsers(limitNum);
  }

  // GET /reports/tutors - Estadísticas de tutores
  @Get('tutors')
  getTutorStatistics() {
    return this.reportsService.getTutorStatistics();
  }

  // GET /reports/points-distribution - Distribución de puntos por razón
  @Get('points-distribution')
  getPointsDistribution() {
    return this.reportsService.getPointsDistribution();
  }

  // GET /reports/notifications - Estadísticas de notificaciones
  @Get('notifications')
  getNotificationStatistics() {
    return this.reportsService.getNotificationStatistics();
  }

  // GET /reports/recent-activity?limit=20 - Actividad reciente
  @Get('recent-activity')
  getRecentActivity(@Query('limit') limit?: string) {
    const limitNum = limit ? Number.parseInt(limit, 10) : 20;
    return this.reportsService.getRecentActivity(limitNum);
  }

  // ==================== SNAPSHOTS ====================

  // POST /reports/snapshots - Crear snapshot manual
  @Post('snapshots')
  createSnapshot(@Body() createSnapshotDto: CreateSnapshotDto) {
    return this.reportsService.saveSnapshot(createSnapshotDto);
  }

  // GET /reports/snapshots - Listar snapshots con filtros
  @Get('snapshots')
  getSnapshots(
    @Query('type') type?: string,
    @Query('createdBy') createdBy?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters: any = {};
    if (type) filters.type = type;
    if (createdBy) filters.createdBy = createdBy;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = Number.parseInt(limit, 10);
    if (offset) filters.offset = Number.parseInt(offset, 10);

    return this.reportsService.getSnapshots(filters);
  }

  // GET /reports/snapshots/:id - Obtener snapshot específico
  @Get('snapshots/:id')
  getSnapshotById(@Param('id') id: string) {
    return this.reportsService.getSnapshotById(id);
  }

  // GET /reports/snapshots/type/:type - Obtener snapshots por tipo
  @Get('snapshots/type/:type')
  getSnapshotsByType(
    @Param('type') type: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? Number.parseInt(limit, 10) : 20;
    return this.reportsService.getSnapshotsByType(type, limitNum);
  }

  // DELETE /reports/snapshots/:id - Eliminar snapshot
  @Delete('snapshots/:id')
  deleteSnapshot(@Param('id') id: string) {
    return this.reportsService.deleteSnapshot(id);
  }

  // POST /reports/snapshots/overview - Crear snapshot de overview
  @Post('snapshots/overview')
  snapshotSystemOverview(
    @Body('createdBy') createdBy?: string,
    @Body('name') name?: string,
  ) {
    return this.reportsService.snapshotSystemOverview(createdBy, name);
  }

  // POST /reports/snapshots/top-users - Crear snapshot de top users
  @Post('snapshots/top-users')
  snapshotTopUsers(
    @Body('limit') limit?: number,
    @Body('createdBy') createdBy?: string,
    @Body('name') name?: string,
  ) {
    return this.reportsService.snapshotTopUsers(limit || 10, createdBy, name);
  }

  // POST /reports/snapshots/tutors - Crear snapshot de tutores
  @Post('snapshots/tutors')
  snapshotTutorStats(
    @Body('createdBy') createdBy?: string,
    @Body('name') name?: string,
  ) {
    return this.reportsService.snapshotTutorStats(createdBy, name);
  }

  // GET /reports/snapshots/compare/:id1/:id2 - Comparar dos snapshots
  @Get('snapshots/compare/:id1/:id2')
  compareSnapshots(
    @Param('id1') id1: string,
    @Param('id2') id2: string,
  ) {
    return this.reportsService.compareSnapshots(id1, id2);
  }
}
