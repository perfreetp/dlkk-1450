import { useState, useEffect } from 'react';
import { Search, MapPin, User, ChevronDown, Stethoscope, Pill, UserCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatTime, formatDate, isOverdue, isUpcoming } from '@/utils/time';
import { mockUsers } from '@/data/users';
import { cn } from '@/lib/utils';

export default function TopBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const orders = useAppStore((state) => state.orders);
  const exceptionRecords = useAppStore((state) => state.exceptionRecords);
  const currentUser = useAppStore((state) => state.currentUser);
  const login = useAppStore((state) => state.login);

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

        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 hover:bg-slate-100 transition-colors"
          >
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full',
              currentUser?.role === '护士' && 'bg-blue-100',
              currentUser?.role === '医生' && 'bg-green-100',
              currentUser?.role === '药师' && 'bg-purple-100',
            )}>
              {currentUser?.role === '护士' && <User className="h-4 w-4 text-blue-600" />}
              {currentUser?.role === '医生' && <Stethoscope className="h-4 w-4 text-green-600" />}
              {currentUser?.role === '药师' && <Pill className="h-4 w-4 text-purple-600" />}
              {!currentUser && <UserCircle className="h-4 w-4 text-slate-400" />}
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-slate-800">{currentUser?.name || '未登录'}</div>
              <div className="text-xs text-slate-500">{currentUser?.role || ''} · {currentUser?.jobNo || ''}</div>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', showRoleMenu && 'rotate-180')} />
          </button>

          {showRoleMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowRoleMenu(false)} />
              <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-500">切换登录角色</div>
                </div>
                <div className="py-1">
                  {mockUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        login(user.jobNo);
                        setShowRoleMenu(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors',
                        currentUser?.id === user.id && 'bg-primary-50',
                      )}
                    >
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        user.role === '护士' && 'bg-blue-100',
                        user.role === '医生' && 'bg-green-100',
                        user.role === '药师' && 'bg-purple-100',
                      )}>
                        {user.role === '护士' && <User className="h-5 w-5 text-blue-600" />}
                        {user.role === '医生' && <Stethoscope className="h-5 w-5 text-green-600" />}
                        {user.role === '药师' && <Pill className="h-5 w-5 text-purple-600" />}
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-sm font-bold text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.role} · {user.jobNo}</div>
                      </div>
                      {currentUser?.id === user.id && (
                        <div className="h-2 w-2 rounded-full bg-primary-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
