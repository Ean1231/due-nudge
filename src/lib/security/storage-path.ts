export function isOwnedStoragePath(userId: string, path: string) {
  if (!userId || path.includes("..") || path.includes("\\") || path.includes("\0")) return false;
  return path.startsWith(`invoices/${userId}/`);
}

export function safeDownloadName(name: string) {
  return name.replace(/[\r\n"\\]/g, "").slice(0, 120) || "invoice-file";
}
