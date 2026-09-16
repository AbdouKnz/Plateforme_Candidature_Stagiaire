import * as React from "react"
import { Controller, useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  BriefcaseIcon,
  CheckIcon,
  ChevronLeftIcon,
  SendIcon,
  UserRoundIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  createApplicationSchema,
  normalizeEmail,
  normalizePhone,
  type ApplicationFormValues,
} from "@/lib/application-schema"
import {
  fetchDegrees,
  fetchSubjects,
  fetchTypes,
  submitCandidature,
} from "@/service/front-office"
import type { Degree, Subject, Type_ } from "@/models/api"
import { useTranslation } from "@/context/language-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SectionHeader } from "@/components/section-header"
import { OptionCards } from "@/components/option-cards"
import { FileDropzone } from "@/components/file-dropzone"
import { MondayPicker } from "@/components/monday-picker"
import { SubjectSelect } from "@/components/subject-select"
import { SuccessScreen } from "@/components/success-screen"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { TUNISIAN_UNIVERSITIES } from "@/lib/universities"
import Stepper, { Step, type StepperHandle } from "@/components/ui/stepper"

type StepId = "candidate" | "internship" | "confirm"
type UploadField = "cv" | "cv2" | "motivationLetter" | "motivationLetter2"

const STEPS: { id: StepId; labelKey: string; icon: React.ElementType }[] = [
  { id: "candidate", labelKey: "step.candidate", icon: UserRoundIcon },
  { id: "internship", labelKey: "step.internship", icon: BriefcaseIcon },
  { id: "confirm", labelKey: "step.confirm", icon: CheckIcon },
]

