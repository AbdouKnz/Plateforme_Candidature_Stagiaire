import { Main } from "@/components/layout/main";
import { IconMail, IconPlus, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { EmailTemplateModals } from "./email-template-modal";
import { useTranslation } from "react-i18next";
import { useMemo, useState, useEffect } from "react";
import { useEmailTemplatesStore } from "@/stores/email-templates-store";
import { useEmailTemplates } from "@/hooks/use-email-templates";
import { DialogEnum } from "@/models/alert-model";
import { usePermissions } from "@/hooks/use-permissions";
import { useDebounce } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconEye, IconEdit, IconTrash } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { EmailTemplate } from "@/models/email-template-model";

const PAGE_SIZE = 10;

const typeVariants: Record<string, string> = {
  confirmation: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  acceptance: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  disapproval: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  reopening: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const typeLabelMap: Record<string, Record<string, string>> = {
  fr: { confirmation: "Accusé réception", acceptance: "Invitation", disapproval: "Refus", reopening: "Réouverture" },
  en: { confirmation: "Confirmation", acceptance: "Acceptance", disapproval: "Disapproval", reopening: "Reopening" },
};

const rowActionBtn = "h-8 w-8 p-0";

function EmailRow({
  template,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  isSelected,
}: {
  template: EmailTemplate;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
  isSelected?: boolean;
}) {
  const { t } = useTranslation();
  const typeLabel = typeLabelMap.fr?.[template.type] || template.type;

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/40 cursor-pointer transition-colors",
        isSelected && "bg-primary/5 border-l-2 border-l-primary shadow-sm"
      )}
      onClick={onView}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded uppercase leading-none", typeVariants[template.type] || "")}>
            {typeLabel}
          </span>
          <span className="text-sm font-medium text-foreground truncate">
            {template.subject}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-1">
          {template.body?.replace(/\n/g, " ")}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground/40">{template.updated_at ? new Date(template.updated_at).toLocaleDateString() : ""}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 self-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className={cn(rowActionBtn, "text-blue-500 hover:border-blue-300 hover:text-blue-600")} onClick={(e) => { e.stopPropagation(); onView(); }}>
              <IconEye size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent colorClass="bg-blue-500 text-white" arrowClass="bg-blue-500 fill-blue-500">
            {t("view")}
          </TooltipContent>
        </Tooltip>
        {canEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className={cn(rowActionBtn, "text-green-500 hover:border-green-300 hover:text-green-600")} onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <IconEdit size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent colorClass="bg-green-500 text-white" arrowClass="bg-green-500 fill-green-500">
              {t("edit")}
            </TooltipContent>
          </Tooltip>
        )}
        {canDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className={cn(rowActionBtn, "text-destructive hover:border-red-300 hover:text-red-600")} onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <IconTrash size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent colorClass="bg-destructive text-white" arrowClass="bg-destructive fill-destructive">
              {t("delete")}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export function EmailTemplates() {
  const { t } = useTranslation();
  const { queryParams, setQueryParams, setOpenEmailTemplate, setCurrentEmailTemplateId, currentEmailTemplateId, openEmailTemplate } = useEmailTemplatesStore();
  const { modulePermissions } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 150) || "";
  const [page, setPage] = useState(0);

  const canCreate = modulePermissions.email_templates?.canCreate;
  const canEdit = modulePermissions.email_templates?.canUpdate;
  const canDelete = modulePermissions.email_templates?.canDelete;

  useEffect(() => {
    setQueryParams({ search: debouncedSearchTerm });
    setPage(0);
  }, [debouncedSearchTerm, setQueryParams]);

  const { data: emailTemplates, isLoading } = useEmailTemplates(queryParams);
  const data = useMemo(() => emailTemplates ?? [], [emailTemplates]);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageData = data.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const handleDelete = (template: EmailTemplate) => {
    setCurrentEmailTemplateId(template.id);
    setOpenEmailTemplate(DialogEnum.DELETE);
  };

  return (
    <>
      <Main>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <IconMail className="size-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              {t("email_template_management")}
            </h2>
            <span className="text-xs text-muted-foreground ml-1">({data.length})</span>
          </div>
          {canCreate && (
            <Button size="sm" onClick={() => setOpenEmailTemplate(DialogEnum.ADD)}>
              <IconPlus className="size-3.5 mr-1" />
              {t("add_email_template")}
            </Button>
          )}
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b bg-muted/10">
            <Input
              placeholder={t("search_email_templates")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm max-w-xs"
            />
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("loading")}</div>
          ) : pageData.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("no_results_found")}</div>
          ) : (
            <div className="divide-y divide-border/50">
              {pageData.map((template) => (
                <EmailRow
                  key={template.id}
                  template={template}
                  isSelected={currentEmailTemplateId === template.id && openEmailTemplate === DialogEnum.VIEW}
                  onView={() => {
                    setCurrentEmailTemplateId(template.id);
                    setOpenEmailTemplate(DialogEnum.VIEW);
                  }}
                  onEdit={() => {
                    setCurrentEmailTemplateId(template.id);
                    setOpenEmailTemplate(DialogEnum.EDIT);
                  }}
                  onDelete={() => handleDelete(template)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/10">
              <span className="text-xs text-muted-foreground">
                {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, data.length)} / {data.length}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="size-7" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                  <IconChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button key={i} variant={safePage === i ? "default" : "ghost"} size="icon" className="size-7 text-xs" onClick={() => setPage(i)}>
                    {i + 1}
                  </Button>
                ))}
                <Button variant="ghost" size="icon" className="size-7" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>
                  <IconChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Main>
      <EmailTemplateModals />
    </>
  );
}
