import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

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
}
