export const MAX_LOGO_BYTES = 500 * 1024;

export async function readInvoiceLogo(file: File) {
  if (file.size === 0 || file.size > MAX_LOGO_BYTES) {
    throw new Error("Logo must be smaller than 500 KB.");
  }
  if (file.type !== "image/png" && file.type !== "image/jpeg") {
    throw new Error("Logo must be a PNG or JPEG image.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if ((file.type === "image/png" && !isPng) || (file.type === "image/jpeg" && !isJpeg)) {
    throw new Error("The uploaded logo file is invalid.");
  }
  return { bytes, contentType: file.type as "image/png" | "image/jpeg" };
}
