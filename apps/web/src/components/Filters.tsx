'use client';

import { CATEGORY_LABELS, COMMON_REGIONS, WORK_TYPE_LABELS } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FiltersProps {
  filters: {
    category: string;
    workType: string;
  };
  onChange: (key: string, value: string) => void;
}

export function Filters({ filters, onChange }: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex-1 min-w-[150px]">
        <label className="block text-sm font-medium text-foreground mb-2">
          职位类型
        </label>
        <Select
          value={filters.category || 'all'}
          onValueChange={(value) => onChange('category', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-sm font-medium text-foreground mb-2">
          工作性质
        </label>
        <Select
          value={filters.workType || 'all'}
          onValueChange={(value) => onChange('workType', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="全部性质" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部性质</SelectItem>
            {Object.entries(WORK_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
