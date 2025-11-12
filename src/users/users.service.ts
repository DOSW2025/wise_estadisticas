import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Crear usuario y su score inicial
  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
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
  }

  // GET /users/:id/score - Ver puntaje y desglose
  async getScore(userId: string) {
    const score = await this.prisma.score.findUnique({
      where: { userId },
      include: {
        reasons: {
          orderBy: { date: 'desc' },
          take: 50,
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!score) {
      throw new Error('Usuario no encontrado');
    }

    return {
      userId: score.userId,
      userName: score.user.name,
      totalPoints: score.points,
      reasons: score.reasons,
    };
  }

  // Sumar puntos (lógica del algoritmo que definiste)
  async addPoints(userId: string, reason: string, amount: number) {
    const score = await this.prisma.score.findUnique({
      where: { userId },
    });

    if (!score) {
      throw new Error('Score no encontrado para el usuario');
    }

    // Actualizar puntos y crear registro de razón
    const updated = await this.prisma.score.update({
      where: { userId },
      data: {
        points: { increment: amount },
        reasons: {
          create: {
            userId,
            reason,
            amount,
          },
        },
      },
      include: {
        reasons: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    // Emitir evento (puedes integrar EventEmitter de NestJS)
    // this.eventEmitter.emit('reputation.score.updated', { userId, points: updated.points });

    return updated;
  }

  // GET /users/:id/badges - Listar insignias del usuario
  async getBadges(userId: string) {
    const badges = await this.prisma.badgeAward.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: { awardedAt: 'desc' },
    });

    return badges.map((award) => ({
      badgeId: award.badge.id,
      name: award.badge.name,
      description: award.badge.description,
      iconUrl: award.badge.iconUrl,
      awardedAt: award.awardedAt,
      reason: award.reason,
    }));
  }

  // GET /users/:id/stats - Estadísticas personales
  async getStats(userId: string) {
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!stats) {
      throw new Error('Usuario no encontrado');
    }

    return {
      userId: stats.userId,
      userName: stats.user.name,
      totalStudyHours: stats.totalStudyHours,
      materialsUploaded: stats.materialsUploaded,
      avgLikes: stats.avgLikes,
      sessionsCompleted: stats.sessionsCompleted,
      goalsCompleted: stats.goalsCompleted,
      lastUpdated: stats.lastUpdated,
    };
  }

  // Incrementar estadísticas (por eventos)
  async incrementStats(
    userId: string,
    updates: {
      studyHours?: number;
      materialsUploaded?: number;
      sessionsCompleted?: number;
      goalsCompleted?: number;
      avgLikes?: number;
    },
  ) {
    return this.prisma.userStats.update({
      where: { userId },
      data: {
        totalStudyHours: updates.studyHours
          ? { increment: updates.studyHours }
          : undefined,
        materialsUploaded: updates.materialsUploaded
          ? { increment: updates.materialsUploaded }
          : undefined,
        sessionsCompleted: updates.sessionsCompleted
          ? { increment: updates.sessionsCompleted }
          : undefined,
        goalsCompleted: updates.goalsCompleted
          ? { increment: updates.goalsCompleted }
          : undefined,
        avgLikes: updates.avgLikes ?? undefined,
      },
    });
  }

  // Buscar usuario por ID
  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        score: true,
        stats: true,
        tutorProfile: true,
      },
    });
  }

  // Obtener todos los usuarios
  async findAll() {
    return this.prisma.user.findMany({
      include: {
        score: true,
        stats: true,
        tutorProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
