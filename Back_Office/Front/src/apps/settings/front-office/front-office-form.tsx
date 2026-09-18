import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { PowerIcon, SaveIcon } from "lucide-react"
import { useFrontOfficeStatus, useToggleFrontOffice } from "@/hooks/use-front-office"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { usePermissions } from "@/hooks/use-permissions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { startOfDay, isSameDay } from "date-fns"

export function FrontOfficeForm() {
  const { t } = useTranslation()
  const { data: statusData } = useFrontOfficeStatus()
  const toggleMutation = useToggleFrontOffice()
  const { modulePermissions } = usePermissions()
  const canEditFrontOffice = modulePermissions.settings.canUpdate

  const isEnabled = statusData?.is_enabled ?? true
  const existingDate = statusData?.reopening_date

  // Reopening value is "yyyy-MM-dd" (legacy) or "yyyy-MM-dd HH:mm".
  // Day, hour and minute are tracked separately: picking a date never
  // auto-fills a time, except today which presets to now (rounded up).
  const parseReopeningDay = (value?: string): Date | undefined => {
    if (!value) return undefined
    const [d, storedTime] = value.split(" ")
    const iso = d.length === 10 ? `${d}T${(storedTime ?? "00:00").slice(0, 5)}:00` : value
    const date = new Date(iso)
    return isNaN(date.getTime()) ? undefined : date
  }

  const splitTime = (value?: string): { hour: string | null; minute: string | null } => {
    const part = value?.split(" ")[1]?.slice(0, 5)
    if (!part || !/^\d{2}:\d{2}$/.test(part)) return { hour: null, minute: null }
    return { hour: part.slice(0, 2), minute: part.slice(3, 5) }
  }

  // Next 5-minute mark from now ("14:37" -> "14:40"); null past 23:55.
  const nextTimeMark = (): { hour: string; minute: string } | null => {
    const now = new Date()
    const total = now.getHours() * 60 + now.getMinutes()
    const rounded = Math.ceil((total + 1) / 5) * 5
    if (rounded >= 24 * 60) return null
    return {
      hour: String(Math.floor(rounded / 60)).padStart(2, "0"),
      minute: String(rounded % 60).padStart(2, "0"),
    }
  }

  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(
    () => parseReopeningDay(existingDate)
  )
  const [selectedHour, setSelectedHour] = useState<string | null>(
    () => splitTime(existingDate).hour
  )
  const [selectedMinute, setSelectedMinute] = useState<string | null>(
    () => splitTime(existingDate).minute
  )
  const [datetimeError, setDatetimeError] = useState("")

  const resetReopeningForm = () => {
    setSelectedDay(parseReopeningDay(existingDate))
    const { hour, minute } = splitTime(existingDate)
    setSelectedHour(hour)
    setSelectedMinute(minute)
    setDatetimeError("")
  }

  const handleDayChange = (day: Date | undefined) => {
    setSelectedDay(day)
    setDatetimeError("")
    if (day && isSameDay(day, new Date())) {
      // Today: preset the current time instead of leaving 00:00.
      const mark = nextTimeMark()
      if (mark) {
        setSelectedHour(mark.hour)
        setSelectedMinute(mark.minute)
      }
    }
  }

  const [year, setYear] = useState(statusData?.year ?? "")
  const [internshipTitle, setInternshipTitle] = useState(statusData?.internship_title ?? "")

  useEffect(() => {
    setYear(statusData?.year ?? "")
    setInternshipTitle(statusData?.internship_title ?? "")
  }, [statusData?.year, statusData?.internship_title])

  const handleToggleChange = (checked: boolean) => {
    if (checked) {
      toggleMutation.mutate({ is_enabled: true, year, internship_title: internshipTitle })
    } else {
      resetReopeningForm()
      setShowDisableDialog(true)
    }
  }

  const combinedDateTime = (): Date | undefined => {
    if (!selectedDay || !selectedHour || !selectedMinute) return undefined
    const combined = new Date(selectedDay)
    combined.setHours(Number(selectedHour), Number(selectedMinute), 0, 0)
    return combined
  }

  const handleConfirmDisable = () => {
    // No date at all stays allowed (disable without a reopening date).
    let reopening_date = ""
    if (selectedDay) {
      const combined = combinedDateTime()
      if (!combined) {
        setDatetimeError(t("reopening_time_required"))
        return
      }
      if (combined.getTime() <= Date.now()) {
        setDatetimeError(t("reopening_datetime_past"))
        return
      }
      reopening_date = format(combined, "yyyy-MM-dd HH:mm")
    }
    setDatetimeError("")
    toggleMutation.mutate({
      is_enabled: false,
      reopening_date,
      year,
      internship_title: internshipTitle,
    }, {
      onSuccess: () => setShowDisableDialog(false),
    })
  }

  const handleSaveInfo = () => {
    toggleMutation.mutate({
      is_enabled: isEnabled,
      year,
      internship_title: internshipTitle,
    })
  }

  return (
    <>
      <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm mb-6">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex aspect-square size-10 items-center justify-center rounded-lg ${isEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              <PowerIcon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium leading-none">{t("front_office_status")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isEnabled ? t("front_office_enabled_description") : t("front_office_disabled_description")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="front-office-toggle" className="text-sm font-medium">
              {isEnabled ? t("enabled") : t("disabled")}
            </Label>
            <Switch
              id="front-office-toggle"
              checked={isEnabled}
              onCheckedChange={handleToggleChange}
              disabled={toggleMutation.isPending || !canEditFrontOffice}
            />
          </div>
        </div>
        {!isEnabled && existingDate && (
          <div className="border-t px-6 py-3 bg-muted/30">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              {t("reopening_date")}
            </p>
            <p className="text-sm text-card-foreground">
              {existingDate}
            </p>
          </div>
        )}
      </Card>

      <Card className="bg-card text-card-foreground p-0 gap-0 rounded-xl border shadow-sm mb-6">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-primary/10 text-primary flex aspect-square size-10 items-center justify-center rounded-lg">
              <SaveIcon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium leading-none">{t("internship_title")}</p>
            </div>
          </div>
          <div className="grid gap-4 mt-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="front-office-year" className="text-sm font-medium">
                {t("year")}
              </Label>
              <Input
                id="front-office-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder={t("year_placeholder")}
                disabled={!canEditFrontOffice}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="front-office-title" className="text-sm font-medium">
                {t("internship_title")}
              </Label>
              <Input
                id="front-office-title"
                value={internshipTitle}
                onChange={(e) => setInternshipTitle(e.target.value)}
                placeholder={t("internship_title_placeholder")}
                disabled={!canEditFrontOffice}
              />
            </div>
          </div>
          {canEditFrontOffice && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveInfo}
                disabled={toggleMutation.isPending}
              >
                <SaveIcon className="size-4 mr-2" />
                {t("save")}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={showDisableDialog} onOpenChange={(open) => {
        setShowDisableDialog(open)
        if (!open) {
          resetReopeningForm()
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("disable_front_office")}</DialogTitle>
            <DialogDescription>{t("disable_front_office_description")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm font-medium mb-2 block">{t("reopening_date")}</Label>
            <DateTimePicker
              value={selectedDay}
              onChange={handleDayChange}
              granularity="day"
              displayFormat={{ hour24: "yyyy-MM-dd" }}
              minDate={startOfDay(new Date())}
            />
            <p className="text-xs text-muted-foreground mt-2">{t("reopening_date_description")}</p>
            <Label className="text-sm font-medium mt-4 mb-2 block">{t("reopening_time")}</Label>
            <div className="flex items-center gap-2">
              <Select
                value={selectedHour ?? ""}
                disabled={!selectedDay}
                onValueChange={(h) => {
                  setSelectedHour(h)
                  setDatetimeError("")
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("hour")} />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" avoidCollisions={false}>
                  {Array.from({ length: 24 }, (_, h) => {
                    const value = String(h).padStart(2, "0")
                    const disabled =
                      !!selectedDay &&
                      isSameDay(selectedDay, new Date()) &&
                      h < new Date().getHours()
                    return (
                      <SelectItem key={value} value={value} disabled={disabled}>
                        {value}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground font-bold">:</span>
              <Select
                value={selectedMinute ?? ""}
                disabled={!selectedDay}
                onValueChange={(m) => {
                  setSelectedMinute(m)
                  setDatetimeError("")
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("minute")} />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" avoidCollisions={false}>
                  {Array.from({ length: 12 }, (_, i) => {
                    const value = String(i * 5).padStart(2, "0")
                    const now = new Date()
                    const disabled =
                      !!selectedDay &&
                      !!selectedHour &&
                      isSameDay(selectedDay, now) &&
                      Number(selectedHour) === now.getHours() &&
                      i * 5 <= now.getMinutes()
                    return (
                      <SelectItem key={value} value={value} disabled={disabled}>
                        {value}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            {datetimeError ? (
              <p className="text-xs font-medium text-destructive mt-2">{datetimeError}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">{t("reopening_time_hint")}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDisable} disabled={toggleMutation.isPending}>
              {t("disable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
