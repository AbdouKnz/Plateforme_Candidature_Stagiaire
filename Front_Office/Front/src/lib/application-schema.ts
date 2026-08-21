import { z } from "zod"

const MAX_FILE_SIZE = 8 * 1024 * 1024

const phoneRegex = /^(?:\+216)?\d{8}$/
const emailCheck = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export function createApplicationSchema(t: (key: string) => string) {
  const pdfFile = z
    .instanceof(File, { message: t("validation.cv.required") })
    .refine((file) => file.size > 0, t("validation.cv.required"))
    .refine((file) => file.size <= MAX_FILE_SIZE, t("validation.cv.size"))
    .refine((file) => file.type === "application/pdf", t("validation.cv.format"))

  return z
    .object({
      firstName: z.string().trim().min(2, t("validation.firstName.required")).max(80, t("validation.firstName.tooLong")),
      lastName: z.string().trim().min(2, t("validation.lastName.required")).max(80, t("validation.lastName.tooLong")),
      gender: z.enum(["Male", "Female"], { error: t("validation.gender.required") }),
      email: z.string().email(t("validation.email.invalid")).trim(),
      phone: z.string().trim().regex(phoneRegex, t("validation.phone.digitCount")),
      university: z.string().trim().min(2, t("validation.university.required")),
      degreeLevel: z.string().min(1, t("validation.degreeLevel.required")),

      applicationType: z.string().min(1, t("validation.applicationType.required")),

      firstName2: z.string().optional(),
      lastName2: z.string().optional(),
      gender2: z.enum(["Male", "Female"]).optional(),
      email2: z.string().optional(),
      phone2: z.string().optional(),
      degree2: z.string().optional(),
      university2: z.string().optional(),

      cv: pdfFile,
      motivationLetter: pdfFile.optional(),

      cv2: pdfFile.optional(),
      motivationLetter2: pdfFile.optional(),

      subjects: z.array(z.string()).min(1, t("validation.subjects.required")),
      duration: z.string().min(1, t("validation.duration.required")),
      workingMethod: z.enum(["office", "hybrid", "remote"], { error: t("validation.workingMethod.required") }),
      startDate: z
        .string()
        .min(1, t("validation.startDate.required"))
        .refine((v) => {
          const d = new Date(v)
          if (Number.isNaN(d.getTime())) return false
          d.setHours(0, 0, 0, 0)
          const today = new Date(); today.setHours(0, 0, 0, 0)
          const y = today.getFullYear()
          const mar15 = new Date(y, 2, 15); mar15.setHours(0, 0, 0, 0)
          const year = today > mar15 ? y + 1 : y
          const min = new Date(year, 0, 1); min.setHours(0, 0, 0, 0)
          const max = new Date(year, 2, 15); max.setHours(0, 0, 0, 0)
          return d >= min && d <= max
        }, t("validation.startDate.range"))
        .refine((v) => {
          const d = new Date(v)
          return !Number.isNaN(d.getTime()) && d.getDay() >= 1 && d.getDay() <= 5
        }, t("validation.startDate.weekday")),
    })
    .superRefine((data, ctx) => {
      if (data.applicationType !== "pair") return
      if (!data.firstName2 || data.firstName2.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t("validation.firstName2.required"), path: ["firstName2"] })
      }
      if (!data.lastName2 || data.lastName2.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t("validation.lastName2.required"), path: ["lastName2"] })
      }
      if (!data.email2 || !emailCheck(data.email2)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t("validation.email2.required"), path: ["email2"] })
      }
      if (!data.gender2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t("validation.gender2.required"), path: ["gender2"] })
      }
      if (!data.phone2 || !phoneRegex.test(data.phone2)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t("validation.phone2.required"), path: ["phone2"] })
      }
    })
}

export type ApplicationFormValues = z.infer<ReturnType<typeof createApplicationSchema>>
export type ApplicationInput = z.input<ReturnType<typeof createApplicationSchema>>
