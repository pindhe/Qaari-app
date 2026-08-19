export function statusOf(count: number) {
  if (count >= 30) return { label: "Complete", cls: "ok" as const };
  if (count > 0) return { label: "In progress", cls: "warn" as const };
  return { label: "Not started", cls: "idle" as const };
}
