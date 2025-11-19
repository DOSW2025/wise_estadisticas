import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(data: {
    userId: string;
    type: 'EMAIL' | 'PUSH' | 'SMS' | 'WEBHOOK';
    title: string;
    message: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });

    await this.auditService.log({
      action: 'NOTIFICATION_CREATED',
      userId: data.userId,
      resourceType: 'Notification',
      resourceId: notification.id,
      metadata: {
        type: data.type,
        title: data.title,
      },
    });

    return notification;
  }

  async findAll() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.notification.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: 'PENDING' | 'SENT' | 'FAILED') {
    const notification = await this.prisma.notification.update({
      where: { id },
      data: {
        status,
        sentAt: status === 'SENT' ? new Date() : undefined,
      },
    });

    await this.auditService.log({
      action: 'NOTIFICATION_STATUS_UPDATED',
      userId: notification.userId,
      resourceType: 'Notification',
      resourceId: id,
      metadata: {
        oldStatus: status,
        newStatus: status,
        sentAt: notification.sentAt,
      },
    });

    return notification;
  }

  async delete(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    const deleted = await this.prisma.notification.delete({
      where: { id },
    });

    if (notification) {
      await this.auditService.log({
        action: 'NOTIFICATION_DELETED',
        userId: notification.userId,
        resourceType: 'Notification',
        resourceId: id,
        metadata: {
          title: notification.title,
          type: notification.type,
        },
      });
    }

    return deleted;
  }
}
