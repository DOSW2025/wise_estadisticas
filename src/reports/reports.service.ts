import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Reporte general del sistema
   * Estadísticas globales de usuarios, puntos, insignias, etc.
   */
  async getSystemOverview() {
    const [
      totalUsers,
      totalTutors,
      totalStudents,
      totalBadges,
      totalBadgesAwarded,
      totalNotifications,
      totalPoints,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'TUTOR' } }),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.badge.count(),
      this.prisma.badgeAward.count(),
      this.prisma.notification.count(),
      this.prisma.score.aggregate({
        _sum: { points: true },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        tutors: totalTutors,
        students: totalStudents,
        admins: totalUsers - totalTutors - totalStudents,
      },
      badges: {
        total: totalBadges,
        awarded: totalBadgesAwarded,
        avgPerUser: totalUsers > 0 ? totalBadgesAwarded / totalUsers : 0,
      },
      notifications: {
        total: totalNotifications,
      },
      points: {
        total: totalPoints._sum.points || 0,
        avgPerUser: totalUsers > 0 ? (totalPoints._sum.points || 0) / totalUsers : 0,
      },
    };
  }

  /**
   * Top usuarios por puntos
   */
  async getTopUsersByPoints(limit = 10) {
    const topScores = await this.prisma.score.findMany({
      take: limit,
      orderBy: { points: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return topScores.map((score, index) => ({
      rank: index + 1,
      userId: score.user.id,
      name: score.user.name,
      email: score.user.email,
      role: score.user.role,
      points: score.points,
    }));
  }

  /**
   * Estadísticas de insignias
   * Cuáles son las más otorgadas, etc.
   */
  async getBadgeStatistics() {
    const badges = await this.prisma.badge.findMany({
      include: {
        awards: true,
      },
    });

    const badgeStats = badges.map((badge) => ({
      badgeId: badge.id,
      name: badge.name,
      description: badge.description,
      timesAwarded: badge.awards.length,
      recipients: badge.awards.map((award) => ({
        userId: award.userId,
        awardedAt: award.awardedAt,
      })),
    }));

    // Ordenar por más otorgadas
    badgeStats.sort((a, b) => b.timesAwarded - a.timesAwarded);

    return {
      totalBadges: badges.length,
      totalAwarded: badgeStats.reduce((sum, b) => sum + b.timesAwarded, 0),
      badges: badgeStats,
      mostAwarded: badgeStats[0] || null,
      leastAwarded: badgeStats.at(-1) || null,
    };
  }

  /**
   * Usuarios más activos
   * Basado en estadísticas de actividad
   */
  async getMostActiveUsers(limit = 10) {
    const activeUsers = await this.prisma.userStats.findMany({
      take: limit,
      orderBy: [
        { sessionsCompleted: 'desc' },
        { totalStudyHours: 'desc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return activeUsers.map((stats, index) => ({
      rank: index + 1,
      userId: stats.user.id,
      name: stats.user.name,
      email: stats.user.email,
      role: stats.user.role,
      totalStudyHours: stats.totalStudyHours,
      sessionsCompleted: stats.sessionsCompleted,
      materialsUploaded: stats.materialsUploaded,
      goalsCompleted: stats.goalsCompleted,
      avgLikes: stats.avgLikes,
    }));
  }

  /**
   * Estadísticas de tutores
   * Promedios, totales, etc.
   */
  async getTutorStatistics() {
    const tutors = await this.prisma.tutorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (tutors.length === 0) {
      return {
        totalTutors: 0,
        averages: {
          rating: 0,
          responseTime: 0,
          sessionsLastMonth: 0,
          availabilityScore: 0,
        },
        topTutors: [],
      };
    }

    const avgRating =
      tutors.reduce((sum, t) => sum + t.avgRating, 0) / tutors.length;
    const avgResponseTime =
      tutors.reduce((sum, t) => sum + t.responseTime, 0) / tutors.length;
    const avgSessions =
      tutors.reduce((sum, t) => sum + t.sessionsLastMonth, 0) / tutors.length;
    const avgAvailability =
      tutors.reduce((sum, t) => sum + t.availabilityScore, 0) / tutors.length;

    // Top tutores por rating
    const topTutors = [...tutors]
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5)
      .map((tutor, index) => ({
        rank: index + 1,
        userId: tutor.user.id,
        name: tutor.user.name,
        avgRating: tutor.avgRating,
        totalRatings: tutor.totalRatings,
        sessionsLastMonth: tutor.sessionsLastMonth,
        subjects: tutor.subjects,
      }));

    return {
      totalTutors: tutors.length,
      averages: {
        rating: Number(avgRating.toFixed(2)),
        responseTime: Number(avgResponseTime.toFixed(2)),
        sessionsLastMonth: Number(avgSessions.toFixed(2)),
        availabilityScore: Number(avgAvailability.toFixed(2)),
      },
      topTutors,
    };
  }

  /**
   * Distribución de puntos
   * Cómo se están ganando los puntos
   */
  async getPointsDistribution() {
    const reasons = await this.prisma.scoreReason.groupBy({
      by: ['reason'],
      _sum: {
        amount: true,
      },
      _count: {
        reason: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    });

    const total = reasons.reduce((sum, r) => sum + (r._sum.amount || 0), 0);

    return {
      total,
      distribution: reasons.map((reason) => ({
        reason: reason.reason,
        totalPoints: reason._sum.amount || 0,
        count: reason._count.reason,
        percentage: total > 0 ? ((reason._sum.amount || 0) / total) * 100 : 0,
      })),
    };
  }

  /**
   * Estadísticas de notificaciones
   * Por tipo, estado, etc.
   */
  async getNotificationStatistics() {
    const [byType, byStatus, recent] = await Promise.all([
      this.prisma.notification.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      this.prisma.notification.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.notification.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return {
      byType: byType.map((item) => ({
        type: item.type,
        count: item._count.type,
      })),
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
      recentNotifications: recent.map((notif) => ({
        id: notif.id,
        type: notif.type,
        status: notif.status,
        title: notif.title,
        userName: notif.user.name,
        createdAt: notif.createdAt,
      })),
    };
  }

  /**
   * Actividad reciente del sistema
   */
  async getRecentActivity(limit = 20) {
    const [recentUsers, recentBadges, recentPoints] = await Promise.all([
      this.prisma.user.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.badgeAward.findMany({
        take: limit,
        orderBy: { awardedAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true },
          },
          badge: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.scoreReason.findMany({
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return {
      recentUsers: recentUsers.map((user) => ({
        type: 'user_created',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        timestamp: user.createdAt,
      })),
      recentBadges: recentBadges.map((award) => ({
        type: 'badge_awarded',
        userId: award.user.id,
        userName: award.user.name,
        badgeName: award.badge.name,
        reason: award.reason,
        timestamp: award.awardedAt,
      })),
      recentPoints: recentPoints.map((reason) => ({
        type: 'points_added',
        userId: reason.user.id,
        userName: reason.user.name,
        reason: reason.reason,
        amount: reason.amount,
        timestamp: reason.date,
      })),
    };
  }

  /**
   * SNAPSHOTS - Guardar snapshot de un reporte
   */
  async saveSnapshot(createSnapshotDto: CreateSnapshotDto) {
    const snapshot = await this.prisma.reportSnapshot.create({
      data: createSnapshotDto,
    });

    await this.auditService.log({
      action: 'REPORT_SNAPSHOT_CREATED',
      userId: createSnapshotDto.createdBy,
      resourceType: 'ReportSnapshot',
      resourceId: snapshot.id,
      metadata: {
        type: snapshot.type,
        name: snapshot.name,
      },
    });

    return snapshot;
  }

  /**
   * SNAPSHOTS - Obtener todos los snapshots con filtros
   */
  async getSnapshots(filters?: {
    type?: string;
    createdBy?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [snapshots, total] = await Promise.all([
      this.prisma.reportSnapshot.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.reportSnapshot.count({ where }),
    ]);

    return {
      data: snapshots,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
  }

  /**
   * SNAPSHOTS - Obtener snapshot por ID
   */
  async getSnapshotById(id: string) {
    return this.prisma.reportSnapshot.findUnique({
      where: { id },
    });
  }

  /**
   * SNAPSHOTS - Obtener snapshots por tipo
   */
  async getSnapshotsByType(type: string, limit = 20) {
    return this.prisma.reportSnapshot.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * SNAPSHOTS - Eliminar snapshot
   */
  async deleteSnapshot(id: string) {
    const snapshot = await this.prisma.reportSnapshot.findUnique({
      where: { id },
    });

    const deleted = await this.prisma.reportSnapshot.delete({
      where: { id },
    });

    if (snapshot) {
      await this.auditService.log({
        action: 'REPORT_SNAPSHOT_DELETED',
        userId: snapshot.createdBy || undefined,
        resourceType: 'ReportSnapshot',
        resourceId: id,
        metadata: {
          type: snapshot.type,
          name: snapshot.name,
        },
      });
    }

    return deleted;
  }

  /**
   * SNAPSHOTS - Generar y guardar snapshot de overview
   */
  async snapshotSystemOverview(createdBy?: string, name?: string) {
    const data = await this.getSystemOverview();

    return this.saveSnapshot({
      type: 'system_overview',
      name: name || `Sistema General - ${new Date().toISOString()}`,
      description: 'Snapshot del reporte general del sistema',
      data,
      createdBy,
    });
  }

  /**
   * SNAPSHOTS - Generar y guardar snapshot de top users
   */
  async snapshotTopUsers(limit = 10, createdBy?: string, name?: string) {
    const data = await this.getTopUsersByPoints(limit);

    return this.saveSnapshot({
      type: 'top_users',
      name: name || `Top ${limit} Usuarios - ${new Date().toISOString()}`,
      description: `Top ${limit} usuarios por puntos`,
      data,
      createdBy,
    });
  }

  /**
   * SNAPSHOTS - Generar y guardar snapshot de tutores
   */
  async snapshotTutorStats(createdBy?: string, name?: string) {
    const data = await this.getTutorStatistics();

    return this.saveSnapshot({
      type: 'tutor_statistics',
      name: name || `Estadísticas Tutores - ${new Date().toISOString()}`,
      description: 'Snapshot de estadísticas de tutores',
      data,
      createdBy,
    });
  }

  /**
   * SNAPSHOTS - Comparar dos snapshots del mismo tipo
   */
  async compareSnapshots(snapshotId1: string, snapshotId2: string) {
    const [snapshot1, snapshot2] = await Promise.all([
      this.getSnapshotById(snapshotId1),
      this.getSnapshotById(snapshotId2),
    ]);

    if (!snapshot1 || !snapshot2) {
      throw new Error('Uno o ambos snapshots no fueron encontrados');
    }

    if (snapshot1.type !== snapshot2.type) {
      throw new Error('Los snapshots deben ser del mismo tipo para comparar');
    }

    return {
      snapshot1: {
        id: snapshot1.id,
        name: snapshot1.name,
        createdAt: snapshot1.createdAt,
        data: snapshot1.data,
      },
      snapshot2: {
        id: snapshot2.id,
        name: snapshot2.name,
        createdAt: snapshot2.createdAt,
        data: snapshot2.data,
      },
      type: snapshot1.type,
      comparison: {
        timeDifference: new Date(snapshot2.createdAt).getTime() - new Date(snapshot1.createdAt).getTime(),
        daysDifference: Math.floor((new Date(snapshot2.createdAt).getTime() - new Date(snapshot1.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      },
    };
  }
}
