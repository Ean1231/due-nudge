export function toPublicInvoice<T extends { attachmentPath?: string | null; sourceDocumentPath?: string | null; invoiceData?: unknown }>(
  invoice: T,
) {
  const rest = { ...invoice };
  delete rest.attachmentPath;
  delete rest.sourceDocumentPath;
  delete rest.invoiceData;
  return rest;
}
