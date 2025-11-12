import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

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
      leastAwarded: badgeStats[badgeStats.length - 1] || null,
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
}
