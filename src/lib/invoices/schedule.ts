import { addDays, startOfDay } from "date-fns";

const SCHEDULED = [3, 7, 14] as const;

export function nextScheduledReminder(dueDate: Date | string, milestones: number[]) {
  const due = startOfDay(new Date(dueDate));
  const sent = new Set(milestones);
  for (const day of SCHEDULED) {
    if (!sent.has(day)) return addDays(due, day);
  }
  return null;
}

export function reminderLabel(milestone: number) {
  if (milestone === 0) return "On save";
  if (milestone >= 100) return "Extra";
  return `+${milestone}`;
}
