import { redirect } from "next/navigation";
import { ReminderTemplateForm } from "@/components/settings/reminder-template-form";
import {
  DEFAULT_REMINDER_BODY,
  DEFAULT_REMINDER_SUBJECT,
} from "@/lib/email/custom-template";
import { getAppUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await getAppUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="display text-4xl font-semibold">Reminder settings</h1>
        <p className="mt-2 text-[var(--muted)]">
          This template is used for every immediate, scheduled, and manual reminder.
        </p>
      </div>
      <ReminderTemplateForm
        initialSubject={user.reminderSubject || DEFAULT_REMINDER_SUBJECT}
        initialBody={user.reminderBody || DEFAULT_REMINDER_BODY}
      />
    </main>
  );
}
