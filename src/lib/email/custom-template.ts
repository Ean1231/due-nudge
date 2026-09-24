import { z } from "zod";

export const DEFAULT_REMINDER_SUBJECT = "Invoice reminder: {{invoiceNumber}} from {{businessName}}";
export const DEFAULT_REMINDER_BODY = `Hi {{clientName}},

This is a reminder from {{businessName}} that invoice {{invoiceNumber}} for {{amount}} (due {{dueDate}}) is still unpaid.

Please arrange payment at your earliest convenience. If you've already paid, you can ignore this message.

Thanks,
{{businessName}}`;

export const TEMPLATE_VARIABLES = [
  "clientName",
  "businessName",
  "invoiceNumber",
  "amount",
  "dueDate",
] as const;

const allowedVariables = new Set<string>(TEMPLATE_VARIABLES);

export const reminderTemplateSchema = z
  .object({
    subject: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(5000),
  })
  .superRefine((value, context) => {
    for (const field of ["subject", "body"] as const) {
      const variables = value[field].matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g);
      for (const match of variables) {
        if (!allowedVariables.has(match[1])) {
          context.addIssue({
            code: "custom",
            path: [field],
            message: `Unknown variable {{${match[1]}}}`,
          });
        }
      }
    }
  });

export function interpolateTemplate(template: string, values: Record<(typeof TEMPLATE_VARIABLES)[number], string>) {
  return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, variable: string) => {
    return allowedVariables.has(variable) ? values[variable as keyof typeof values] : match;
  });
}
