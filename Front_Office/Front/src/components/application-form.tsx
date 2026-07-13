import * as React from "react"
import { Controller, useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "motion/react"
import {
  BriefcaseIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SendIcon,
  UserRoundIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  createApplicationSchema,
  type ApplicationFormValues,
} from "@/lib/application-schema"
import {
  fetchDegrees,
  fetchDurations,
  fetchSubjects,
  fetchTypes,
  submitCandidature,
} from "@/service/front-office"
import type { Degree, Duration, Subject, Type_ } from "@/models/api"
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

type StepId = "candidate" | "internship" | "confirm"

const STEPS: { id: StepId; labelKey: string; icon: React.ElementType }[] = [
  { id: "candidate", labelKey: "step.candidate", icon: UserRoundIcon },
  { id: "internship", labelKey: "step.internship", icon: BriefcaseIcon },
  { id: "confirm", labelKey: "step.confirm", icon: CheckIcon },
]

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -120 : 120,
    opacity: 0,
  }),
}

export function ApplicationForm() {
  const t = useTranslation()
  const [submitted, setSubmitted] = React.useState<{
    fullName: string
    email: string
  } | null>(null)

  const applicationSchema = React.useMemo(() => createApplicationSchema(t), [t])
  const [currentStep, setCurrentStep] = React.useState(0)
  const [direction, setDirection] = React.useState(0)
  const [degrees, setDegrees] = React.useState<Degree[]>([])
  const [durations, setDurations] = React.useState<Duration[]>([])
  const [subjects, setSubjects] = React.useState<Subject[]>([])
  const [types, setTypes] = React.useState<Type_[]>([])
  const [loadingOptions, setLoadingOptions] = React.useState(true)

  React.useEffect(() => {
    Promise.all([fetchDegrees(), fetchDurations(), fetchSubjects(), fetchTypes()])
      .then(([deg, dur, subj, typ]) => {
        setDegrees(deg)
        setDurations(dur)
        setSubjects(subj)
        setTypes(typ)
      })
      .catch((err) => {
        console.error("Failed to load form options:", err)
        toast.error("Failed to load form options")
      })
      .finally(() => setLoadingOptions(false))
  }, [])

  const {
    control,
    register,
    handleSubmit,
    trigger,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema as any) as unknown as Resolver<ApplicationFormValues>,
    mode: "onBlur",
    defaultValues: {
      fullName: "",
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

  const applicationType = watch("applicationType")
  const isPair = applicationType?.toLowerCase() === "pair"

  const nextMonday = (() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const day = d.getDay()
    const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day
    d.setDate(d.getDate() + daysUntilMonday)
    return d.toISOString().split("T")[0]
  })()

  const currentStepId = STEPS[currentStep].id
  const isConfirmStep = currentStep === STEPS.length - 1

  const applicationTypeSelector = (
    <Controller control={control} name="applicationType" render={({ field }) => (
      <Field data-invalid={!!errors.applicationType}>
        <FieldLabel className="text-sm font-semibold">{t("label.applicationType")}</FieldLabel>
        <OptionCards
          name="applicationType"
          ariaLabel={t("label.applicationType")}
          value={field.value}
          onValueChange={(val) => {
            field.onChange(val)
            if (val.toLowerCase() !== "pair") {
              setValue("fullName2", "")
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
          columns={2}
          options={types.map((t) => ({
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
      ? ["fullName2", "gender2", "email2", "phone2", "university2", "degree2", "cv2"]
      : []
    switch (stepId) {
      case "candidate":
        return ["fullName", "gender", "email", "phone", "university", "degreeLevel", "applicationType", "cv", ...pairExtras]
      case "internship":
        return ["subjects", "duration", "workingMethod", "startDate"]
      case "confirm":
        return []
    }
  }

  async function goNext() {
    const fields = getStepFields(currentStepId)
    const valid = await trigger(fields.length > 0 ? (fields as any) : undefined)
    if (valid) {
      setDirection(1)
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    } else {
      toast.error(t("error.fields"), {
        description: t("error.fields.desc"),
      })
    }
  }

  function goPrev() {
    setDirection(-1)
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  async function onSubmit(data: ApplicationFormValues) {
    const formData = new FormData()
    formData.append("full_name", data.fullName)
    formData.append("email1", data.email)
    formData.append("gender1", data.gender)
    formData.append("phone1", data.phone)
    formData.append("degree1", data.degreeLevel)
    formData.append("university", data.university)
    formData.append("duration", data.duration)
    formData.append("methode", data.workingMethod)
    formData.append("start_date", data.startDate)
    formData.append("subject_name", data.subjects.join(", "))

    if (data.cv) formData.append("cv", data.cv)
    if (data.motivationLetter) formData.append("motivation_letter", data.motivationLetter)

    if (data.applicationType?.toLowerCase() === "pair") {
      formData.append("full_name2", data.fullName2 ?? "")
      formData.append("email2", data.email2 ?? "")
      formData.append("gender2", data.gender2 ?? "")
      formData.append("phone2", data.phone2 ?? "")
      formData.append("university2", data.university2 ?? "")
      formData.append("degree2", data.degree2 ?? "")
      if (data.cv2) formData.append("cv2", data.cv2)
      if (data.motivationLetter2) formData.append("motivation_letter2", data.motivationLetter2)
    }

    try {
      await submitCandidature(formData)
      toast.success(t("toast.submitted"), {
        description: t("toast.submittedDesc"),
      })
      setSubmitted({ fullName: data.fullName, email: data.email })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      console.error("Submission failed:", err)
      toast.error("Submission failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
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
        onReset={() => {
          reset()
          setSubmitted(null)
          setCurrentStep(0)
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
      {/* Stepper */}
      <div className="flex items-center px-1">
        {STEPS.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          const isClickable = index <= currentStep
          const Icon = step.icon
          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => {
                  if (isClickable) {
                    setDirection(index < currentStep ? -1 : 1)
                    setCurrentStep(index)
                  }
                }}
                disabled={!isClickable}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                    isActive && "bg-primary text-primary-foreground ring-2 ring-primary/20",
                    isCompleted && "bg-accent text-accent-foreground cursor-pointer hover:opacity-85",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground/50",
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="size-4" />
                  ) : isActive ? (
                    <Icon className="size-4" />
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-tight tracking-wide transition-colors",
                    isActive && "text-primary font-semibold",
                    isCompleted && "text-accent-foreground",
                    !isActive && !isCompleted && "text-muted-foreground/50",
                  )}
                >
                  {t(step.labelKey)}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <div className="mx-2 flex-1 sm:mx-3">
                  <div className="h-0.5 w-full rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        index < currentStep && "bg-accent",
                      )}
                      style={{ width: index < currentStep ? "100%" : "0%" }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {isConfirmStep ? (
        /* ── Step 3: Confirmation ── */
        <form noValidate onSubmit={handleSubmit(onSubmit, onError)}>
      <Card className="border-0 shadow-md">
            <CardContent className="flex flex-col items-center gap-6 px-6 py-10 text-center sm:px-10">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/[0.08] text-primary">
                <CheckIcon className="size-8" strokeWidth={2} />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">{t("confirm.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("confirm.description")}</p>
              </div>

              <div className="grid w-full max-w-sm gap-3 rounded-xl border border-border bg-muted/20 p-4 text-left text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("label.fullName")}</span>
                  <span className="font-medium text-foreground">{getValues("fullName")}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("label.email")}</span>
                  <span className="font-medium text-foreground">{getValues("email")}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("label.phone")}</span>
                  <span className="font-medium text-foreground">{getValues("phone")}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("label.university")}</span>
                  <span className="font-medium text-foreground">{getValues("university")}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("label.degreeLevel")}</span>
                  <span className="font-medium text-foreground">{getValues("degreeLevel")}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("confirm.type")}</span>
                  <span className="font-medium text-foreground capitalize">{getValues("applicationType")}</span>
                </div>

                {isPair && (
                  <>
                    <Separator />
                    <div className="pt-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("label.secondCandidate")}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("label.fullName")}</span>
                      <span className="font-medium text-foreground">{getValues("fullName2")}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("label.email")}</span>
                      <span className="font-medium text-foreground">{getValues("email2")}</span>
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("label.subjects")}</span>
                  <span className="font-medium text-foreground">
                    {getValues("subjects")?.join(", ") || "—"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("confirm.duration")}</span>
                  <span className="font-medium text-foreground">
                    {getValues("duration") || "—"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("confirm.workingMethod")}</span>
                  <span className="font-medium text-foreground capitalize">
                    {getValues("workingMethod") === "office" ? t("workingMethod.office")
                      : getValues("workingMethod") === "hybrid" ? t("workingMethod.hybrid")
                      : getValues("workingMethod") === "remote" ? t("workingMethod.remote")
                      : getValues("workingMethod") ?? "—"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("confirm.startDate")}</span>
                  <span className="font-medium text-foreground">{getValues("startDate") ?? "—"}</span>
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
                <Button type="button" variant="outline" onClick={goPrev} disabled={isSubmitting} className="gap-1.5 text-sm">
                  <ChevronLeftIcon className="size-4" />{t("confirm.goBack")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      ) : (
        /* ── Form steps ── */
        <form noValidate onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col gap-6">
          <div className="relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStepId}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <Card className="border-border/50 shadow-xs overflow-visible">
                  <CardContent className="flex flex-col gap-8 p-8">

                    {/* ═══════ Step 1: Candidate Info + Documents ═══════ */}
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

                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                          <FieldGroup className={cn(!isPair && "lg:col-span-full mx-auto w-full max-w-xl")}>

                          {/* ── Candidate 1 ── */}
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {isPair ? t("step1.title") + " 1" : t("step1.title")}
                            </span>
                            <div className="h-px flex-1 bg-border" />
                          </div>

                          <Field orientation="responsive" className="@md/field-group:items-start">
                            <Field data-invalid={!!errors.fullName}>
                              <FieldLabel htmlFor="fullName">{t("label.fullName")}</FieldLabel>
                              <Input id="fullName" placeholder={t("placeholder.fullName")} autoComplete="name" aria-invalid={!!errors.fullName} {...register("fullName")} />
                              <FieldError errors={[errors.fullName]} />
                            </Field>
                            <Controller control={control} name="gender" render={({ field }) => (
                              <Field data-invalid={!!errors.gender}>
                                <FieldLabel htmlFor="gender">{t("label.gender")}</FieldLabel>
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

                          <Field orientation="responsive" className="@md/field-group:items-start">
                            <Field data-invalid={!!errors.email}>
                              <FieldLabel htmlFor="email">{t("label.email")}</FieldLabel>
                              <Input id="email" type="email" inputMode="email" placeholder={t("placeholder.email")} autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
                              <FieldError errors={[errors.email]} />
                            </Field>
                            <Field data-invalid={!!errors.phone}>
                              <FieldLabel htmlFor="phone">{t("label.phone")}</FieldLabel>
                              <Input id="phone" type="tel" inputMode="tel" placeholder={t("placeholder.phone")} autoComplete="tel" aria-invalid={!!errors.phone} {...register("phone")} />
                              <FieldError errors={[errors.phone]} />
                            </Field>
                          </Field>

                          <Controller control={control} name="university" render={({ field }) => (
                            <Field data-invalid={!!errors.university}>
                              <FieldLabel htmlFor="university">{t("label.university")}</FieldLabel>
                              <SearchableSelect
                                value={field.value || ""}
                                onValueChange={field.onChange}
                                placeholder={t("placeholder.university")}
                                options={[...TUNISIAN_UNIVERSITIES]}
                                ariaInvalid={!!errors.university}
                                otherOption={t("label.university.other")}
                              />
                              <FieldError errors={[errors.university]} />
                            </Field>
                          )} />

                          <Controller control={control} name="degreeLevel" render={({ field }) => (
                            <Field data-invalid={!!errors.degreeLevel}>
                              <FieldLabel htmlFor="degreeLevel">{t("label.degreeLevel")}</FieldLabel>
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

                          {/* ── Documents C1 ── */}
                          <Controller control={control} name="cv" render={({ field }) => (
                            <Field data-invalid={!!errors.cv}>
                              <FieldLabel htmlFor="cv">{t("label.cv")}<span className="text-destructive">*</span></FieldLabel>
                              <FileDropzone id="cv" value={field.value as File | null} onChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.cv} describedBy="cv-help" />
                              {!errors.cv ? <FieldDescription id="cv-help">{t("label.cv.hint")}</FieldDescription> : null}
                              <FieldError errors={[errors.cv]} />
                            </Field>
                          )} />

                          <Controller control={control} name="motivationLetter" render={({ field }) => (
                            <Field data-invalid={!!errors.motivationLetter}>
                              <FieldLabel htmlFor="motivationLetter">{t("label.motivationLetter")}<span className="text-muted-foreground font-normal"> {t("label.motivationLetter.optional")}</span></FieldLabel>
                              <FileDropzone id="motivationLetter" value={field.value as File | null} onChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.motivationLetter} />
                              <FieldError errors={[errors.motivationLetter]} />
                            </Field>
                          )} />
                          </FieldGroup>
                          {isPair && (
                            <FieldGroup>
                            <div className="flex items-center gap-2">
                              <div className="h-px flex-1 bg-border" />
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("label.secondCandidate")}</span>
                              <div className="h-px flex-1 bg-border" />
                            </div>

                            <Field orientation="responsive" className="@md/field-group:items-start">
                              <Field data-invalid={!!errors.fullName2}>
                                <FieldLabel htmlFor="fullName2">{t("label.fullName2")}</FieldLabel>
                                <Input id="fullName2" placeholder={t("placeholder.fullName2")} autoComplete="name" aria-invalid={!!errors.fullName2} {...register("fullName2")} />
                                <FieldError errors={[errors.fullName2]} />
                              </Field>
                              <Controller control={control} name="gender2" render={({ field }) => (
                                <Field data-invalid={!!errors.gender2}>
                                  <FieldLabel htmlFor="gender2">{t("label.gender2")}</FieldLabel>
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

                            <Field orientation="responsive" className="@md/field-group:items-start">
                              <Field data-invalid={!!errors.email2}>
                                <FieldLabel htmlFor="email2">{t("label.email2")}</FieldLabel>
                                <Input id="email2" type="email" inputMode="email" placeholder={t("placeholder.email2")} autoComplete="email" aria-invalid={!!errors.email2} {...register("email2")} />
                                <FieldError errors={[errors.email2]} />
                              </Field>
                              <Field data-invalid={!!errors.phone2}>
                                <FieldLabel htmlFor="phone2">{t("label.phone2")}</FieldLabel>
                                <Input id="phone2" type="tel" inputMode="tel" placeholder={t("placeholder.phone2")} autoComplete="tel" aria-invalid={!!errors.phone2} {...register("phone2")} />
                                <FieldError errors={[errors.phone2]} />
                              </Field>
                            </Field>

                            <Controller control={control} name="university2" render={({ field }) => (
                              <Field data-invalid={!!errors.university2}>
                                <FieldLabel htmlFor="university2">{t("label.university2")}</FieldLabel>
                                <SearchableSelect
                                  value={field.value || ""}
                                  onValueChange={field.onChange}
                                  placeholder={t("placeholder.university")}
                                  options={[...TUNISIAN_UNIVERSITIES]}
                                  ariaInvalid={!!errors.university2}
                                  otherOption={t("label.university.other")}
                                />
                                <FieldError errors={[errors.university2]} />
                              </Field>
                            )} />

                            <Controller control={control} name="degree2" render={({ field }) => (
                              <Field data-invalid={!!errors.degree2}>
                                <FieldLabel htmlFor="degree2">{t("label.degreeLevel2")}</FieldLabel>
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

                            {/* ── Documents C2 ── */}
                            <Controller control={control} name="cv2" render={({ field }) => (
                              <Field data-invalid={!!errors.cv2}>
                                <FieldLabel htmlFor="cv2">{t("label.cv2")}<span className="text-destructive">*</span></FieldLabel>
                                <FileDropzone id="cv2" value={field.value as File | null} onChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.cv2} />
                                <FieldError errors={[errors.cv2]} />
                              </Field>
                            )} />
                            <Controller control={control} name="motivationLetter2" render={({ field }) => (
                              <Field data-invalid={!!errors.motivationLetter2}>
                                <FieldLabel htmlFor="motivationLetter2">{t("label.motivationLetter2")}<span className="text-muted-foreground font-normal"> {t("label.motivationLetter2.optional")}</span></FieldLabel>
                                <FileDropzone id="motivationLetter2" value={field.value as File | null} onChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.motivationLetter2} />
                                <FieldError errors={[errors.motivationLetter2]} />
                              </Field>
                            )} />
                            </FieldGroup>
                          )}
                        </div>
                      </>
                    )}

                    {/* ═══════ Step 2: Internship Info ═══════ */}
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
                            const selectedSubjects = subjects.filter((s) => field.value?.includes(s.name))
                            return (
                              <Field data-invalid={!!errors.subjects}>
                                <FieldLabel className="text-sm font-semibold">{t("label.subjects")}</FieldLabel>
                                <SubjectSelect
                                  options={subjects.map((s) => ({
                                    id: s.name,
                                    title: s.name,
                                    description: s.description,
                                    department: s.technologies?.map((t) => t.name).join(", "),
                                  }))}
                                  selected={field.value ?? []}
                                  onChange={field.onChange}
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
                                        {subj.description && (
                                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                            {subj.description}
                                          </p>
                                        )}
                                        {subj.technologies &&
                                          subj.technologies.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                              {subj.technologies.map((tech) => (
                                                <span
                                                  key={tech.id}
                                                  className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary"
                                                >
                                                  {tech.name}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <FieldError errors={[errors.subjects]} />
                              </Field>
                            )
                          }} />

                          {/* Duration (from back office duration management) */}
                          <Controller control={control} name="duration" render={({ field }) => (
                            <Field data-invalid={!!errors.duration}>
                              <FieldLabel className="text-sm font-semibold">{t("label.duration")}</FieldLabel>
                              <Select value={field.value || undefined} onValueChange={field.onChange} disabled={loadingOptions}>
                                <SelectTrigger aria-label="Internship duration" aria-invalid={!!errors.duration} className="h-10">
                                  <SelectValue placeholder={loadingOptions ? "Loading..." : t("placeholder.duration")} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    {durations.map((d) => (
                                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                              <FieldError errors={[errors.duration]} />
                            </Field>
                          )} />

                          {/* Earliest start date */}
                          <Controller control={control} name="startDate" render={({ field }) => (
                            <Field data-invalid={!!errors.startDate} className="@md/field-group:max-w-xs">
                              <FieldLabel htmlFor="startDate" className="text-sm font-semibold">{t("label.startDate")}</FieldLabel>
                              <MondayPicker value={field.value || undefined} onChange={field.onChange} onBlur={field.onBlur} min={nextMonday} invalid={!!errors.startDate} />
                              <FieldError errors={[errors.startDate]} />
                            </Field>
                          )} />

                          {/* Working method */}
                          <Controller control={control} name="workingMethod" render={({ field }) => (
                            <Field data-invalid={!!errors.workingMethod}>
                              <FieldLabel className="text-sm font-semibold">{t("label.workingMethod")}</FieldLabel>
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
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={goPrev} disabled={currentStep === 0} className="gap-1.5 text-sm">
              <ChevronLeftIcon className="size-4" />{t("nav.back")}
            </Button>
            <Button type="button" onClick={goNext} className="gap-1.5 text-sm">
              {t("nav.next")}<ChevronRightIcon className="size-4" />
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground/60">{t("legal.agree")}</p>
        </form>
      )}
    </div>
  )
}