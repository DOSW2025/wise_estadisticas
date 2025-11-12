import { Controller, Get, Post, Delete, Param, Body, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(
    @Body()
    body: {
      userId: string;
      type: 'EMAIL' | 'PUSH' | 'SMS' | 'WEBHOOK';
      title: string;
      message: string;
    },
  ) {
    return this.notificationsService.create(body);
  }

  @Get()
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.notificationsService.findById(id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.notificationsService.findByUserId(userId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'PENDING' | 'SENT' | 'FAILED' },
  ) {
    return this.notificationsService.updateStatus(id, body.status);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }
}
