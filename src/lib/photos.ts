// Photo helpers for quests (runs in the browser only).
// Photos are shrunk and re-saved as JPEG before they are stored, which also drops hidden
// camera data (EXIF), such as the GPS location where the photo was taken.

export const MAX_PHOTOS = 3;

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Not an image we can read"));
    };
    img.src = url;
  });
}

/** Resize so the longest side is at most `maxSide` px and return a JPEG data URL. */
export async function compressImage(file: Blob, maxSide = 1024, quality = 0.72): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#fff"; // transparent PNGs get a white background instead of black
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

/** A smaller copy for the AI (cheaper and faster to send). Returns base64 data without the "data:" prefix. */
export async function photoForAI(dataUrl: string): Promise<{ mimeType: "image/jpeg"; data: string }> {
  const blob = await (await fetch(dataUrl)).blob();
  const small = await compressImage(blob, 512, 0.7);
  return { mimeType: "image/jpeg", data: small.split(",")[1] ?? "" };
}
