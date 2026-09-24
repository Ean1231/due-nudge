export type ReminderEmailPayload = {
  to: string;
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  dueDate: Date;
  milestone: number;
};

export type ReminderEmailContent = {
  subject: string;
  text: string;
  html: string;
};
