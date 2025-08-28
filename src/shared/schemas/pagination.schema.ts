// src/shared/schemas/pagination.schema.ts
import { z } from "zod";
import { SupportedLocale, t } from "@/locales/i18n.config";


export const paginationSchema = (locale: SupportedLocale) =>
  z.object({
    page: z
      .number({
        required_error: t("pagination.errors.invalidPage", locale),
        invalid_type_error: t("pagination.errors.invalidPage", locale),
      })
      .int()
      .nonnegative(t("pagination.errors.invalidPage", locale))
      .default(1)
      .optional(),
    limit: z
      .number({
        required_error: t("pagination.errors.invalidPageSize", locale),
        invalid_type_error: t("pagination.errors.invalidPageSize", locale),
      })
      .int()
      .positive(t("pagination.errors.invalidPageSize", locale))
      .default(10)
      .optional(),
    offset: z
      .number()
      .int()
      .nonnegative()
      .default(0)
      .optional(),
    sortBy: z.string().optional(),
    sortOrder: z
      .enum(["asc", "desc"], {
        required_error: t("pagination.errors.requiredSortOrder", locale),
        invalid_type_error: t("pagination.errors.invalidSortOrder", locale),
      })
      .default("asc")
      .optional()
      .refine(
        (val) => ["asc", "desc"].includes(val ?? "asc"),
        {
          message: t("pagination.errors.invalidSortOrder", locale),
        }
      ),
    filters: z.record(z.any()).optional(),
  });

export type PaginationParams = z.infer<ReturnType<typeof paginationSchema>>;
