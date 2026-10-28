export const CATEGORY_LABELS: Record<string, string> = {
  frontend: '前端',
  backend: '后端',
  fullstack: '全栈',
  mobile: '移动端',
  game: '游戏',
  devops: '运维',
  ai: 'AI',
  blockchain: '区块链',
  quant: '量化',
  security: '安全',
  testing: '测试',
  data: '数据',
  embedded: '嵌入式',
  other: '其他',
};

// Full category names used on the homepage (mirrors packages/shared JOB_CATEGORY_LABELS)
export const JOB_CATEGORY_LABELS: Record<string, string> = {
  frontend: '前端开发',
  backend: '后端开发',
  fullstack: '全栈开发',
  mobile: '移动开发',
  game: '游戏开发',
  devops: 'DevOps',
  ai: 'AI/机器学习',
  blockchain: '区块链',
  quant: '量化交易',
  security: '安全',
  testing: '测试',
  data: '大数据',
  embedded: '嵌入式',
};

export const COMMON_REGIONS: Record<string, string> = {
  worldwide: '🌍 全球',
  CN: '🇨🇳 中国',
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
  fulltime: '全职',
  parttime: '兼职',
};

export const SOURCE_LABELS: Record<string, string> = {
  v2ex: 'V2EX',
  rwfa: 'Real Work From Anywhere',
  eleduck: '电鸭社区',
  remotecom: 'Remote.com',
  remoteok: 'RemoteOK',
  weworkremotely: 'WeWorkRemotely',
  linkedin: 'LinkedIn',
  'remote.com': 'Remote.com',
  boss: 'BOSS直聘',
};