function isPairApplicationType(value?: string) {
  const normalized = (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

  return normalized === "pair" || normalized === "binome" || normalized === "par binome"
}

function RequiredStar() {
  return <span className="text-destructive">*</span>
}

export function ApplicationForm() {
  const t = useTranslation()
  const [submitted, setSubmitted] = React.useState<{
    fullName: string
    email: string
    email2?: string
  } | null>(null)
  const [fileSelectedAt, setFileSelectedAt] = React.useState<Partial<Record<UploadField, string>>>({})

  const applicationSchema = React.useMemo(() => createApplicationSchema(t), [t])
  const [activeStep, setActiveStep] = React.useState(1)
  const stepperRef = React.useRef<StepperHandle>(null)
  const [degrees, setDegrees] = React.useState<Degree[]>([])
  const [subjects, setSubjects] = React.useState<Subject[]>([])
  const [types, setTypes] = React.useState<Type_[]>([])
  const [loadingOptions, setLoadingOptions] = React.useState(true)

  const {
    control,
    register,
    handleSubmit,
    trigger,
    reset,
    getValues,
    setValue,
    watch,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema as any) as unknown as Resolver<ApplicationFormValues>,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "" as any,
      email: "",
      phone: "",
      university: "",
      degreeLevel: "",
      applicationType: "",
      duration: "",
      workingMethod: "" as any,
      startDate: "",
      subjects: [],
      cv: undefined,
      motivationLetter: undefined,
      cv2: undefined,
      motivationLetter2: undefined,
    },
  })

  React.useEffect(() => {
    Promise.all([fetchDegrees(), fetchSubjects(), fetchTypes()])
      .then(([deg, subj, typ]) => {
        setDegrees(deg)
        setSubjects(subj)
        setTypes(typ)
        // Prefill subjects from PFE Book shortlist (stored as codes)
        try {
          const raw = localStorage.getItem("pfe-book-shortlist")
          if (raw) {
            const codes: string[] = JSON.parse(raw)
            if (Array.isArray(codes) && codes.length > 0) {
              const matchedSubjects = subj.filter((s) => codes.includes(s.code))
              const names = matchedSubjects.map((s) => s.name)
              if (names.length > 0) {
                setValue("subjects", names, { shouldValidate: true })
                const firstSubj = matchedSubjects[0]
                const period = firstSubj?.period || firstSubj?.duration?.name
                if (period) {
                  setValue("duration", period, { shouldValidate: true })
                }
              }
            }
          }
        } catch {
          // ignore shortlist parse errors
        }
      })
      .catch((err) => {
        console.error("Failed to load form options:", err)
        toast.error("Failed to load form options")
      })
      .finally(() => setLoadingOptions(false))
  }, [setValue])

  const watchedSubjects = watch("subjects")
  React.useEffect(() => {
    if (watchedSubjects && watchedSubjects.length > 0 && subjects.length > 0) {
      const chosen = subjects.find((s) => watchedSubjects.includes(s.name))
      const period = chosen?.period || chosen?.duration?.name
      if (period && getValues("duration") !== period) {
        setValue("duration", period, { shouldValidate: true })
      }
    }
  }, [watchedSubjects, subjects, setValue, getValues])

  // After a failed step validation, acknowledge edits immediately instead of
  // keeping the required-field message visible until the whole rule is valid.
  React.useEffect(() => {
    const subscription = watch((_values, { name }) => {
      if (name) clearErrors(name as keyof ApplicationFormValues)
    })

    return () => subscription.unsubscribe()
  }, [watch, clearErrors])

  const dismissFieldError = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return
    const field = target.closest<HTMLElement>("[name], [id], [data-field]")
    const name = field?.getAttribute("name") || field?.getAttribute("data-field") || field?.id
    if (name) clearErrors(name as keyof ApplicationFormValues)
  }

  const applicationType = watch("applicationType")
  const isPair = isPairApplicationType(applicationType)

  const { startMin, startMax } = (() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const y = now.getFullYear()
    const mar15 = new Date(y, 2, 15)
    mar15.setHours(0, 0, 0, 0)
    const year = now > mar15 ? y + 1 : y
    return {
      startMin: `${year}-01-01`,
      startMax: `${year}-03-15`,
    }
  })()

  const currentStepId = STEPS[activeStep - 1].id
  const isConfirmStep = activeStep === STEPS.length

  const applicationTypeSelector = (
    <Controller control={control} name="applicationType" render={({ field }) => (
      <Field data-invalid={!!errors.applicationType}>
        <FieldLabel className="text-sm font-semibold">{t("label.applicationType")}<RequiredStar /></FieldLabel>
        <OptionCards
          name="applicationType"
          ariaLabel={t("label.applicationType")}
          value={field.value}
          onValueChange={(val) => {
            field.onChange(val)
            if (!isPairApplicationType(val)) {
              setValue("firstName2", "")
              setValue("lastName2", "")
              setValue("email2", "")
              setValue("gender2", undefined as any)
              setValue("phone2", "")
              setValue("university2", "")
              setValue("degree2", "")
              setValue("cv2", undefined)
              setValue("motivationLetter2", undefined)
            }
          }}
          onBlur={undefined}
          invalid={!!errors.applicationType}
          columns={types.length >= 2 ? 2 : 1}
          options={[...types].sort((a, b) => {
            const aIsSolo = /^(solo|seul)$/i.test(a.name)
            const bIsSolo = /^(solo|seul)$/i.test(b.name)
            if (aIsSolo && !bIsSolo) return -1
            if (!aIsSolo && bIsSolo) return 1
            return 0
          }).map((t) => ({
            value: t.name,
            title: t.name.charAt(0).toUpperCase() + t.name.slice(1),
          }))}
        />
        <FieldError errors={[errors.applicationType]} />
      </Field>
    )} />
  )

  function getStepFields(stepId: StepId): (keyof ApplicationFormValues)[] {
    const pairExtras: (keyof ApplicationFormValues)[] = isPair
      ? ["firstName2", "lastName2", "gender2", "email2", "phone2", "university2", "degree2", "cv2"]
      : []
    switch (stepId) {
      case "candidate":
        return ["firstName", "lastName", "gender", "email", "phone", "university", "degreeLevel", "applicationType", "cv", ...pairExtras]
      case "internship":
        return ["subjects", "workingMethod", "startDate"]
      case "confirm":
        return []
    }
  }

  async function goNext(): Promise<boolean> {
    const fields = getStepFields(currentStepId)
    const valid = await trigger(fields.length > 0 ? (fields as any) : undefined)
    if (!valid) {
      toast.error(t("error.fields"), {
        description: t("error.fields.desc"),
      })
    }
    return valid
  }

  function handleStepChange(step: number) {
    setActiveStep(step)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleFileSelection(
    fieldName: UploadField,
    file: File | null,
    onChange: (file: File | null) => void
  ) {
    onChange(file)
    setFileSelectedAt((current) => {
      if (!file) {
        const { [fieldName]: _removed, ...remaining } = current
        return remaining
      }
      return { ...current, [fieldName]: new Date().toISOString() }
    })
  }

  async function onSubmit(data: ApplicationFormValues) {
    const fullName = `${data.firstName} ${data.lastName}`.trim()
    const formData = new FormData()
    formData.append("full_name", fullName)
    formData.append("first_name", data.firstName)
    formData.append("last_name", data.lastName)
    formData.append("email1", data.email)
    formData.append("gender1", data.gender)
    formData.append("phone1", data.phone)
    formData.append("degree1", data.degreeLevel)
    formData.append("university", data.university)
    const findSubjectByName = (name: string) => {
      // Trim-compare: stored subject names can drift by whitespace
      // (e.g. "Projet 1 " vs "Projet 1") and exact matching would miss.
      const t = (name || "").trim();
      return subjects.find((s) => s.name === name) ?? subjects.find((s) => (s.name || "").trim() === t);
    };
    const chosenSubject = data.subjects?.map(findSubjectByName).find(Boolean);
    const subjectPeriod = (chosenSubject?.period || chosenSubject?.duration?.name || data.duration || "").trim()
    formData.append("duration", subjectPeriod)
    formData.append("methode", data.workingMethod)
    formData.append("start_date", data.startDate)
    formData.append("subject_name", data.subjects.join(", "))
    // Stable subject identity for duplicate detection (names can be renamed).
    const subjectCodes = (data.subjects ?? [])
      .map((name) => findSubjectByName(name)?.code?.trim())
      .filter((code): code is string => !!code)
    formData.append("subject_code", subjectCodes.join(", "))

    if (data.cv) {
      formData.append("cv", data.cv)
      if (fileSelectedAt.cv) formData.append("cv_selected_at", fileSelectedAt.cv)
    }
    if (data.motivationLetter) {
      formData.append("motivation_letter", data.motivationLetter)
      if (fileSelectedAt.motivationLetter) formData.append("motivation_letter_selected_at", fileSelectedAt.motivationLetter)
    }

    if (isPairApplicationType(data.applicationType)) {
      const firstName2 = (data.firstName2 ?? "").trim()
      const lastName2 = (data.lastName2 ?? "").trim()
      const fullName2 = `${firstName2} ${lastName2}`.trim()
      formData.append("full_name2", fullName2)
      formData.append("first_name2", firstName2)
      formData.append("last_name2", lastName2)
      formData.append("email2", normalizeEmail(data.email2 ?? ""))
      formData.append("gender2", data.gender2 ?? "")
      formData.append("phone2", normalizePhone((data.phone2 ?? "").trim()))
      formData.append("university2", (data.university2 ?? "").trim())
      formData.append("degree2", data.degree2 ?? "")
      if (data.cv2) {
        formData.append("cv2", data.cv2)
        if (fileSelectedAt.cv2) formData.append("cv2_selected_at", fileSelectedAt.cv2)
      }
      if (data.motivationLetter2) {
        formData.append("motivation_letter2", data.motivationLetter2)
        if (fileSelectedAt.motivationLetter2) formData.append("motivation_letter2_selected_at", fileSelectedAt.motivationLetter2)
      }
    }

    try {
      await submitCandidature(formData)
      toast.success(t("toast.submitted"), {
        description: t("toast.submittedDesc"),
      })
      setSubmitted({
        fullName,
        email: data.email,
        email2: isPairApplicationType(data.applicationType) ? data.email2?.trim() || undefined : undefined,
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      console.error("Submission failed:", err)
      const apiErr = err as Error & { status?: number; code?: string }
      const rawMessage = apiErr instanceof Error ? apiErr.message : ""
      const isDuplicate =
        apiErr?.code === "duplicate_candidature" ||
        apiErr?.status === 409 ||
        rawMessage.toLowerCase().includes("already applied")
      if (isDuplicate) {
        toast.error(t("toast.duplicate"), {
          description: t("error.duplicate"),
        })
      } else {
        toast.error(t("toast.submitFailed"), {
          description: rawMessage || t("toast.submitFailedDesc"),
        })
      }
    }
  }

  function onError() {
    toast.error(t("error.submit"), {
      description: t("error.submit.desc"),
    })
  }

  if (submitted) {
    return (
      <SuccessScreen
        fullName={submitted.fullName}
        email={submitted.email}
        email2={submitted.email2}
        onReset={() => {
          reset()
          setFileSelectedAt({})
          setSubmitted(null)
          setActiveStep(1)
        }}
      />
    )
  }

  if (!applicationType) {
    return (
      <Card className="border-0 shadow-md shadow-black/5">
        <CardContent className="flex flex-col gap-8 p-8">
          <SectionHeader
            icon={UserRoundIcon}
            step={t("step1.title")}
            title={t("step1.title")}
            description={t("step1.description")}
          />
          <Separator />
          {applicationTypeSelector}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit, onError)}
        onFocusCapture={(event) => dismissFieldError(event.target)}
        onClickCapture={(event) => dismissFieldError(event.target)}
      >
        <Stepper
          ref={stepperRef}
          initialStep={1}
          onStepChange={handleStepChange}
          backButtonText={t("nav.back")}
          nextButtonText={t("nav.next")}
          beforeNext={goNext}
          disableStepIndicators={false}
          stepLabels={[t("stepper.step1"), t("stepper.step2"), t("stepper.step3")]}
          footerClassName={isConfirmStep ? "stepper-footer-hidden" : ""}
        >
          <Step>
            <Card className="border-border/50 shadow-xs overflow-visible">
              <CardContent className="flex flex-col gap-8 p-8">
                {currentStepId === "candidate" && (
                      <>
                        <SectionHeader
                          icon={UserRoundIcon}
                          step={t("step1.title")}
                          title={t("step1.title")}
                          description={t("step1.description")}
                        />
                        <Separator />
                        {applicationTypeSelector}

                        <FieldGroup className={cn(!isPair && "mx-auto w-full max-w-xl")}>
                          {isPair ? (
                            <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-2">
                              <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("label.firstCandidate")}</span>
                                <div className="h-px flex-1 bg-border" />
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("label.secondCandidate")}</span>
                                <div className="h-px flex-1 bg-border" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="h-px flex-1 bg-border" />
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("step1.title")}</span>
                              <div className="h-px flex-1 bg-border" />
                            </div>
                          )}

                          <div className={cn("grid grid-cols-1 gap-x-8 gap-y-5", isPair && "lg:grid-cols-2")}>
                            <Field orientation="responsive" className="@md/field-group:items-start">
                              <Field data-invalid={!!errors.firstName}>
                                <FieldLabel htmlFor="firstName">{t("label.firstName")}<RequiredStar /></FieldLabel>
                                <Input id="firstName" placeholder={t("placeholder.firstName")} autoComplete="given-name" maxLength={80} aria-invalid={!!errors.firstName} {...register("firstName")} />
                                <FieldError errors={[errors.firstName]} />
                              </Field>
                              <Field data-invalid={!!errors.lastName}>
                                <FieldLabel htmlFor="lastName">{t("label.lastName")}<RequiredStar /></FieldLabel>
                                <Input id="lastName" placeholder={t("placeholder.lastName")} autoComplete="family-name" maxLength={80} aria-invalid={!!errors.lastName} {...register("lastName")} />
                                <FieldError errors={[errors.lastName]} />
                              </Field>
                              <Controller control={control} name="gender" render={({ field }) => (
                                <Field data-invalid={!!errors.gender}>
                                  <FieldLabel htmlFor="gender">{t("label.gender")}<RequiredStar /></FieldLabel>
                                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                                    <SelectTrigger id="gender" aria-invalid={!!errors.gender}>
                                      <SelectValue placeholder={t("placeholder.gender")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectItem value="Female">{t("gender.female")}</SelectItem>
                                        <SelectItem value="Male">{t("gender.male")}</SelectItem>
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                  <FieldError errors={[errors.gender]} />
                                </Field>
                              )} />
                            </Field>
                            {isPair && (
                            <Field orientation="responsive" className="@md/field-group:items-start">
                              <Field data-invalid={!!errors.firstName2}>
                                <FieldLabel htmlFor="firstName2">{t("label.firstName2")}<RequiredStar /></FieldLabel>
                                <Input id="firstName2" placeholder={t("placeholder.firstName2")} autoComplete="given-name" maxLength={80} aria-invalid={!!errors.firstName2} {...register("firstName2")} />
                                <FieldError errors={[errors.firstName2]} />
                              </Field>
                              <Field data-invalid={!!errors.lastName2}>
                                <FieldLabel htmlFor="lastName2">{t("label.lastName2")}<RequiredStar /></FieldLabel>
                                <Input id="lastName2" placeholder={t("placeholder.lastName2")} autoComplete="family-name" maxLength={80} aria-invalid={!!errors.lastName2} {...register("lastName2")} />
                                <FieldError errors={[errors.lastName2]} />
                              </Field>
                              <Controller control={control} name="gender2" render={({ field }) => (
                                <Field data-invalid={!!errors.gender2}>
                                  <FieldLabel htmlFor="gender2">{t("label.gender2")}<RequiredStar /></FieldLabel>
                                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                                    <SelectTrigger id="gender2" aria-invalid={!!errors.gender2}>
                                      <SelectValue placeholder={t("placeholder.gender")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectItem value="Female">{t("gender.female")}</SelectItem>
                                        <SelectItem value="Male">{t("gender.male")}</SelectItem>
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                  <FieldError errors={[errors.gender2]} />
                                </Field>
                              )} />
                            </Field>
                            )}

                            <Field orientation="responsive" className="@md/field-group:items-start">
                              <Field data-invalid={!!errors.email}>
                                <FieldLabel htmlFor="email">{t("label.email")}<RequiredStar /></FieldLabel>
                                <Input id="email" type="email" inputMode="email" placeholder={t("placeholder.email")} autoComplete="email" maxLength={254} aria-invalid={!!errors.email} {...register("email", { onChange: (e) => { e.target.value = e.target.value.replace(/:/g, ""); } })} />
                                <FieldError errors={[errors.email]} />
                              </Field>
                              <Field data-invalid={!!errors.phone}>
                                <FieldLabel htmlFor="phone">{t("label.phone")}<RequiredStar /></FieldLabel>
                                <Input id="phone" type="tel" inputMode="tel" placeholder={t("placeholder.phone")} autoComplete="tel" maxLength={16} aria-invalid={!!errors.phone} {...register("phone")} />
                                <FieldError errors={[errors.phone]} />
                              </Field>
                            </Field>
                            {isPair && (
                            <Field orientation="responsive" className="@md/field-group:items-start">
                              <Field data-invalid={!!errors.email2}>
                                <FieldLabel htmlFor="email2">{t("label.email2")}<RequiredStar /></FieldLabel>
                                <Input id="email2" type="email" inputMode="email" placeholder={t("placeholder.email2")} autoComplete="email" maxLength={254} aria-invalid={!!errors.email2} {...register("email2", { onChange: (e) => { e.target.value = e.target.value.replace(/:/g, ""); } })} />
                                <FieldError errors={[errors.email2]} />
                              </Field>
                              <Field data-invalid={!!errors.phone2}>
                                <FieldLabel htmlFor="phone2">{t("label.phone2")}<RequiredStar /></FieldLabel>
                                <Input id="phone2" type="tel" inputMode="tel" placeholder={t("placeholder.phone2")} autoComplete="tel" maxLength={16} aria-invalid={!!errors.phone2} {...register("phone2")} />
                                <FieldError errors={[errors.phone2]} />
                              </Field>
                            </Field>
                            )}

                            <Controller control={control} name="university" render={({ field }) => (
                              <Field data-invalid={!!errors.university}>
                                <FieldLabel htmlFor="university">{t("label.university")}<RequiredStar /></FieldLabel>
                                <SearchableSelect
                                  value={field.value || ""}
                                  onValueChange={field.onChange}
                                  fieldName="university"
                                  placeholder={t("placeholder.university")}
                                  options={[...TUNISIAN_UNIVERSITIES]}
                                  ariaInvalid={!!errors.university}
                                />
                                <FieldError errors={[errors.university]} />
                              </Field>
                            )} />
                            {isPair && (
                            <Controller control={control} name="university2" render={({ field }) => (
                              <Field data-invalid={!!errors.university2}>
                                <FieldLabel htmlFor="university2">{t("label.university2")}<RequiredStar /></FieldLabel>
                                <SearchableSelect
                                  value={field.value || ""}
                                  onValueChange={field.onChange}
                                  fieldName="university2"
                                  placeholder={t("placeholder.university")}
                                  options={[...TUNISIAN_UNIVERSITIES]}
                                  ariaInvalid={!!errors.university2}
                                />
                                <FieldError errors={[errors.university2]} />
                              </Field>
                            )} />
                            )}

                            <Controller control={control} name="degreeLevel" render={({ field }) => (
                              <Field data-invalid={!!errors.degreeLevel}>
                                <FieldLabel htmlFor="degreeLevel">{t("label.degreeLevel")}<RequiredStar /></FieldLabel>
                                <Select value={field.value || undefined} onValueChange={field.onChange} disabled={loadingOptions}>
                                  <SelectTrigger id="degreeLevel" aria-invalid={!!errors.degreeLevel}>
                                    <SelectValue placeholder={loadingOptions ? "Loading..." : t("placeholder.degreeLevel")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      {degrees.map((d) => (
                                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                                <FieldError errors={[errors.degreeLevel]} />
                              </Field>
                            )} />
                            {isPair && (
                            <Controller control={control} name="degree2" render={({ field }) => (
                              <Field data-invalid={!!errors.degree2}>
                                <FieldLabel htmlFor="degree2">{t("label.degreeLevel2")}<RequiredStar /></FieldLabel>
                                <Select value={field.value || undefined} onValueChange={field.onChange} disabled={loadingOptions}>
                                  <SelectTrigger id="degree2" aria-invalid={!!errors.degree2}>
                                    <SelectValue placeholder={loadingOptions ? "Loading..." : t("placeholder.degreeLevel2")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      {degrees.map((d) => (
                                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                                <FieldError errors={[errors.degree2]} />
                              </Field>
                            )} />
                            )}

                            <Controller control={control} name="cv" render={({ field }) => (
                              <Field data-invalid={!!errors.cv}>
                                <FieldLabel htmlFor="cv">{t("label.cv")}<RequiredStar /></FieldLabel>
                                <FileDropzone id="cv" value={field.value as File | null} onChange={(file) => handleFileSelection("cv", file, field.onChange)} onBlur={field.onBlur} invalid={!!errors.cv} describedBy="cv-help" />

                                <FieldError errors={[errors.cv]} />
                              </Field>
                            )} />
                            {isPair && (
                            <Controller control={control} name="cv2" render={({ field }) => (
                              <Field data-invalid={!!errors.cv2}>
                                <FieldLabel htmlFor="cv2">{t("label.cv2")}<RequiredStar /></FieldLabel>
                                <FileDropzone id="cv2" value={field.value as File | null} onChange={(file) => handleFileSelection("cv2", file, field.onChange)} onBlur={field.onBlur} invalid={!!errors.cv2} />
                                <FieldError errors={[errors.cv2]} />
                              </Field>
                            )} />
                            )}

                            <Controller control={control} name="motivationLetter" render={({ field }) => (
                              <Field data-invalid={!!errors.motivationLetter}>
                                <FieldLabel htmlFor="motivationLetter">{t("label.motivationLetter")}</FieldLabel>
                                <FileDropzone id="motivationLetter" value={field.value as File | null} onChange={(file) => handleFileSelection("motivationLetter", file, field.onChange)} onBlur={field.onBlur} invalid={!!errors.motivationLetter} />
                                <FieldError errors={[errors.motivationLetter]} />
                              </Field>
                            )} />
                            {isPair && (
                            <Controller control={control} name="motivationLetter2" render={({ field }) => (
                              <Field data-invalid={!!errors.motivationLetter2}>
                                <FieldLabel htmlFor="motivationLetter2">{t("label.motivationLetter2")}</FieldLabel>
                                <FileDropzone id="motivationLetter2" value={field.value as File | null} onChange={(file) => handleFileSelection("motivationLetter2", file, field.onChange)} onBlur={field.onBlur} invalid={!!errors.motivationLetter2} />
                                <FieldError errors={[errors.motivationLetter2]} />
                              </Field>
                            )} />
                            )}
                          </div>
                        </FieldGroup>
                      </>
                    )}
              </CardContent>
            </Card>
          </Step>

          <Step>
            <Card className="border-border/50 shadow-xs overflow-visible">
              <CardContent className="flex flex-col gap-8 p-8">
                {currentStepId === "internship" && (
                      <>
                        <SectionHeader
                          icon={BriefcaseIcon}
                          step={t("step2.title")}
                          title={t("step2.title")}
                          description={t("step2.description")}
                        />
                        <Separator />

                        <FieldGroup>
                          {/* Subject (from back office subject management) - multi-select with checkboxes */}
                          <Controller control={control} name="subjects" render={({ field }) => {
                            const selectedNames = new Set((field.value ?? []).map((n) => (n || "").trim()));
                            const selectedSubjects = subjects.filter((s) => selectedNames.has((s.name || "").trim()))
                            return (
                              <Field data-invalid={!!errors.subjects}>
                                <FieldLabel className="text-sm font-semibold">{t("label.subjects")}<RequiredStar /></FieldLabel>
                                <SubjectSelect
                                  options={subjects.map((s) => ({
                                    id: s.name,
                                    title: s.name,
                                  }))}
                                  selected={field.value ?? []}
                                  onChange={(newSelected) => {
                                    field.onChange(newSelected)
                                    if (newSelected.length > 0) {
                                      const chosen = subjects.find((s) => s.name === newSelected[0])
                                      const period = chosen?.period || chosen?.duration?.name
                                      if (period) {
                                        setValue("duration", period, { shouldValidate: true })
                                      }
                                    } else {
                                      setValue("duration", "")
                                    }
                                  }}
                                  fieldName="subjects"
                                  invalid={!!errors.subjects}
                                />

                                {/* Selected subjects details */}
                                {selectedSubjects.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-3">
                                    {selectedSubjects.map((subj) => (
                                      <div
                                        key={subj.id}
                                        className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm min-w-[200px] flex-1"
                                      >
                                        <p className="text-sm font-semibold text-foreground">
                                          {subj.name}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <FieldError errors={[errors.subjects]} />
                              </Field>
                            )
                          }} />


                          {/* Earliest start date */}
                          <Controller control={control} name="startDate" render={({ field }) => (
                            <Field data-invalid={!!errors.startDate} className="@md/field-group:max-w-xs">
                              <FieldLabel htmlFor="startDate" className="text-sm font-semibold">{t("label.startDate")}<RequiredStar /></FieldLabel>
                              <MondayPicker value={field.value || undefined} onChange={field.onChange} onBlur={field.onBlur} fieldName="startDate" min={startMin} max={startMax} invalid={!!errors.startDate} />
                              <FieldError errors={[errors.startDate]} />
                            </Field>
                          )} />

                          {/* Working method */}
                          <Controller control={control} name="workingMethod" render={({ field }) => (
                            <Field data-invalid={!!errors.workingMethod}>
                              <FieldLabel className="text-sm font-semibold">{t("label.workingMethod")}<RequiredStar /></FieldLabel>
                              <OptionCards
                                name="workingMethod"
                                ariaLabel="Preferred working method"
                                value={field.value}
                                onValueChange={field.onChange}
                                onBlur={undefined}
                                invalid={!!errors.workingMethod}
                                columns={3}
                                options={[
                                  { value: "office", title: t("workingMethod.office"), description: t("workingMethod.office.desc") },
                                  { value: "hybrid", title: t("workingMethod.hybrid"), description: t("workingMethod.hybrid.desc") },
                                  { value: "remote", title: t("workingMethod.remote"), description: t("workingMethod.remote.desc") },
                                ]}
                              />
                              <FieldError errors={[errors.workingMethod]} />
                            </Field>
                          )} />
                        </FieldGroup>
                      </>
                    )}
              </CardContent>
            </Card>
          </Step>

          <Step>
            <Card className="border-0 shadow-md">
            <CardContent className="flex flex-col items-center gap-6 px-6 py-10 text-center sm:px-10">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/[0.08] text-primary">
                <CheckIcon className="size-8" strokeWidth={2} />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">{t("confirm.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("confirm.description")}</p>
              </div>

              <div className={cn("grid w-full gap-3 rounded-xl border border-border bg-muted/20 p-4 text-left text-sm sm:p-6", isPair ? "max-w-4xl" : "max-w-lg")}>
                {isPair ? (
                  <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-16">
                      <div className="grid content-start gap-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("label.firstCandidate")}</div>
                        <div className="flex items-baseline gap-2">
                          <span className="w-36 shrink-0 text-muted-foreground">{t("label.fullName")}</span>
                          <span className="shrink-0 text-muted-foreground">:</span>
                          <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{`${getValues("firstName")} ${getValues("lastName")}`.trim()}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="w-36 shrink-0 text-muted-foreground">{t("label.email")}</span>
                          <span className="shrink-0 text-muted-foreground">:</span>
                          <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{getValues("email")}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="w-36 shrink-0 text-muted-foreground">{t("label.phone")}</span>
                          <span className="shrink-0 text-muted-foreground">:</span>
                          <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{getValues("phone")}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="w-36 shrink-0 text-muted-foreground">{t("label.university")}</span>
                          <span className="shrink-0 text-muted-foreground">:</span>
                          <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{getValues("university")}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="w-36 shrink-0 text-muted-foreground">{t("label.degreeLevel")}</span>
                          <span className="shrink-0 text-muted-foreground">:</span>
                          <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{getValues("degreeLevel")}</span>
                        </div>
                      </div>
                      <div className="grid content-start gap-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("label.secondCandidate")}</div>
                        <div className="flex items-baseline gap-2">
                          <span className="w-36 shrink-0 text-muted-foreground">{t("label.fullName")}</span>
                          <span className="shrink-0 text-muted-foreground">:</span>
                          <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{`${getValues("firstName2") ?? ""} ${getValues("lastName2") ?? ""}`.trim()}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="w-36 shrink-0 text-muted-foreground">{t("label.email")}</span>
                          <span className="shrink-0 text-muted-foreground">:</span>
                          <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{getValues("email2")}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="w-36 shrink-0 text-muted-foreground">{t("label.phone")}</span>
                          <span className="shrink-0 text-muted-foreground">:</span>
                          <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{getValues("phone2")}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="w-36 shrink-0 text-muted-foreground">{t("label.university")}</span>
                          <span className="shrink-0 text-muted-foreground">:</span>
                          <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{getValues("university2")}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="w-36 shrink-0 text-muted-foreground">{t("label.degreeLevel")}</span>
                          <span className="shrink-0 text-muted-foreground">:</span>
                          <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{getValues("degree2")}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="w-36 shrink-0 text-muted-foreground">{t("label.fullName")}</span>
                      <span className="shrink-0 text-muted-foreground">:</span>
                      <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{`${getValues("firstName")} ${getValues("lastName")}`.trim()}</span>
                    </div>
                    <Separator />
                    <div className="flex items-baseline gap-2">
                      <span className="w-36 shrink-0 text-muted-foreground">{t("label.email")}</span>
                      <span className="shrink-0 text-muted-foreground">:</span>
                      <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{getValues("email")}</span>
                    </div>
                    <Separator />
                    <div className="flex items-baseline gap-2">
                      <span className="w-36 shrink-0 text-muted-foreground">{t("label.phone")}</span>
                      <span className="shrink-0 text-muted-foreground">:</span>
                      <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{getValues("phone")}</span>
                    </div>
                    <Separator />
                    <div className="flex items-baseline gap-2">
                      <span className="w-36 shrink-0 text-muted-foreground">{t("label.university")}</span>
                      <span className="shrink-0 text-muted-foreground">:</span>
                      <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{getValues("university")}</span>
                    </div>
                    <Separator />
                    <div className="flex items-baseline gap-2">
                      <span className="w-36 shrink-0 text-muted-foreground">{t("label.degreeLevel")}</span>
                      <span className="shrink-0 text-muted-foreground">:</span>
                      <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{getValues("degreeLevel")}</span>
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex items-baseline gap-2">
                  <span className="w-36 shrink-0 text-muted-foreground">{t("confirm.subjects")}</span>
                  <span className="shrink-0 text-muted-foreground">:</span>
                  <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">
                    {getValues("subjects")?.join(", ") || "—"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-baseline gap-2">
                  <span className="w-36 shrink-0 text-muted-foreground">{t("confirm.duration")}</span>
                  <span className="shrink-0 text-muted-foreground">:</span>
                  <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">
                    {getValues("duration") || "—"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-baseline gap-2">
                  <span className="w-36 shrink-0 text-muted-foreground">{t("confirm.workingMethod")}</span>
                  <span className="shrink-0 text-muted-foreground">:</span>
                  <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground capitalize">
                    {getValues("workingMethod") === "office" ? t("workingMethod.office")
                      : getValues("workingMethod") === "hybrid" ? t("workingMethod.hybrid")
                      : getValues("workingMethod") === "remote" ? t("workingMethod.remote")
                      : getValues("workingMethod") ?? "—"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-baseline gap-2">
                  <span className="w-36 shrink-0 text-muted-foreground">{t("confirm.startDate")}</span>
                  <span className="shrink-0 text-muted-foreground">:</span>
                  <span className="min-w-0 flex-1 break-words text-left font-medium text-foreground">{getValues("startDate") ? getValues("startDate").split("-").reverse().join("/") : "—"}</span>
                </div>
              </div>

              <div className="flex w-full max-w-sm flex-col gap-3">
                <Button type="submit" disabled={isSubmitting} className="w-full gap-1.5 text-sm">
                  {isSubmitting ? (
                    <><Spinner data-icon="inline-start" />{t("confirm.submitting")}</>
                  ) : (
                    <><SendIcon className="size-4" />{t("confirm.submit")}</>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => stepperRef.current?.prev()} disabled={isSubmitting} className="gap-1.5 text-sm">
                  <ChevronLeftIcon className="size-4" />{t("confirm.goBack")}
                </Button>
              </div>
            </CardContent>
          </Card>
          </Step>
        </Stepper>
      </form>

      <p className="text-center text-xs text-muted-foreground/60">{t("legal.agree")}</p>
    </div>
  )
}
