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
  IconListDetails,
  IconReportSearch,
  IconHistory,
} from "@tabler/icons-react";
import { FileIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ActionType, Audit, ChangeType } from "@/models/audit-model";
import { LongText } from "@/components/long-text";
import { cn } from "@/lib/utils";

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
  const changeType = audit?.change?.type ?? "";
  const fields = audit?.change?.fields ?? {};

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
              {audit?.action}
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

              <div className="flex items-center gap-2">
                <IconClock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Time:
                </span>
                <span>{audit?.time_stamp ?? "-"}</span>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader className="bg-accent text-sm text-foreground">
                {renderTableHeader()}
              </TableHeader>
              <TableBody>{renderTableRows()}</TableBody>
            </Table>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
