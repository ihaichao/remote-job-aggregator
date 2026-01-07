export const CATEGORY_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Full Stack',
  mobile: 'Mobile',
  devops: 'DevOps',
  ai: 'AI/ML',
  blockchain: 'Blockchain',
  unknown: 'Other',
};

export const COMMON_REGIONS: Record<string, string> = {
  worldwide: '🌍 Worldwide',
  US: '🇺🇸 United States',
  EU: '🇪🇺 Europe',
  CN: '🇨🇳 China',
  APAC: '🌏 Asia-Pacific',
};

// Helper function to get region label
export function getRegionLabel(regionLimit: string): string {
  // Check common regions first
  if (COMMON_REGIONS[regionLimit]) {
    return COMMON_REGIONS[regionLimit];
  }
  // Handle timezone format (e.g., UTC+8, UTC-5)
  if (regionLimit.startsWith('UTC')) {
    return `🕐 ${regionLimit}`;
  }
  // Fallback to the raw value
  return regionLimit;
}

export const WORK_TYPE_LABELS: Record<string, string> = {
  fulltime: 'Full-time',
  parttime: 'Part-time',
  contract: 'Contract',
};

export const SOURCE_LABELS: Record<string, string> = {
  v2ex: 'V2EX',
  remoteok: 'RemoteOK',
  weworkremotely: 'WeWorkRemotely',
  linkedin: 'LinkedIn',
  'remote.com': 'Remote.com',
  boss: 'BOSS直聘',
};
