import { IsEmail, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserProvider } from '../../../shared/models/shared/enums/user.enums';
import { t } from '@/locales/i18n.config';

export class CreateUserDto {
  private locale: string;

  constructor(locale: string = 'es') {
    this.locale = locale;
  }

  @IsEmail({}, { message: t('user.validation.email.invalid', 'es') })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsString({ message: t('user.validation.password.required', 'es') })
  @MinLength(8, { message: t('user.validation.password.minLength', 'es', { min: 8 }) })
  @MaxLength(128, { message: t('user.validation.password.maxLength', 'es', { max: 128 }) })
  password!: string;

  @IsString({ message: t('user.validation.firstName.required', 'es') })
  @MinLength(1, { message: t('user.validation.firstName.minLength', 'es', { min: 1 }) })
  @MaxLength(50, { message: t('user.validation.firstName.maxLength', 'es', { max: 50 }) })
  @Transform(({ value }) => value?.trim())
  firstName!: string;

  @IsString({ message: t('user.validation.lastName.required', 'es') })
  @MinLength(1, { message: t('user.validation.lastName.minLength', 'es', { min: 1 }) })
  @MaxLength(50, { message: t('user.validation.lastName.maxLength', 'es', { max: 50 }) })
  @Transform(({ value }) => value?.trim())
  lastName!: string;

  @IsOptional()
  @IsString({ message: t('user.validation.username.text', 'es') })
  @MinLength(3, { message: t('user.validation.username.minLength', 'es', { min: 3 }) })
  @MaxLength(20, { message: t('user.validation.username.maxLength', 'es', { max: 20 }) })
  @Transform(({ value }) => value?.toLowerCase().trim())
  username?: string;

  @IsOptional()
  provider?: UserProvider = UserProvider.LOCAL;

  toCreateUser() {
    return {
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      username: this.username,
      provider: this.provider || UserProvider.LOCAL,
      locale: this.locale || 'es',
    };
  }
}
