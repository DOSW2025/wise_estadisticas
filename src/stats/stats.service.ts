import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Resumen general de materiales
   * - totalMaterials
   * - totalDownloads
   * - averageRating
   * - topMaterials[]
   * - materialsBySubject
   *
   * Nota: usamos consultas SQL crudas porque no hay un modelo Prisma explícito `Material` en el esquema
   * del repositorio; esto evita errores de tipo en tiempo de compilación. Si la tabla `materials`
   * no existe en la base de datos, el endpoint devolverá los valores por defecto (0/[]).
   */
  async getMaterialsSummary() {
    try {
      // total materials
      const totalRes: any = await this.prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM materials`;
      const totalMaterials = Number((totalRes && totalRes[0] && totalRes[0].count) || 0);

      // total downloads
      const downloadsRes: any = await this.prisma.$queryRaw`SELECT COALESCE(SUM(downloads),0)::bigint AS total FROM materials`;
      const totalDownloads = Number((downloadsRes && downloadsRes[0] && downloadsRes[0].total) || 0);

      // average rating
      const avgRes: any = await this.prisma.$queryRaw`SELECT COALESCE(AVG(rating),0) AS avg FROM materials`;
      const averageRating = Number(((avgRes && avgRes[0] && avgRes[0].avg) || 0).toFixed ? Number(avgRes[0].avg).toFixed(2) : (avgRes && avgRes[0] && avgRes[0].avg) || 0);

      // top materials by rating (limit 5)
      const topMaterials: any[] = await this.prisma.$queryRaw`
        SELECT id, title, downloads, rating, subject
        FROM materials
        ORDER BY rating DESC NULLS LAST
        LIMIT 5
      `;

      // materials grouped by subject
      const materialsBySubject: any[] = await this.prisma.$queryRaw`
        SELECT subject, COUNT(*)::int AS count
        FROM materials
        GROUP BY subject
        ORDER BY count DESC
      `;

      return {
        totalMaterials,
        totalDownloads,
        averageRating: Number(averageRating),
        topMaterials: topMaterials || [],
        materialsBySubject: materialsBySubject || [],
      };
    } catch (err: any) {
      this.logger.warn('Error generating materials summary: ' + (err?.message || err));
      // Respuesta segura por defecto si falla la consulta (por ejemplo, tabla no existe)
      return {
        totalMaterials: 0,
        totalDownloads: 0,
        averageRating: 0,
        topMaterials: [],
        materialsBySubject: [],
      };
    }
  }

  /**
   * Top materials mejor calificados
   * - limit: número máximo de resultados
   * - filtrar por mínimo de calificaciones (minRatings)
   */
  async getTopRatedMaterials(limit = 10, minRatings = 5) {
    try {
      const top: any[] = await this.prisma.$queryRaw`
        SELECT id, title, downloads,
          COALESCE(average_rating, rating, 0) AS average_rating,
          COALESCE(ratings_count, total_ratings, ratings, 0)::int AS ratings_count,
          subject
        FROM materials
        WHERE COALESCE(ratings_count, total_ratings, ratings, 0) >= ${minRatings}
        ORDER BY COALESCE(average_rating, rating, 0) DESC NULLS LAST
        LIMIT ${limit}
      `;

      return top || [];
    } catch (err: any) {
      this.logger.warn('Error fetching top rated materials: ' + (err?.message || err));
      return [];
    }
  }

  /**
   * Top materials más descargados
   * - limit: número máximo de resultados
   * - Ordena por downloads DESC
   */
  async getTopDownloadedMaterials(limit = 10) {
    try {
      const top: any[] = await this.prisma.$queryRaw`
        SELECT id, title, COALESCE(downloads, 0)::bigint AS downloads, COALESCE(rating, 0) AS rating
        FROM materials
        ORDER BY COALESCE(downloads, 0) DESC NULLS LAST
        LIMIT ${limit}
      `;

      return top || [];
    } catch (err: any) {
      this.logger.warn('Error fetching top downloaded materials: ' + (err?.message || err));
      return [];
    }
  }

  /**
   * Incrementa el contador de descargas para un material y registra auditoría.
   * Intenta actualizar la tabla `material_stats.total_downloads` y registra un log con AuditService.
   */
  async incrementMaterialDownload(materialId: string, userId?: string, ipAddress?: string) {
    try {
      // Intentamos incrementar en material_stats si existe
      await this.prisma.$executeRawUnsafe(
        `UPDATE material_stats SET total_downloads = total_downloads + 1 WHERE material_id = $1`,
        materialId,
      );

      // Registrar auditoría (no bloquear la operación si falla)
      await this.auditService.log({
        action: 'MATERIAL_DOWNLOADED',
        userId: userId,
        resourceType: 'MaterialStats',
        resourceId: materialId,
        metadata: { note: 'Incremented total_downloads' },
        ipAddress,
      });

      return true;
    } catch (err: any) {
      this.logger.warn('Error incrementing material download: ' + (err?.message || err));
      return false;
    }
  }
}
