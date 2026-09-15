export interface KompressoxValidationResult {
  valid: boolean;
  warnings: string[];
  disclaimerRequired: boolean;
  sanitizedContent: string;
}

const FORBIDDEN_MEDICAL_TERMS = [
  'cura milagrosa',
  'curación garantizada',
  'diagnóstico definitivo',
  'prescripción médica',
  'elimina para siempre',
  'remedio infalible'
];

export const STANDARD_MEDICAL_DISCLAIMER = `
<div class="medical-disclaimer border-l-4 border-amber-500 bg-amber-50 p-4 text-xs text-amber-900 my-6 rounded">
  <strong>Aviso Educativo:</strong> La información contenida en este artículo es de carácter educativo e informativo. No sustituye la consulta, diagnóstico ni tratamiento médico profesional. Ante cualquier molestia o condición de salud, consulte siempre a su médico especialista.
</div>
`;

export function validateKompressoxCompliance(
  title: string,
  content: string,
  sourceUrl?: string | null
): KompressoxValidationResult {
  const warnings: string[] = [];
  const lowercaseText = (title + ' ' + content).toLowerCase();

  // 1. Check for forbidden medical diagnostic/cure claims
  for (const term of FORBIDDEN_MEDICAL_TERMS) {
    if (lowercaseText.includes(term)) {
      warnings.push(`Se detectó un término médico no permitido: "${term}". Evite promesas de curación o diagnósticos.`);
    }
  }

  // 2. Check source citation
  if (!sourceUrl || sourceUrl.trim() === '') {
    warnings.push('Atención: Kompressox requiere citar la fuente médica o institucional de referencia.');
  }

  // 3. Inject educational disclaimer if not already present
  let sanitizedContent = content;
  const disclaimerRequired = !content.includes('medical-disclaimer');
  if (disclaimerRequired) {
    sanitizedContent += '\n' + STANDARD_MEDICAL_DISCLAIMER;
  }

  return {
    valid: warnings.length === 0,
    warnings,
    disclaimerRequired,
    sanitizedContent
  };
}
