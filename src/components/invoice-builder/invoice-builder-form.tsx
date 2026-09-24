"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import { formatMoney } from "@/lib/money";
import type { InvoiceBuilderInput } from "@/lib/invoice-builder/schema";
import { INVOICE_TEMPLATES } from "@/lib/invoice-builder/templates";

type LineItem = { id: string; description: string; quantity: string; unitPrice: string };
const STEPS = ["Business", "Client", "Invoice", "Items", "Finish"];

export function InvoiceBuilderForm({
  templateId,
  initialBusinessName,
  initialBusinessEmail,
  initialIssueDate,
  initialDueDate,
}: {
  templateId: InvoiceBuilderInput["templateId"];
  initialBusinessName: string;
  initialBusinessEmail: string;
  initialIssueDate: string;
  initialDueDate: string;
}) {
  const [items, setItems] = useState<LineItem[]>([
    { id: "initial", description: "", quantity: "1", unitPrice: "" },
  ]);
  const [taxRate, setTaxRate] = useState("0");
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; number: string; reminder: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const template = INVOICE_TEMPLATES.find((item) => item.id === templateId)!;

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const quantity = Number(item.quantity);
      const rate = Number(item.unitPrice);
      return sum + (Number.isFinite(quantity) && Number.isFinite(rate) ? quantity * rate : 0);
    }, 0);
    const tax = subtotal * ((Number(taxRate) || 0) / 100);
    return { subtotal, tax, total: subtotal + tax };
  }, [items, taxRate]);

  function updateItem(id: string, field: keyof Omit<LineItem, "id">, value: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }
    setPending(true);
    setError(null);
    setSuccess(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      templateId,
      businessName: String(form.get("businessName") || ""),
      businessEmail: String(form.get("businessEmail") || ""),
      businessPhone: String(form.get("businessPhone") || ""),
      businessAddress: String(form.get("businessAddress") || ""),
      clientName: String(form.get("clientName") || ""),
      clientEmail: String(form.get("clientEmail") || ""),
      clientPhone: String(form.get("clientPhone") || ""),
      clientAddress: String(form.get("clientAddress") || ""),
      invoiceNumber: String(form.get("invoiceNumber") || ""),
      issueDate: String(form.get("issueDate") || ""),
      dueDate: String(form.get("dueDate") || ""),
      currency: "usd",
      taxRate: Number(taxRate),
      notes: String(form.get("notes") || ""),
      paymentTerms: String(form.get("paymentTerms") || ""),
      signatureName: String(form.get("signatureName") || ""),
      lineItems: items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    };

    const upload = new FormData();
    upload.set("payload", JSON.stringify(payload));
    const logo = form.get("logo");
    const sourceDocument = form.get("sourceDocument");
    if (logo instanceof File && logo.size > 0) upload.set("logo", logo);
    if (sourceDocument instanceof File && sourceDocument.size > 0) {
      upload.set("sourceDocument", sourceDocument);
    }

    const response = await fetch("/api/invoice-builder", {
      method: "POST",
      body: upload,
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(data.error || "Could not generate the invoice.");
      return;
    }

    if (data.reminderStatus === "gmail") {
      window.alert("Invoice created. Connect Gmail using the chain icon to send its reminder.");
    }
    const reminder =
      data.reminderStatus === "sent"
        ? `The first reminder was sent to ${data.invoice.client.email}.`
        : data.reminderStatus === "limit"
          ? "The invoice was created, but your free reminder allowance is finished."
          : data.reminderStatus === "failed"
            ? `The invoice was created, but sending failed: ${data.reminderError}`
            : "The invoice and PDF were created.";
    setSuccess({ id: data.invoice.id, number: data.invoice.number, reminder });
  }

  function goNext() {
    const section = formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"]`);
    const fields = Array.from(section?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea") || []);
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return;
      }
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (success) {
    return (
      <section className="panel mx-auto max-w-2xl space-y-5 text-center">
        <p className="text-sm font-semibold text-[var(--ok)]">Invoice created</p>
        <h2 className="display text-3xl">{success.number} is ready</h2>
        <p className="text-[var(--muted)]">{success.reminder}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <a className="btn btn-primary" href={`/api/invoices/${success.id}/attachment`}>
            Download PDF
          </a>
          <Link className="btn btn-ghost" href="/invoices">
            View invoices
          </Link>
          <button className="btn btn-ghost" type="button" onClick={() => setSuccess(null)}>
            Create another
          </button>
        </div>
      </section>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-8">
      <section className="panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">Selected design</p>
          <h2 className="display text-2xl font-semibold">{template.name}</h2>
        </div>
        <Link href="/invoice-builder" className="btn btn-ghost">
          Change design
        </Link>
      </section>

      <ol className="grid grid-cols-5 gap-2" aria-label="Invoice form progress">
        {STEPS.map((label, index) => (
          <li key={label} className="text-center">
            <div className={`mx-auto mb-2 h-2 rounded ${index <= step ? "bg-[var(--brand)]" : "bg-[var(--line)]"}`} />
            <span className={`text-xs ${index === step ? "font-bold text-[var(--ink)]" : "text-[var(--muted)]"}`}>
              {label}
            </span>
          </li>
        ))}
      </ol>

      <div data-step="0" hidden={step !== 0}>
        <FormSection title="Your business">
          <Field label="Business name" name="businessName" defaultValue={initialBusinessName} required />
          <Field label="Business email" name="businessEmail" type="email" defaultValue={initialBusinessEmail} required />
          <Field label="Business phone" name="businessPhone" />
          <TextArea label="Business address" name="businessAddress" required />
          <div className="field md:col-span-2">
            <label htmlFor="logo">Business logo (optional PNG/JPEG, maximum 500 KB)</label>
            <input id="logo" name="logo" type="file" accept="image/png,image/jpeg" />
          </div>
        </FormSection>
      </div>

      <div data-step="1" hidden={step !== 1}>
        <FormSection title="Client details">
          <Field label="Client name" name="clientName" required />
          <Field label="Client email" name="clientEmail" type="email" required />
          <Field label="Client phone" name="clientPhone" />
          <TextArea label="Client address" name="clientAddress" required />
        </FormSection>
      </div>

      <div data-step="2" hidden={step !== 2}>
        <FormSection title="Invoice details">
          <Field label="Invoice number" name="invoiceNumber" placeholder="INV-1001" required />
          <Field label="Invoice date" name="issueDate" type="date" defaultValue={initialIssueDate} required />
          <Field label="Due date" name="dueDate" type="date" defaultValue={initialDueDate} required />
          <Field
            label="Tax rate (%)"
            name="taxRate"
            type="number"
            value={taxRate}
            onChange={setTaxRate}
            min="0"
            max="100"
            step="0.01"
            required
          />
        </FormSection>
      </div>

      <section data-step="3" hidden={step !== 3} className="panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="display text-2xl font-semibold">Line items</h2>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={items.length >= 10}
            onClick={() =>
              setItems((current) => [
                ...current,
                { id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "" },
              ])
            }
          >
            Add line
          </button>
        </div>
        {items.map((item, index) => (
          <div key={item.id} className="grid gap-3 border-t border-[var(--line)] pt-4 md:grid-cols-[1fr_7rem_9rem_auto]">
            <Field
              label={`Description ${index + 1}`}
              name={`description-${item.id}`}
              value={item.description}
              onChange={(value) => updateItem(item.id, "description", value)}
              required
            />
            <Field
              label="Quantity"
              name={`quantity-${item.id}`}
              type="number"
              value={item.quantity}
              onChange={(value) => updateItem(item.id, "quantity", value)}
              min="0.01"
              step="0.01"
              required
            />
            <Field
              label="Unit price"
              name={`unitPrice-${item.id}`}
              type="number"
              value={item.unitPrice}
              onChange={(value) => updateItem(item.id, "unitPrice", value)}
              min="0"
              step="0.01"
              required
            />
            <button
              className="btn btn-ghost self-end"
              type="button"
              disabled={items.length === 1}
              onClick={() => setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))}
            >
              Remove
            </button>
          </div>
        ))}
        <div className="ml-auto max-w-xs space-y-2 border-t border-[var(--line)] pt-4 text-sm">
          <TotalRow label="Subtotal" value={totals.subtotal} />
          <TotalRow label="Tax" value={totals.tax} />
          <TotalRow label="Total" value={totals.total} strong />
        </div>
      </section>

      <div data-step="4" hidden={step !== 4}>
        <FormSection title="Finish invoice">
          <TextArea label="Payment terms" name="paymentTerms" placeholder="Payment by bank transfer within 14 days." />
          <TextArea label="Notes" name="notes" placeholder="Thank you for your business." />
          <Field
            label="Signature (initial and surname)"
            name="signatureName"
            placeholder="J. Smith"
            required
          />
          <div className="field">
            <label htmlFor="sourceDocument">Original invoice (optional PDF, DOC, or DOCX; maximum 3 MB)</label>
            <input
              id="sourceDocument"
              name="sourceDocument"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            <span className="text-xs text-[var(--muted)]">
              Stored as-is and included with reminder emails alongside the generated PDF.
            </span>
          </div>
        </FormSection>
      </div>

      {error ? <p className="rounded bg-[rgba(180,35,24,0.08)] p-4 text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="flex justify-between gap-3">
        <button
          className="btn btn-ghost"
          type="button"
          disabled={step === 0 || pending}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button className="btn btn-primary" type="button" onClick={goNext}>
            Continue
          </button>
        ) : (
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Generating invoice…" : "Generate PDF invoice"}
          </button>
        )}
      </div>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel grid gap-4 md:grid-cols-2">
      <h2 className="display text-2xl font-semibold md:col-span-2">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  value,
  onChange,
  ...inputProps
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "defaultValue" | "name" | "type">) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        {...inputProps}
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  ...props
}: { label: string; name: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <textarea id={name} name={name} rows={4} {...props} />
    </div>
  );
}

function TotalRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-8 ${strong ? "text-base font-bold" : ""}`}>
      <span>{label}</span>
      <span>{formatMoney(Math.round(value * 100), "usd")}</span>
    </div>
  );
}
