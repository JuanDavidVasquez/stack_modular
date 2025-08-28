import { z } from "zod";
import { SupportedLocale, t } from "@/locales/i18n.config";

export const registerSchema = (locale: SupportedLocale) =>
  z.object({
    email: z
      .string({
        required_error: t("auth.validation.required", locale),
        invalid_type_error: t("auth.validation.invalidType", locale),
      })
      .email(t("auth.validation.invalidEmail", locale)),
    
    password: z
      .string({
        required_error: t("auth.validation.required", locale),
        invalid_type_error: t("auth.validation.invalidType", locale),
      })
      .min(8, t("auth.validation.minLength", locale))
      .max(128, t("auth.validation.maxLength", locale)),

    firstName: z
      .string({
        required_error: t("auth.validation.required", locale),
        invalid_type_error: t("auth.validation.invalidType", locale),
      })
      .min(2, t("auth.validation.minLength", locale))
      .max(50, t("auth.validation.maxLength", locale)),

    lastName: z
      .string({
        required_error: t("auth.validation.required", locale),
        invalid_type_error: t("auth.validation.invalidType", locale),
      })
      .min(2, t("auth.validation.minLength", locale))
      .max(50, t("auth.validation.maxLength", locale)),

    username: z
      .string()
      .regex(/^[a-zA-Z0-9_]+$/, t("auth.validation.invalidType", locale))
      .min(3, t("auth.validation.minLength", locale))
      .max(30, t("auth.validation.maxLength", locale))
      .optional(),

    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, t("auth.validation.invalidNumber", locale))
      .optional(),

    deviceName: z
      .string()
      .max(100, t("auth.validation.maxLength", locale))
      .optional(),

    deviceType: z
      .enum(["mobile", "desktop", "tablet"], {
        invalid_type_error: t("auth.validation.invalidType", locale)
      })
      .optional()
  });

export type RegisterParams = z.infer<ReturnType<typeof registerSchema>>;