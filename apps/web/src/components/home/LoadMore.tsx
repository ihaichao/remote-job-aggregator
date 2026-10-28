interface LoadMoreProps {
  loaded: number;
  total: number;
  loading: boolean;
  error?: string | null;
  onLoadMore: () => void;
}

export function LoadMore({ loaded, total, loading, error, onLoadMore }: LoadMoreProps) {
  const percent = total > 0 ? Math.min(100, (loaded / total) * 100) : 0;
  const done = loaded >= total;

  return (
    <div className="mt-[26px] flex flex-col items-center gap-3">
      <div className="h-1 w-[220px] overflow-hidden rounded-full bg-line">
        <span className="block h-full rounded-full bg-orange transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm text-muted-foreground">
        已显示 <b className="font-semibold text-ink">{loaded}</b> / {total} 个职位
      </p>
      {done ? (
        <p className="text-sm text-muted-foreground">已经到底了</p>
      ) : (
        <>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="btn-primary px-[26px] py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {loading ? '加载中…' : error ? '重试' : '加载更多职位'}
          </button>
        </>
      )}
    </div>
  );
}
