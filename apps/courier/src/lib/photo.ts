import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

const MAX_EDGE = 1024;

export const isNative = () => Capacitor.isNativePlatform();

/** Native only: take or pick a photo through the Capacitor camera. Null if cancelled. */
export async function capturePhotoNative(source: "camera" | "library"): Promise<string | null> {
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
      quality: 75,
      width: MAX_EDGE,
      correctOrientation: true,
    });
    return photo.dataUrl ? shrink(photo.dataUrl) : null;
  } catch {
    return null;
  }
}

/** Browser: a picked or captured file, re-encoded as a small JPEG data URL. */
export function fileToPhoto(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(shrink(String(reader.result)));
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function shrink(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
