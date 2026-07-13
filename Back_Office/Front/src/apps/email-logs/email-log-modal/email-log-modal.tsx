import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  IconSend,
  IconUser,
  IconMail,
  IconBook,
  IconClock,
  IconFileDescription,
} from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import type { EmailLog } from "@/models/email-log-model";
import { useTranslation } from "react-i18next";

interface EmailLogViewDialogProps {
  emailLog: EmailLog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailLogModal({
  emailLog,
  open,
  onOpenChange,
}: EmailLogViewDialogProps) {
  const { t } = useTranslation();
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "confirmation":
        return "blue";
      case "acceptance":
        return "success";
      case "disapproval":
        return "destructive";
      case "reopening":
        return "info";
      default:
        return "secondary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <IconSend className="size-5" />
            </div>
            Email Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <Card className="p-4 rounded-xl bg-accent">
            <div className="flex flex-col gap-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <IconUser className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Candidat:
                </span>
                <span>{emailLog.candidat_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconMail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Mail:
                </span>
                <span>{emailLog.recipient}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconBook className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Subject:
                </span>
                <span>{emailLog.subject}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconClock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Sent At:
                </span>
                <span>{emailLog.sent_at}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconFileDescription className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Type:
                </span>
                <Badge variant={getTypeBadgeColor(emailLog.template_type) as "blue" | "success" | "destructive" | "info" | "secondary"}>
                  {({
                    confirmation: t("email_template_type_confirmation"),
                    acceptance: t("email_template_type_acceptance"),
                    disapproval: t("email_template_type_disapproval"),
                    reopening: t("email_template_type_reopening"),
                  } as Record<string, string>)[emailLog.template_type] ?? emailLog.template_type}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Status:
                </span>
                <Badge variant={emailLog.status === "sent" ? "success" : "secondary"} className="capitalize">
                  {emailLog.status}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-xl">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Email Subject</h3>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {emailLog.subject}
              </p>
            </div>
          </Card>

          <Card className="p-4 rounded-xl">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Email Body</h3>
              <div className="bg-muted/20 border rounded-lg px-3 py-3 min-h-[200px]">
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap [&_table]:max-w-full [&_img]:max-w-full [&_a]:text-blue-600"
                  dangerouslySetInnerHTML={{ __html: emailLog.body }}
                />
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
