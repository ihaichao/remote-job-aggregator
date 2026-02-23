import type { JobCategory, RegionLimit, WorkType } from './types';

// 岗位类型标签
export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
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
  other: '其他',
};

// 地域限制标签
export const REGION_LIMIT_LABELS: Record<RegionLimit, string> = {
  worldwide: '全球远程',
  regional: '地区限制',
  timezone: '时区限制',
};

// 协作方式标签
export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  fulltime: '全职',
  parttime: '兼职',
  contract: '合同工',
};

// 数据源
export const SOURCE_SITES = [
  'v2ex',
  'remoteok',
  'weworkremotely',
  'linkedin',
  'remote.com',
] as const;

export type SourceSite = (typeof SOURCE_SITES)[number];
