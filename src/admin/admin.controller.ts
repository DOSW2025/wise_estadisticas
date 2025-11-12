import { Controller, Post, Body, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // POST /admin/create - Crear nuevo administrador
  @Post('create')
  createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.createAdmin(createAdminDto);
  }

  // GET /admin/list - Listar todos los administradores
  @Get('list')
  listAdmins() {
    return this.adminService.listAdmins();
  }

  // POST /admin/award-badge - Otorgar insignia manualmente
  @Post('award-badge')
  awardBadge(
    @Body() body: { userId: string; badgeId: string; reason?: string },
  ) {
    return this.adminService.awardBadge(body.userId, body.badgeId, body.reason);
  }

  // POST /admin/badges - Crear nueva insignia
  @Post('badges')
  createBadge(
    @Body()
    body: {
      name: string;
      description: string;
      iconUrl?: string;
      criteria: string;
    },
  ) {
    return this.adminService.createBadge(body);
  }

  // GET /admin/badges - Listar todas las insignias
  @Get('badges')
  getAllBadges() {
    return this.adminService.getAllBadges();
  }

  // POST /admin/evaluate-badges - Ejecutar evaluación automática de insignias
  @Post('evaluate-badges')
  evaluateBadgeRules() {
    return this.adminService.evaluateBadgeRules();
  }
}
