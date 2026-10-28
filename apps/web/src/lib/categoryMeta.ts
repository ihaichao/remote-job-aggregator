// Emoji and tint per category, used for card icons, category tags and the hero wall
export const CATEGORY_META: Record<string, { emoji: string; tint: string }> = {
  ai: { emoji: '🤖', tint: '#ffe7d1' },
  backend: { emoji: '🧱', tint: '#e3f0ff' },
  frontend: { emoji: '🎨', tint: '#ffe3ef' },
  fullstack: { emoji: '🧩', tint: '#e9f7e3' },
  blockchain: { emoji: '⛓️', tint: '#f1e8ff' },
  devops: { emoji: '☁️', tint: '#e0f6f7' },
  mobile: { emoji: '📱', tint: '#fff3cc' },
  game: { emoji: '🎮', tint: '#ffe1e1' },
  quant: { emoji: '📈', tint: '#e6f0e6' },
  security: { emoji: '🛡️', tint: '#ececec' },
  testing: { emoji: '🧪', tint: '#f6eadf' },
  data: { emoji: '📊', tint: '#e3ecff' },
  embedded: { emoji: '🔌', tint: '#f0f0e0' },
};

export const DEFAULT_CATEGORY_META = { emoji: '💼', tint: '#f3ebe3' };
