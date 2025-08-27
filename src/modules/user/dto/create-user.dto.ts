import { IsEmail, IsString, IsOptional, MinLength, MaxLength, IsEnum, IsDateString, IsPhoneNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserProvider, UserStatus } from '../../../shared/models/shared/enums/user.enums';
import { isValidEmail, isValidPassword, isValidUsername } from '../../../shared/models/shared/helpers/base-user.helpers';

export class CreateUserDto {
  // ===== CAMPOS OBLIGATORIOS =====
  
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsString({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede exceder 128 caracteres' })
  password!: string;

  @IsString({ message: 'El nombre es obligatorio' })
  @MinLength(1, { message: 'El nombre no puede estar vacío' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  @Transform(({ value }) => value?.trim())
  firstName!: string;

  @IsString({ message: 'El apellido es obligatorio' })
  @MinLength(1, { message: 'El apellido no puede estar vacío' })
  @MaxLength(50, { message: 'El apellido no puede exceder 50 caracteres' })
  @Transform(({ value }) => value?.trim())
  lastName!: string;

  // ===== CAMPOS OPCIONALES =====

  @IsOptional()
  @IsString({ message: 'El username debe ser un texto' })
  @MinLength(3, { message: 'El username debe tener al menos 3 caracteres' })
  @MaxLength(20, { message: 'El username no puede exceder 20 caracteres' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  username?: string;

  @IsOptional()
  @IsString({ message: 'El nombre de display debe ser un texto' })
  @MaxLength(100, { message: 'El nombre de display no puede exceder 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  displayName?: string;

  @IsOptional()
  @IsEnum(UserProvider, { message: 'El proveedor debe ser uno de los valores válidos' })
  provider?: UserProvider = UserProvider.LOCAL;

  @IsOptional()
  @IsString({ message: 'El provider ID debe ser un texto' })
  providerId?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'El estado debe ser uno de los valores válidos' })
  status?: UserStatus = UserStatus.ACTIVE;

  // ===== INFORMACIÓN ADICIONAL =====

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  phone?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe tener un formato válido' })
  dateOfBirth?: string; // Se convertirá a Date en el service

  @IsOptional()
  @IsString({ message: 'La zona horaria debe ser un texto' })
  @MaxLength(50, { message: 'La zona horaria no puede exceder 50 caracteres' })
  timezone?: string = 'UTC';

  @IsOptional()
  @IsString({ message: 'El idioma debe ser un texto' })
  @MaxLength(5, { message: 'El idioma no puede exceder 5 caracteres' })
  locale?: string = 'es';

  // ===== ROLES (Si los manejas) =====
  @IsOptional()
  roles?: string[] = ['user'];

  // ===== VALIDACIONES PERSONALIZADAS =====

  /**
   * Validar email personalizado
   */
  validateEmail(): boolean {
    return isValidEmail(this.email);
  }

  /**
   * Validar password personalizado
   */
  validatePassword(): boolean {
    return isValidPassword(this.password);
  }

  /**
   * Validar username personalizado
   */
  validateUsername(): boolean {
    return !this.username || isValidUsername(this.username);
  }
  

  /**
   * Convertir a objeto para crear usuario
   */
  toCreateUser() {
    return {
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      username: this.username,
      displayName: this.displayName,
      provider: this.provider || UserProvider.LOCAL,
      providerId: this.providerId,
      status: this.status || UserStatus.ACTIVE,
      phone: this.phone,
      dateOfBirth: this.dateOfBirth ? new Date(this.dateOfBirth) : undefined,
      timezone: this.timezone || 'UTC',
      locale: this.locale || 'es',
      isEmailVerified: false,
      loginCount: 0,
      loginAttempts: 0,
    };
  }
}