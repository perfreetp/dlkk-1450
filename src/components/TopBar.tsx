import { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatTime, formatDate, isOverdue, isUpcoming } from '@/utils/time';

export default function TopBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const orders = useAppStore((state) => state.orders);
  const exceptionRecords = useAppStore((state) => state.exceptionRecords);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pendingCount = orders.filter((o) => o.status === '待执行' || o.status === '执行中').length;
  const upcomingCount = orders.filter(
    (o) => (o.status === '待执行' || o.status === '执行中') && isUpcoming(o.plannedTime),
  ).length;
  const overdueCount = orders.filter(
    (o) => (o.status === '待执行' || o.status === '漏执行') && isOverdue(o.plannedTime),
  ).length;
  const exceptionCount = exceptionRecords.filter((r) => r.status === '待审核').length;

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-700">
          <MapPin className="h-5 w-5 text-blue-600" />
          <span className="font-medium">心内科病房</span>
        </div>
        <div className="text-slate-500">
          <span className="text-sm">{formatDate(currentTime)}</span>
          <span className="mx-2 text-slate-300">|</span>
          <span className="text-sm font-mono">{formatTime(currentTime)}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">待执行</span>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-sm font-semibold text-blue-700">
              {pendingCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">即将执行</span>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 text-sm font-semibold text-amber-700">
              {upcomingCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">超时未执行</span>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-100 px-2 text-sm font-semibold text-orange-700">
              {overdueCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">异常</span>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-100 px-2 text-sm font-semibold text-red-700">
              {exceptionCount}
            </span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索患者、医嘱..."
            className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white"
          />
        </div>
      </div>
    </header>
  );
}
