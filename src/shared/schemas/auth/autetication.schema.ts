import { z } from "zod";
import { SupportedLocale, t } from "@/locales/i18n.config";

// ===== CHANGE PASSWORD SCHEMA =====
export const changePasswordSchema = (locale: SupportedLocale) =>
  z.object({
    currentPassword: z
      .string({
        required_error: t("auth.validation.required", locale),
        invalid_type_error: t("auth.validation.invalidType", locale),
      })
      .min(1, t("auth.validation.required", locale)),

    newPassword: z
      .string({
        required_error: t("auth.validation.required", locale),
        invalid_type_error: t("auth.validation.invalidType", locale),
      })
      .min(8, t("auth.validation.minLength", locale))
      .max(128, t("auth.validation.maxLength", locale))
  });

export type ChangePasswordParams = z.infer<ReturnType<typeof changePasswordSchema>>;

// ===== RESET PASSWORD SCHEMA =====
export const resetPasswordSchema = (locale: SupportedLocale) =>
  z.object({
    token: z
      .string({
        required_error: t("auth.validation.required", locale),
        invalid_type_error: t("auth.validation.invalidType", locale),
      })
      .min(1, t("auth.validation.required", locale)),

    newPassword: z
      .string({
        required_error: t("auth.validation.required", locale),
        invalid_type_error: t("auth.validation.invalidType", locale),
      })
      .min(8, t("auth.validation.minLength", locale))
      .max(128, t("auth.validation.maxLength", locale))
  });

export type ResetPasswordParams = z.infer<ReturnType<typeof resetPasswordSchema>>;

// ===== EMAIL SCHEMA =====
export const emailSchema = (locale: SupportedLocale) =>
  z.object({
    email: z
      .string({
        required_error: t("auth.validation.required", locale),
        invalid_type_error: t("auth.validation.invalidType", locale),
      })
      .email(t("auth.validation.invalidEmail", locale))
  });

export type EmailParams = z.infer<ReturnType<typeof emailSchema>>;

// ===== REFRESH TOKEN SCHEMA =====
export const refreshTokenSchema = (locale: SupportedLocale) =>
  z.object({
    refreshToken: z
      .string({
        required_error: t("auth.validation.required", locale),
        invalid_type_error: t("auth.validation.invalidType", locale),
      })
      .min(1, t("auth.validation.required", locale))
  });

export type RefreshTokenParams = z.infer<ReturnType<typeof refreshTokenSchema>>;

// ===== UPDATE PROFILE SCHEMA =====
export const updateProfileSchema = (locale: SupportedLocale) =>
  z.object({
    firstName: z
      .string()
      .min(2, t("auth.validation.minLength", locale))
      .max(50, t("auth.validation.maxLength", locale))
      .optional(),

    lastName: z
      .string()
      .min(2, t("auth.validation.minLength", locale))
      .max(50, t("auth.validation.maxLength", locale))
      .optional(),

    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, t("auth.validation.invalidNumber", locale))
      .optional(),

    timezone: z
      .string()
      .max(50, t("auth.validation.maxLength", locale))
      .optional(),

    locale: z
      .string()
      .length(5, t("auth.validation.invalidType", locale))
      .regex(/^[a-z]{2}-[A-Z]{2}$/, t("auth.validation.invalidType", locale))
      .optional()
  })
  .refine(
    (data) => Object.keys(data).some(key => data[key as keyof typeof data] !== undefined),
    {
      message: t("auth.validation.required", locale),
      path: ["root"]
    }
  );

export type UpdateProfileParams = z.infer<ReturnType<typeof updateProfileSchema>>;

// ===== PASSWORD VALIDATION SCHEMA =====
export const passwordValidationSchema = (locale: SupportedLocale) =>
  z.object({
    password: z
      .string({
        required_error: t("auth.validation.required", locale),
        invalid_type_error: t("auth.validation.invalidType", locale),
      })
      .min(1, t("auth.validation.required", locale))
  });

export type PasswordValidationParams = z.infer<ReturnType<typeof passwordValidationSchema>>;

// ===== VERIFY EMAIL SCHEMA =====
export const verifyEmailSchema = (locale: SupportedLocale) =>
  z.object({
    code: z
      .string({
        required_error: t("auth.validation.required", locale),
        invalid_type_error: t("auth.validation.invalidType", locale),
      })
      .length(6, t("auth.validation.invalidType", locale))
      .regex(/^\d{6}$/, t("auth.validation.invalidType", locale))
  });

export type VerifyEmailParams = z.infer<ReturnType<typeof verifyEmailSchema>>;