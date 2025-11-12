import { Controller, Get, Query, Param, Put, Body } from '@nestjs/common';
import { RankingService } from './ranking.service';

@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  // GET /ranking/tutors?limit=N - Ranking de tutores (según visibilidad)
  @Get('tutors')
  getTutorRanking(
    @Query('limit') limit?: string,
    @Query('subject') subject?: string,
  ) {
    const limitNum = limit ? Number.parseInt(limit, 10) : 10;
    return this.rankingService.getTutorRanking(limitNum, subject);
  }

  // PUT /ranking/tutors/:id/profile - Actualizar perfil de tutor (para testing)
  @Put('tutors/:id/profile')
  updateTutorProfile(
    @Param('id') id: string,
    @Body()
    body: {
      avgRating?: number;
      totalRatings?: number;
      responseTime?: number;
      sessionsLastMonth?: number;
      subjects?: string[];
      availabilityScore?: number;
    },
  ) {
    return this.rankingService.updateTutorProfile(id, body);
  }
}
