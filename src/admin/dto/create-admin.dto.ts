export class CreateAdminDto {
  email: string;
  name: string;
  password?: string; // Opcional por si se implementa autenticación
}
