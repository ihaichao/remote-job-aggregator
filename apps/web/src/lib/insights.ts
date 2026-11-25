import { readContentJson } from './content';

export interface InsightsEditorial {
  title: string;
  subtitle: string;
  seoDescription: string;
  updatedLabel: string;
  overviewParagraphs: string[];
  observations: { title: string; summary: string; takeaway: string }[];
}

export function getInsightsEditorial() {
  return readContentJson<InsightsEditorial>('insights.json');
}
