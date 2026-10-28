// Scrapers store 'Unknown' when a post names no employer; treat it as missing
export function displayCompany(company?: string | null): string | undefined {
  const name = company?.trim();
  return name && name !== 'Unknown' ? name : undefined;
}
