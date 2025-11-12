import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    type: 'EMAIL' | 'PUSH' | 'SMS' | 'WEBHOOK';
    title: string;
    message: string;
  }) {
    return this.prisma.notification.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });
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
    return this.prisma.notification.update({
      where: { id },
      data: {
        status,
        sentAt: status === 'SENT' ? new Date() : undefined,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }
}
