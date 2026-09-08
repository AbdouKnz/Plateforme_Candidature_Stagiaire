import { z } from "zod"

const MAX_FILE_SIZE = 8 * 1024 * 1024
const MAX_NAME_LENGTH = 80
const MAX_EMAIL_LENGTH = 254
const MAX_UNIVERSITY_LENGTH = 120

// Names: letters (accents included), spaces, apostrophes and hyphens — must start with a letter
const nameRegex = /^[\p{L}][\p{L}\s'’\-]*$/u
// Tunisian phone: exactly 8 digits, optional +216 prefix.
// Spaces, dots and dashes are tolerated then stripped before validation.
export const normalizePhone = (v: string) => v.replace(/[\s.\-]/g, "")
export const normalizeEmail = (v: string) => v.trim().toLowerCase()
const phoneRegex = /^(?:\+216)?\d{8}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type T = (key: string) => string

const isBlank = (v: unknown) => v === undefined || v === null || (typeof v === "string" && v.trim() === "")

// Required name: min 2, max 80, letters only
function nameSchema(requiredKey: string, tooLongKey: string, lettersKey: string, t: T) {
  return z
    .string()
    .trim()
    .min(2, t(requiredKey))
    .max(MAX_NAME_LENGTH, t(tooLongKey))
    .regex(nameRegex, t(lettersKey))
}

// Required email: trimmed, lowercased, max 254, valid format
function emailSchema(invalidKey: string, tooLongKey: string, t: T) {
  return z
    .string()
    .trim()
    .min(1, t(invalidKey))
    .max(MAX_EMAIL_LENGTH, t(tooLongKey))
    .toLowerCase()
    .regex(emailRegex, t(invalidKey))
}

// Required phone: normalized (spaces/dots/dashes stripped), then exactly 8 digits (+216 optional)
function phoneSchema(requiredKey: string, digitCountKey: string, t: T) {
  return z
    .string()
    .trim()
    .min(1, t(requiredKey))
    .transform(normalizePhone)
    .pipe(z.string().regex(phoneRegex, t(digitCountKey)))
}

// Optional name (second candidate base): valid format as soon as it is filled in
function optionalNameSchema(tooLongKey: string, lettersKey: string, invalidKey: string, t: T) {
  return z
    .string()
    .optional()
    .superRefine((v, ctx) => {
      if (isBlank(v)) return
      const value = (v as string).trim()
      if (value.length > 0 && value.length < 2) {
        ctx.addIssue({ code: "custom", message: t(invalidKey) })
      } else if (value.length > MAX_NAME_LENGTH) {
        ctx.addIssue({ code: "custom", message: t(tooLongKey) })
      } else if (!nameRegex.test(value)) {
        ctx.addIssue({ code: "custom", message: t(lettersKey) })
      }
    })
}

// Optional email (second candidate base): valid format as soon as it is filled in
function optionalEmailSchema(invalidKey: string, tooLongKey: string, t: T) {
  return z
    .string()
    .optional()
    .superRefine((v, ctx) => {
      if (isBlank(v)) return
      const value = (v as string).trim()
      if (value.length > MAX_EMAIL_LENGTH) {
        ctx.addIssue({ code: "custom", message: t(tooLongKey) })
      } else if (!emailRegex.test(value)) {
        ctx.addIssue({ code: "custom", message: t(invalidKey) })
      }
    })
}

// Optional phone (second candidate base): valid format as soon as it is filled in
function optionalPhoneSchema(digitCountKey: string, t: T) {
  return z
    .string()
    .optional()
    .refine(
      (v) => {
        if (isBlank(v)) return true
        return phoneRegex.test(normalizePhone((v as string).trim()))
      },
      { message: t(digitCountKey) }
    )
}

export function createApplicationSchema(t: (key: string) => string) {
  const pdfFile = z
    .instanceof(File, { message: t("validation.cv.required") })
    .refine((file) => file.size > 0, t("validation.cv.required"))
    .refine((file) => file.size <= MAX_FILE_SIZE, t("validation.cv.size"))
    .refine((file) => file.type === "application/pdf", t("validation.cv.format"))

  return z
    .object({
      // ── First candidate ──────────────────────────────────────────
      firstName: nameSchema("validation.firstName.required", "validation.firstName.tooLong", "validation.firstName.letters", t),
      lastName: nameSchema("validation.lastName.required", "validation.lastName.tooLong", "validation.lastName.letters", t),
      gender: z.enum(["Male", "Female"], { error: t("validation.gender.required") }),
      email: emailSchema("validation.email.invalid", "validation.email.tooLong", t),
      phone: phoneSchema("validation.phone.required", "validation.phone.digitCount", t),
      university: z
        .string()
        .trim()
        .min(2, t("validation.university.required"))
        .max(MAX_UNIVERSITY_LENGTH, t("validation.university.tooLong")),
      degreeLevel: z.string().min(1, t("validation.degreeLevel.required")),

      applicationType: z.string().min(1, t("validation.applicationType.required")),

      // ── Second candidate (format checked when filled; required in pair mode) ──
      firstName2: optionalNameSchema(
        "validation.firstName2.tooLong",
        "validation.firstName2.letters",
        "validation.firstName2.required",
        t
      ),
      lastName2: optionalNameSchema(
        "validation.lastName2.tooLong",
        "validation.lastName2.letters",
        "validation.lastName2.required",
        t
      ),
      gender2: z.enum(["Male", "Female"]).optional(),
      email2: optionalEmailSchema("validation.email2.required", "validation.email2.tooLong", t),
      phone2: optionalPhoneSchema("validation.phone2.digitCount", t),
      degree2: z.string().optional(),
      university2: z.string().optional(),

      // ── Files: PDF only, 8 MB max ────────────────────────────────
      cv: pdfFile,
      motivationLetter: pdfFile.optional(),

      cv2: pdfFile.optional(),
      motivationLetter2: pdfFile.optional(),

      // ── Internship ───────────────────────────────────────────────
      subjects: z
        .array(z.string().trim().min(1))
        .min(1, t("validation.subjects.required")),
      duration: z.string().optional().default(""),
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
      const issue = (message: string, path: (keyof typeof data)[]) =>
        ctx.addIssue({ code: "custom" as const, message, path })

      // Second candidate identity — same strictness as the first candidate
      const first2 = (data.firstName2 ?? "").trim()
      if (first2.length < 2) {
        issue(t("validation.firstName2.required"), ["firstName2"])
      } else if (first2.length > MAX_NAME_LENGTH) {
        issue(t("validation.firstName2.tooLong"), ["firstName2"])
      } else if (!nameRegex.test(first2)) {
        issue(t("validation.firstName2.letters"), ["firstName2"])
      }

      const last2 = (data.lastName2 ?? "").trim()
      if (last2.length < 2) {
        issue(t("validation.lastName2.required"), ["lastName2"])
      } else if (last2.length > MAX_NAME_LENGTH) {
        issue(t("validation.lastName2.tooLong"), ["lastName2"])
      } else if (!nameRegex.test(last2)) {
        issue(t("validation.lastName2.letters"), ["lastName2"])
      }

      if (!data.gender2) {
        issue(t("validation.gender2.required"), ["gender2"])
      }

      const email2 = (data.email2 ?? "").trim()
      if (email2.length === 0 || !emailRegex.test(email2)) {
        issue(t("validation.email2.required"), ["email2"])
      } else if (email2.length > MAX_EMAIL_LENGTH) {
        issue(t("validation.email2.tooLong"), ["email2"])
      }

      const phone2 = normalizePhone((data.phone2 ?? "").trim())
      if (!phoneRegex.test(phone2)) {
        issue(t("validation.phone2.required"), ["phone2"])
      }

      // Second candidate studies — previously never validated
      if (isBlank(data.degree2)) {
        issue(t("validation.degree2.required"), ["degree2"])
      }
      const uni2 = (data.university2 ?? "").trim()
      if (uni2.length < 2) {
        issue(t("validation.university2.required"), ["university2"])
      } else if (uni2.length > MAX_UNIVERSITY_LENGTH) {
        issue(t("validation.university2.tooLong"), ["university2"])
      }

      // Second candidate CV — labelled required in the form, now enforced
      if (!data.cv2) {
        issue(t("validation.cv2.required"), ["cv2"])
      }

      // The two candidates must be two different people
      if (
        email2.length > 0 &&
        emailRegex.test(email2) &&
        email2.toLowerCase() === data.email.trim().toLowerCase()
      ) {
        issue(t("validation.email2.same"), ["email2"])
      }
      if (
        phoneRegex.test(phone2) &&
        phone2 === normalizePhone(data.phone.trim())
      ) {
        issue(t("validation.phone2.same"), ["phone2"])
      }
    })
}

export type ApplicationFormValues = z.infer<ReturnType<typeof createApplicationSchema>>
export type ApplicationInput = z.input<ReturnType<typeof createApplicationSchema>>
