export function formatAuditDate(value?: string): string {
  if (!value) return "-";

  // Audit timestamps are stored as naive server-local wall clocks
  // ("YYYY-MM-DD HH:mm:ss", no offset). Display them verbatim: never
  // reinterpret them as UTC (appending "Z" shifted every timestamp by the
  // viewer's UTC offset). If an explicit offset is present, honor it.
  if (/(?:Z|[+-]\d{2}:?\d{2})$/.test(value)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(date);
  }

  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!m) return value;
  const [, y, mo, d, h, mi, s = "00"] = m;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s)
  );
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}
