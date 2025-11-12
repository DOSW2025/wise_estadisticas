import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /ranking/tutors?limit=N - Ranking de tutores
   * Basado en las señales que definiste:
   * - points (score global)
   * - avgRating
   * - responseTime
   * - subjectMatchScore (coincidencia con materia)
   * - availabilityScore (disponibilidad para horario)
   */
  async getTutorRanking(limit = 10, subject?: string) {
    // Obtener todos los tutores con su perfil completo
    const tutors = await this.prisma.user.findMany({
      where: {
        role: 'TUTOR',
        tutorProfile: {
          isNot: null,
        },
      },
      include: {
        score: true,
        tutorProfile: true,
        stats: true,
      },
    });

    // Calcular ranking score para cada tutor
    const rankedTutors = tutors
      .map((tutor) => {
        const points = tutor.score?.points || 0;
        const avgRating = tutor.tutorProfile?.avgRating || 0;
        const responseTime = tutor.tutorProfile?.responseTime || 999;
        const availabilityScore = tutor.tutorProfile?.availabilityScore || 0;

        // Calcular coincidencia de materia si se especificó
        let subjectMatchScore = 0;
        if (subject && tutor.tutorProfile?.subjects) {
          subjectMatchScore = tutor.tutorProfile.subjects.includes(subject)
            ? 1
            : 0;
        }

        // Fórmula de ranking (puedes ajustar los pesos)
        const rankingScore =
          points * 0.3 + // 30% del score
          avgRating * 200 + // 20% (rating de 0-5 * 200)
          (1000 - responseTime) * 0.1 + // 10% (menor tiempo = mejor)
          subjectMatchScore * 300 + // 30% si coincide la materia
          availabilityScore * 100; // 10%

        return {
          userId: tutor.id,
          name: tutor.name,
          email: tutor.email,
          points,
          avgRating,
          totalRatings: tutor.tutorProfile?.totalRatings || 0,
          responseTime,
          subjects: tutor.tutorProfile?.subjects || [],
          availabilityScore,
          sessionsLastMonth: tutor.tutorProfile?.sessionsLastMonth || 0,
          rankingScore,
        };
      })
      .sort((a, b) => b.rankingScore - a.rankingScore) // Ordenar descendente
      .slice(0, limit);

    return rankedTutors;
  }

  /**
   * Actualizar perfil de tutor (para simular cambios en rating, disponibilidad, etc.)
   */
  async updateTutorProfile(
    userId: string,
    updates: {
      avgRating?: number;
      totalRatings?: number;
      responseTime?: number;
      sessionsLastMonth?: number;
      subjects?: string[];
      availabilityScore?: number;
    },
  ) {
    // Verificar si el perfil existe
    const existingProfile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      // Crear perfil si no existe
      return this.prisma.tutorProfile.create({
        data: {
          userId,
          ...updates,
        },
      });
    }

    // Actualizar si existe
    return this.prisma.tutorProfile.update({
      where: { userId },
      data: updates,
    });
  }
}
