import { z } from "zod";
import { SupportedLocale, t } from "@/locales/i18n.config";

export const loginSchema = (locale: SupportedLocale) =>
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
      .min(1, t("auth.validation.required", locale)),

    rememberMe: z.boolean().optional(),
    deviceName: z.string().max(100).optional(),
    deviceType: z.enum(["mobile", "desktop", "tablet"]).optional()
  });

export type LoginParams = z.infer<ReturnType<typeof loginSchema>>;