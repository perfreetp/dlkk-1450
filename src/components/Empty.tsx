import { cn } from '@/lib/utils';

interface EmptyProps {
  description?: string;
}

export default function Empty({ description = '暂无数据' }: EmptyProps) {
  return (
    <div className={cn('flex h-full flex-col items-center justify-center py-12')}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <svg
          className="h-8 w-8 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="mt-4 text-sm text-slate-500">{description}</p>
    </div>
  );
}
