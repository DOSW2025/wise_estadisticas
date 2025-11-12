import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';

enum Role {
  STUDENT = 'STUDENT',
  TUTOR = 'TUTOR',
  ADMIN = 'ADMIN',
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
