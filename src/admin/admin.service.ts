import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Crear nuevo administrador
   */
  async createAdmin(data: { email: string; name: string; password?: string }) {
    // Verificar si el email ya existe
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('Ya existe un usuario con este email');
    }

    // Crear usuario con rol ADMIN
    const admin = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: 'ADMIN',
        score: {
          create: { points: 0 },
        },
        stats: {
          create: {},
        },
      },
      include: {
        score: true,
        stats: true,
      },
    });

    await this.auditService.log({
      action: 'ADMIN_CREATED',
      userId: admin.id,
      resourceType: 'User',
      resourceId: admin.id,
      metadata: {
        email: admin.email,
        name: admin.name,
      },
    });

    return admin;
  }

  /**
   * Listar todos los administradores
   */
  async listAdmins() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        score: {
          select: {
            points: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * POST /admin/award-badge - Otorgar insignia a un usuario
   */
  async awardBadge(userId: string, badgeId: string, reason?: string) {
    // Verificar que el usuario existe
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que la insignia existe
    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
    });
    if (!badge) {
      throw new Error('Insignia no encontrada');
    }

    // Verificar si ya tiene la insignia
    const existing = await this.prisma.badgeAward.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId,
        },
      },
    });

    if (existing) {
      throw new Error('El usuario ya tiene esta insignia');
    }

    // Otorgar insignia
    const award = await this.prisma.badgeAward.create({
      data: {
        userId,
        badgeId,
        reason,
      },
      include: {
        badge: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Emitir evento (opcional)
    // this.eventEmitter.emit('reputation.badge.awarded', { userId, badgeId });

    // Crear notificación para el usuario
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'PUSH',
        title: 'Nueva insignia otorgada',
        message: `Has recibido la insignia "${badge.name}"!`,
        status: 'PENDING',
      },
    });

    await this.auditService.log({
      action: 'BADGE_AWARDED',
      userId,
      resourceType: 'BadgeAward',
      resourceId: award.id,
      metadata: {
        badgeId,
        badgeName: badge.name,
        reason,
        userName: award.user.name,
      },
    });

    return award;
  }

  /**
   * Crear nueva insignia
   */
  async createBadge(data: {
    name: string;
    description: string;
    iconUrl?: string;
    criteria: string;
  }) {
    const badge = await this.prisma.badge.create({
      data,
    });

    await this.auditService.log({
      action: 'BADGE_CREATED',
      resourceType: 'Badge',
      resourceId: badge.id,
      metadata: {
        name: badge.name,
        description: badge.description,
      },
    });

    return badge;
  }

  /**
   * Listar todas las insignias
   */
  async getAllBadges() {
    return this.prisma.badge.findMany({
      include: {
        _count: {
          select: { awards: true },
        },
      },
    });
  }

  /**
   * Evaluar reglas de insignias automáticamente (batch job)
   * Ejemplo: Tutor Destacado, Colaborador Activo, etc.
   */
  async evaluateBadgeRules() {
    const results = {
      tutorDestacado: 0,
      colaboradorActivo: 0,
      mentorDelMes: 0,
    };

    // Regla 1: Tutor Destacado
    results.tutorDestacado = await this.evaluateTutorDestacado();

    // Regla 2: Colaborador Activo
    results.colaboradorActivo = await this.evaluateColaboradorActivo();

    // Regla 3: Mentor del Mes
    results.mentorDelMes = await this.evaluateMentorDelMes();

    return {
      message: 'Evaluación de insignias completada',
      results,
    };
  }

  private async evaluateTutorDestacado(): Promise<number> {
    let count = 0;
    const badge = await this.prisma.badge.findFirst({
      where: { name: 'Tutor Destacado' },
    });

    if (!badge) return count;

    const eligibleTutors = await this.prisma.tutorProfile.findMany({
      where: {
        avgRating: { gte: 4.8 },
        sessionsLastMonth: { gte: 20 },
      },
      include: { user: true },
    });

    for (const tutor of eligibleTutors) {
      try {
        await this.awardBadge(
          tutor.userId,
          badge.id,
          'Automático: avgRating >= 4.8 y 20+ sesiones',
        );
        count++;
      } catch {
        // Usuario ya tiene la insignia, continuar
      }
    }

    return count;
  }

  private async evaluateColaboradorActivo(): Promise<number> {
    let count = 0;
    const badge = await this.prisma.badge.findFirst({
      where: { name: 'Colaborador Activo' },
    });

    if (!badge) return count;

    const eligibleUsers = await this.prisma.userStats.findMany({
      where: {
        materialsUploaded: { gte: 10 },
        avgLikes: { gte: 5 },
      },
    });

    for (const stats of eligibleUsers) {
      try {
        await this.awardBadge(
          stats.userId,
          badge.id,
          'Automático: 10+ materiales con 5+ likes promedio',
        );
        count++;
      } catch {
        // Usuario ya tiene la insignia
      }
    }

    return count;
  }

  private async evaluateMentorDelMes(): Promise<number> {
    let count = 0;
    const badge = await this.prisma.badge.findFirst({
      where: { name: 'Mentor del Mes' },
    });

    if (!badge) return count;

    const topScorers = await this.prisma.score.findMany({
      orderBy: { points: 'desc' },
      take: 3,
    });

    for (const score of topScorers) {
      try {
        await this.awardBadge(
          score.userId,
          badge.id,
          'Automático: Top 3 en puntos del mes',
        );
        count++;
      } catch {
        // Usuario ya tiene la insignia
      }
    }

    return count;
  }
}
