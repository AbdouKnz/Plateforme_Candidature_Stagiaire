import { useState } from "react"
import { Card } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { PowerIcon } from "lucide-react"
import { useFrontOfficeStatus, useToggleFrontOffice } from "@/hooks/use-front-office"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

export function FrontOfficeForm() {
  const { t } = useTranslation()
  const { data: statusData } = useFrontOfficeStatus()
  const toggleMutation = useToggleFrontOffice()

  const isEnabled = statusData?.is_enabled ?? true
  const existingDate = statusData?.reopening_date

  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    existingDate ? new Date(existingDate) : undefined
  )

  const handleToggleChange = (checked: boolean) => {
    if (checked) {
      toggleMutation.mutate({ is_enabled: true })
    } else {
      setSelectedDate(existingDate ? new Date(existingDate) : undefined)
      setShowDisableDialog(true)
    }
  }

  const handleConfirmDisable = () => {
    const reopening_date = selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
    toggleMutation.mutate({
      is_enabled: false,
      reopening_date,
    }, {
      onSuccess: () => setShowDisableDialog(false),
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
              disabled={toggleMutation.isPending}
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

      <Dialog open={showDisableDialog} onOpenChange={(open) => {
        setShowDisableDialog(open)
        if (!open) setSelectedDate(existingDate ? new Date(existingDate) : undefined)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("disable_front_office")}</DialogTitle>
            <DialogDescription>{t("disable_front_office_description")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm font-medium mb-2 block">{t("reopening_date")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>{t("reopening_date_placeholder")}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={{ before: new Date() }}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground mt-2">{t("reopening_date_description")}</p>
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
