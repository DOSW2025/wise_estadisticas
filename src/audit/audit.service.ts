import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registrar un log de auditoría
   */
  async log(data: CreateAuditLogDto) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          action: data.action,
          userId: data.userId,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          metadata: data.metadata || {},
          ipAddress: data.ipAddress,
        },
      });
    } catch (error) {
      // No fallar el proceso principal si falla el log
      console.error('Error registrando auditoría:', error);
      return null;
    }
  }

  /**
   * Obtener todos los logs con filtros opcionales
   */
  async findAll(filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.action) {
      where.action = { contains: filters.action, mode: 'insensitive' };
    }

    if (filters?.resourceType) {
      where.resourceType = filters.resourceType;
    }

    if (filters?.resourceId) {
      where.resourceId = filters.resourceId;
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

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      limit: filters?.limit || 100,
      offset: filters?.offset || 0,
    };
  }

  /**
   * Obtener un log específico por ID
   */
  async findOne(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
    });
  }

  /**
   * Obtener logs por usuario
   */
  async findByUser(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Obtener logs por tipo de recurso
   */
  async findByResourceType(resourceType: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { resourceType },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Obtener logs por acción específica
   */
  async findByAction(action: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getStatistics() {
    const [
      totalLogs,
      byAction,
      byResourceType,
      recentLogs,
    ] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['resourceType'],
        _count: { resourceType: true },
        orderBy: { _count: { resourceType: 'desc' } },
      }),
      this.prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      totalLogs,
      topActions: byAction.map((item) => ({
        action: item.action,
        count: item._count.action,
      })),
      byResourceType: byResourceType.map((item) => ({
        resourceType: item.resourceType,
        count: item._count.resourceType,
      })),
      recentActivity: recentLogs,
    };
  }

  /**
   * Eliminar logs antiguos (para mantenimiento)
   */
  async deleteBefore(date: Date) {
    return this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });
  }
}
