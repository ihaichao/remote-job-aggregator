'use client';

import { useState } from 'react';
import { CATEGORY_LABELS, WORK_TYPE_LABELS, COMMON_REGIONS } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface FiltersProps {
  filters: {
    category: string;
    workType: string;
    region: string;
    keyword: string;
  };
  onChange: (key: string, value: string) => void;
}

export function Filters({ filters, onChange }: FiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.keyword);

  const handleSearch = () => {
    onChange('keyword', searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col gap-5 p-5 bg-card border border-border rounded-xl">
      {/* Row 1: Search */}
      <div className="relative w-full">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索职位"
            className="w-full h-11 pl-4 pr-12 rounded-xl bg-background border border-border text-sm outline-none transition-all focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="absolute right-2 h-7 w-7 flex items-center justify-center rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
            aria-label="搜索"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Row 2: Selects */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="min-w-[140px] flex-1 sm:flex-none">
            <Select
              value={filters.region || 'all'}
              onValueChange={(value) => onChange('region', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="bg-background border-border h-10 rounded-lg">
                <SelectValue placeholder="全部地域" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部地域</SelectItem>
                {Object.entries(COMMON_REGIONS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[140px] flex-1 sm:flex-none">
            <Select
              value={filters.workType || 'all'}
              onValueChange={(value) => onChange('workType', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="bg-background border-border h-10 rounded-lg">
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
    </div>
  );
}
