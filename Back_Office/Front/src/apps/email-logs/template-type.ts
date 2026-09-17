// Single source of truth for email template-type badges and labels.
// Used by the email-logs table/modal and the audit change card so a type
// (e.g. online_quiz) always renders the same color and text everywhere.
export type TemplateTypeBadgeVariant =
  | "blue"
  | "success"
  | "destructive"
  | "info"
  | "update"
  | "warning"
  | "secondary";

export const TEMPLATE_TYPE_BADGE_VARIANTS: Record<string, TemplateTypeBadgeVariant> = {
  confirmation: "blue",
  acceptance: "success",
  online_quiz: "success",
  online_meeting: "update",
  f2f_meeting: "warning",
  final_decision: "success",
  disapproval: "destructive",
  reopening: "info",
  session_reset: "warning",
};

export const templateTypeBadgeVariant = (type?: string): TemplateTypeBadgeVariant =>
  (type && TEMPLATE_TYPE_BADGE_VARIANTS[type]) ?? "secondary";

const humanizeTemplateType = (type: string): string =>
  type
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

export const templateTypeLabel = (
  t: (key: string, options?: any) => string,
  type?: string
): string => {
  if (!type) return "-";
  return t(`email_template_type_${type}`, { defaultValue: humanizeTemplateType(type) });
};
