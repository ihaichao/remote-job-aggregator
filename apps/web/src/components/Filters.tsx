'use client';

import { CATEGORY_LABELS, WORK_TYPE_LABELS } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter } from 'lucide-react';

interface FiltersProps {
  filters: {
    category: string;
    workType: string;
  };
  onChange: (key: string, value: string) => void;
}

export function Filters({ filters, onChange }: FiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-card border border-border rounded-xl">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">筛选</span>
      </div>
      
      <div className="flex flex-wrap gap-3 flex-1">
        <div className="min-w-[160px]">
          <Select
            value={filters.category || 'all'}
            onValueChange={(value) => onChange('category', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="bg-background border-border h-10">
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

        <div className="min-w-[160px]">
          <Select
            value={filters.workType || 'all'}
            onValueChange={(value) => onChange('workType', value === 'all' ? '' : value)}
          >
            <SelectTrigger className="bg-background border-border h-10">
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
    </div>
  );
}
