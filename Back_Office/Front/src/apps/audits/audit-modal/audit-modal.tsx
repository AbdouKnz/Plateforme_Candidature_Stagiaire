import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  IconCirclePlus,
  IconLogin,
  IconLogout,
  IconTrash,
  IconGitCompare,
  IconArrowLeft,
  IconArrowRight,
  IconUser,
  IconFolder,
  IconClock,
  IconReportSearch,
  IconHistory,
  IconRefresh,
} from "@tabler/icons-react";
import { FileIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ActionType, Audit, ChangeType } from "@/models/audit-model";
import { LongText } from "@/components/long-text";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { formatAuditDate } from "../format-audit-date";
import { STEP_VARIANTS } from "../../candidatures/pipeline";

const statusVariants: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  accepted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  invited: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const getActionBadgeColor = (action?: string) => {
  switch (action?.toLowerCase()) {
    case ActionType.CREATE:
      return "success";
    case ActionType.LOGIN:
      return "login";
    case ActionType.UPDATE:
      return "update";
    case ActionType.DELETE:
      return "destructive";
    case ActionType.LOGOUT:
      return "logout";
    case "accept":
      return "success";
    case "reject":
      return "destructive";
    case "reset":
      return "warning";
    default:
      return "secondary";
  }
};

interface AuditLogComparisonDialogProps {
  audit: Audit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditModal({
  audit,
  open,
  onOpenChange,
}: AuditLogComparisonDialogProps) {
  const { t } = useTranslation();
  const changeType = audit?.change?.type ?? "";
  const fields = audit?.change?.fields ?? {};
  const isStepStatusChange = changeType === "step_status";
  const isReset = changeType.toLowerCase() === "reset";

  const formatFieldValue = (val: any) => {
    if (val === null || val === undefined) return "-";

    if (typeof val === "object") {
      return (
        <div className="flex flex-wrap gap-1">
          {Object.entries(val).map(([key, value]) => (
            <Badge
              key={key}
              variant="outline"
              className="capitalize border-gray-300 dark:border-gray-700 text-xs"
            >
              {key}: {String(value)}
            </Badge>
          ))}
        </div>
      );
    }

    return String(val);
  };

  const formatStatusValue = (val: any) => {
    if (typeof val !== "string") return formatFieldValue(val);
    return t(`candidature_status_${val}`, { defaultValue: val });
  };

  const renderStatusBadge = (value: any) => {
    if (typeof value !== "string") return formatStatusValue(value);
    return (
      <Badge variant="outline" className={cn("font-medium", statusVariants[value] ?? "bg-muted text-muted-foreground")}>
        {formatStatusValue(value)}
      </Badge>
    );
  };

  const renderTableHeader = () => {
    const typeMap: Record<
      string,
      { label: string; Icon: React.ComponentType<{ className?: string }> }
    > = {
      [ChangeType.CREATE]: { label: "Created Item", Icon: IconCirclePlus },
      [ChangeType.DELETE]: { label: "Deleted Item", Icon: IconTrash },
      [ChangeType.LOGIN]: { label: "Logged In", Icon: IconLogin },
      [ChangeType.LOGOUT]: { label: "Logged Out", Icon: IconLogout },
      [ChangeType.UPDATE]: { label: "Updated Fields", Icon: FileIcon },
    };

    if (isStepStatusChange) {
      return (
        <TableRow>
          <TableHead>{t("step")}</TableHead>
          <TableHead className="border-r">{t("before")}</TableHead>
          <TableHead>{t("after")}</TableHead>
        </TableRow>
      );
    }

    if (changeType in typeMap) {
      const { label, Icon } = typeMap[changeType];
      return (
        <TableRow>
          {changeType === "update" ? (
            <>
              <TableHead></TableHead>
              <TableHead className="border-r">
                <div className="flex items-center gap-2">
                  <IconArrowLeft className="h-4 w-4" />
                  Before
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <IconArrowRight className="h-4 w-4" />
                  After
                </div>
              </TableHead>
            </>
          ) : (
            <TableHead colSpan={2}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </div>
            </TableHead>
          )}
        </TableRow>
      );
    }
  };

  const renderTableRows = () => {
    if (isStepStatusChange && (audit.action === "accept" || audit.action === "reject")) {
      return Object.entries(fields)
        .filter(([key]) => key.endsWith("_status") || key === "reason_code")
        .filter(([key]) => audit.action === "accept" || key.endsWith("_status"))
        .map(([key, value]: [string, any]) => {
          const label = key.endsWith("_status")
            ? t(`pipeline_step_${key.replace(/_status$/, "")}`, { defaultValue: key })
            : t("rejection_reason");
          return (
            <TableRow key={key}>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-medium",
                    key.endsWith("_status")
                      ? STEP_VARIANTS[key.replace(/_status$/, "")] ?? "bg-muted text-muted-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {label}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {key.endsWith("_status") ? renderStatusBadge(value.old_values) : "-"}
              </TableCell>
              <TableCell>
                {key.endsWith("_status") ? renderStatusBadge(value.new_values) : formatFieldValue(value.new_values)}
              </TableCell>
            </TableRow>
          );
        });
    }

    return Object.entries(fields).map(([key, value]: [string, any]) => {
      const changed = value.changed;

      const singleValueMap: Record<string, any> = {
        [ChangeType.CREATE]: value.created_values,
        [ChangeType.LOGIN]: value.logged_in_values,
        [ChangeType.LOGOUT]: value.logged_out_values,
        [ChangeType.DELETE]: value.deleted_values,
      };

      if (changeType in singleValueMap) {
        return (
          <TableRow key={key}>
            <TableCell>
              <Badge
                variant="secondary"
                className="capitalize font-medium text-md"
              >
                {key}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatFieldValue(singleValueMap[changeType])}
            </TableCell>
          </TableRow>
        );
      }

      if (changeType === ChangeType.UPDATE) {
        return (
          <TableRow key={key}>
            <TableCell>
              <Badge
                variant="secondary"
                className="capitalize font-medium text-md"
              >
                {key}
              </Badge>
            </TableCell>

            <TableCell>
              {changed ? (
                <Badge className="capitalize flex items-center bg-destructive/10 text-destructive rounded-full line-through">
                 
                 <LongText className="max-w-sm">
                  {formatFieldValue(value.old_values)}</LongText>
                </Badge>
              ) : (
                    <LongText className="max-w-sm">{formatFieldValue(value.old_values)}</LongText>
                
              )}
            </TableCell>

            <TableCell>
              {changed ? (
                <Badge className="capitalize flex items-center rounded-full border-none bg-green-600/10 text-green-600">
                   <LongText className="max-w-sm">
                 
                  {formatFieldValue(value.new_values)}</LongText>
                </Badge>
              ) : (
                 <LongText className="max-w-sm">
                {formatFieldValue(value.new_values)}</LongText>
              )}
            </TableCell>
          </TableRow>
        );
      }

      if (isStepStatusChange) {
        const label = key.endsWith("_status")
          ? t(`pipeline_step_${key.replace(/_status$/, "")}`, { defaultValue: key })
          : t(key, { defaultValue: key });
        return (
          <TableRow key={key}>
            <TableCell>
              <Badge
                variant="outline"
                className={cn(
                  "font-medium",
                  key.endsWith("_status")
                    ? STEP_VARIANTS[key.replace(/_status$/, "")] ?? "bg-muted text-muted-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {label}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {key.endsWith("_status") ? renderStatusBadge(value.old_values) : formatFieldValue(value.old_values)}
            </TableCell>
            <TableCell>
              {key.endsWith("_status") ? renderStatusBadge(value.new_values) : formatFieldValue(value.new_values)}
            </TableCell>
          </TableRow>
        );
      }

      return null;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-4xl max-h-[80vh] overflow-y-auto",
          changeType === ChangeType.UPDATE && "sm:max-w-6xl"
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <IconHistory className="size-5" />
            </div>
            ChangeLog
            <Badge
              variant={getActionBadgeColor(audit?.action)}
              className="capitalize"
            >
              {audit?.action === "accept" ? "Accept" : audit?.action === "reject" ? "Reject" : audit?.action}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <Card className="p-4 rounded-xl bg-accent">
            <div className="flex flex-col gap-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <IconUser className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  User:
                </span>
                <span>{audit?.actor_name ?? "Unknown"}</span>
              </div>

              <div className="flex items-center gap-2">
                <IconFolder className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Module:
                </span>
                <span>{audit?.module ?? "Unknown"}</span>
              </div>

              {audit?.applicant_name ? (
                <div className="flex items-center gap-2">
                  <IconUser className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{t("candidate")}:</span>
                  <span>{audit.applicant_name}</span>
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <IconClock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Time:
                </span>
                <span>{formatAuditDate(audit?.date)}</span>
              </div>
            </div>
          </Card>

          {!isReset && (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader className="bg-accent text-sm text-foreground">
                  {renderTableHeader()}
                </TableHeader>
                <TableBody>{renderTableRows()}</TableBody>
              </Table>
            </Card>
          )}

          {isReset && (
            <Card className="p-4 rounded-xl bg-accent">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <IconRefresh className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
                <span className="font-medium">
                  {t('session_reset_by_user', { name: audit?.actor_name ?? 'Unknown' })}
                </span>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
