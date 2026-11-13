/**
 * Normaliza y convierte URLs de imágenes externas.
 * Permite que los usuarios peguen enlaces públicos compartidos de Google Drive o Dropbox
 * y los transforma en URLs directas de imagen que los navegadores pueden cargar en un <img> o <picture>.
 */
export function normalizeImageUrl(inputUrl: string): string {
  if (!inputUrl) return "";
  const trimmed = inputUrl.trim();

  // Si ya es data URI o URL normal
  if (trimmed.startsWith("data:image/")) return trimmed;

  try {
    // 1. Detección y conversión de Google Drive
    // Formato 1: https://drive.google.com/file/d/{FILE_ID}/view...
    const driveFileMatch = trimmed.match(
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i
    );
    if (driveFileMatch && driveFileMatch[1]) {
      const fileId = driveFileMatch[1];
      // lh3.googleusercontent.com es el CDN directo de Google Drive para imágenes públicas
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    // Formato 2: https://drive.google.com/open?id={FILE_ID} o /uc?id={FILE_ID}
    const driveIdMatch = trimmed.match(
      /drive\.google\.com\/(?:open|uc)\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+)/i
    );
    if (driveIdMatch && driveIdMatch[1]) {
      const fileId = driveIdMatch[1];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    // 2. Detección y conversión de Dropbox
    // https://www.dropbox.com/s/.../banner.png?dl=0 -> ?raw=1
    if (trimmed.includes("dropbox.com") && trimmed.includes("dl=0")) {
      return trimmed.replace("dl=0", "raw=1");
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Valida si una URL dada corresponde a un enlace válido de imagen o Google Drive
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.trim();
  if (clean.startsWith("data:image/")) return true;
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) return false;
  return true;
}
