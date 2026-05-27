const CHILEAN_PLATE_REGEX = /^[A-Z]{4}\d{2}$|^[A-Z]{2}[·-]?[A-Z]{2}\d{2}$/;

export function validateChileanPlate(plate: string): { valid: boolean; normalized: string; error?: string } {
  const cleaned = plate.toUpperCase().replace(/[\s·-]/g, "");

  if (cleaned.length < 5 || cleaned.length > 6) {
    return { valid: false, normalized: cleaned, error: "Formato inválido. Ej: ABCD12 o AB·CD-12" };
  }

  if (!CHILEAN_PLATE_REGEX.test(cleaned)) {
    return { valid: false, normalized: cleaned, error: "Formato inválido. Ej: ABCD12 o AB·CD-12" };
  }

  return { valid: true, normalized: cleaned };
}
