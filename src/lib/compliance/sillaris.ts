export interface SillarisValidationResult {
  valid: boolean;
  warnings: string[];
}

export function validateSillarisCompliance(
  title: string,
  content: string,
  priceDataSource?: string | null
): SillarisValidationResult {
  const warnings: string[] = [];
  const lowercaseText = (title + ' ' + content).toLowerCase();

  // 1. Check price data source
  if (!priceDataSource || priceDataSource.trim() === '') {
    warnings.push('En noticias inmobiliarias de Sillaris es obligatorio indicar la fuente de precios (ej. BCRP, CAPECO, Índices Inmobiliarios).');
  }

  // 2. Check timeframe indicator
  const hasYear = /202[4-9]/.test(lowercaseText);
  const hasPeriod = /trimestre|semestre|q[1-4]|mes|anual|2026/.test(lowercaseText);

  if (!hasYear && !hasPeriod) {
    warnings.push('Debe especificar el período temporal analizado (ej. Q2 2026, acumulado anual).');
  }

  // 3. Check published vs transacted distinction warning
  if (lowercaseText.includes('precio') && !lowercaseText.includes('publicado') && !lowercaseText.includes('transaccionado')) {
    warnings.push('Sugerencia editorial: Diferencie claramente si las cifras corresponden a "Precios Publicados" en portales o "Precios Cierre/Transaccionados".');
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}
