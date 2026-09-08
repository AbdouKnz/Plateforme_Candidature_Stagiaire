export function formatAuditDate(value?: string): string {
  if (!value) return "-";

  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
    ? value
    : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}