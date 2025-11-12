import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // GET /users/:id/score - Ver puntaje y desglose
  @Get(':id/score')
  getScore(@Param('id') id: string) {
    return this.usersService.getScore(id);
  }

  // GET /users/:id/badges - Listar insignias
  @Get(':id/badges')
  getBadges(@Param('id') id: string) {
    return this.usersService.getBadges(id);
  }

  // GET /users/:id/stats - Estadísticas personales
  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.usersService.getStats(id);
  }

  // POST /users/:id/points - Agregar puntos manualmente (para testing)
  @Post(':id/points')
  addPoints(
    @Param('id') id: string,
    @Body() body: { reason: string; amount: number },
  ) {
    return this.usersService.addPoints(id, body.reason, body.amount);
  }
}
