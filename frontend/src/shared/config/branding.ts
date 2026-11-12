/**
 * STELIOS is the only visual identity of the product. Training centers (tenants)
 * appear as context (their name), never as an alternative brand.
 */
export const BRAND = {
  name: 'STELIOS',
  claim: 'Entrena. Registra. Evoluciona.',
  description: 'La plataforma para entrenadores y centros de entrenamiento.',
} as const;

export function getDocumentTitle(tenantName?: string | null): string {
  const name = tenantName?.trim();
  return name ? `${BRAND.name} · ${name}` : BRAND.name;
}

export function getMarketingUrl(): string | null {
  const url = import.meta.env.VITE_MARKETING_URL?.trim();
  return url ? url : null;
}
