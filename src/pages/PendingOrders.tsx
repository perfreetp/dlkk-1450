import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  QrCode,
  AlertTriangle,
  CheckSquare,
  Square,
  Play,
  Flag,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store';
import PatientCard from '@/components/PatientCard';
import StatusBadge from '@/components/StatusBadge';
import { groupAndSortOrders } from '@/utils/order';
import { formatTime, isOverdue, isUpcoming } from '@/utils/time';
import { cn } from '@/lib/utils';
import type { Order, OrderType, Patient } from '@/types';

type TimeTab = 'all' | 'overdue' | 'upcoming' | 'today';
type TypeFilter = 'all' | OrderType;

const TIME_TABS: { key: TimeTab; label: string; icon: typeof Clock }[] = [
  { key: 'all', label: '全部', icon: Clock },
  { key: 'overdue', label: '超时未执行', icon: AlertTriangle },
  { key: 'upcoming', label: '即将执行', icon: Clock },
  { key: 'today', label: '今日待执行', icon: Clock },
];

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: '药品', label: '药品' },
  { key: '治疗', label: '治疗' },
  { key: '检查', label: '检查' },
  { key: '护理', label: '护理' },
];

const GROUP_TITLES: Record<string, { title: string; color: string }> = {
  overdue: { title: '超时未执行', color: 'text-red-600 bg-red-50 border-red-200' },
  upcoming: { title: '即将执行（30分钟内）', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  today: { title: '今日待执行', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  later: { title: '后续待执行', color: 'text-slate-600 bg-slate-50 border-slate-200' },
};

interface OrderCardProps {
  order: Order;
  patient: Patient | undefined;
  isSelected: boolean;
  onToggleSelect: () => void;
  onScanVerify: () => void;
  onException: () => void;
}

function OrderCard({
  order,
  patient,
  isSelected,
  onToggleSelect,
  onScanVerify,
  onException,
}: OrderCardProps) {
  const overdue = isOverdue(order.plannedTime);
  const upcoming = isUpcoming(order.plannedTime);

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 p-5 transition-all duration-300',
        order.isConflict && 'border-red-400 bg-red-50 animate-pulse-red',
        !order.isConflict && overdue && 'border-red-300 bg-red-50/50 animate-pulse-red',
        !order.isConflict && !overdue && upcoming && 'border-amber-400 bg-amber-50/30',
        !order.isConflict && !overdue && !upcoming && 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm',
      )}
    >
      {order.isConflict && (
        <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-semibold text-white">
          <AlertTriangle className="h-3 w-3" />
          冲突
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center pt-0.5">
          <button onClick={onToggleSelect} className="focus:outline-none">
            {isSelected ? (
              <CheckSquare className="h-6 w-6 text-primary-500" />
            ) : (
              <Square className="h-6 w-6 text-slate-400 hover:text-slate-600" />
            )}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-slate-800">
              {patient?.bedNo} {patient?.name}
            </span>
            <StatusBadge status={order.type} variant="type" />
            <StatusBadge status={order.priority} variant="priority" />
            <StatusBadge status={order.status} variant="status" />
          </div>

          <div className="mb-2">
            <div className="text-base font-semibold text-slate-800">{order.content}</div>
            {(order.specification || order.dosage || order.usage) && (
              <div className="mt-0.5 text-sm text-slate-500">
                {order.specification && <span>规格：{order.specification}　</span>}
                {order.dosage && <span>剂量：{order.dosage}　</span>}
                {order.usage && <span>用法：{order.usage}</span>}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              计划时间：{formatTime(order.plannedTime)}
            </span>
            <span>开单医生：{order.doctorName}</span>
          </div>

          {order.isConflict && order.conflictReason && (
            <div className="mt-3 rounded-lg border border-red-300 bg-red-100/70 px-3 py-2 text-sm font-medium text-red-700">
              ⚠️ {order.conflictReason}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <button
            onClick={onScanVerify}
            className={cn(
              'flex min-w-[120px] items-center justify-center gap-2 rounded-lg px-5 py-3 text-base font-semibold transition-all',
              'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm hover:shadow-md',
            )}
          >
            <QrCode className="h-5 w-5" />
            扫码核对
          </button>
          <button
            onClick={onException}
            className="flex min-w-[120px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50 active:bg-slate-100"
          >
            <Flag className="h-5 w-5" />
            异常处理
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PendingOrders() {
  const navigate = useNavigate();
  const patients = useAppStore((state) => state.patients);
  const selectedPatientId = useAppStore((state) => state.selectedPatientId);
  const selectPatient = useAppStore((state) => state.selectPatient);
  const getPendingOrders = useAppStore((state) => state.getPendingOrders);
  const selectedOrderIds = useAppStore((state) => state.selectedOrderIds);
  const toggleOrderSelect = useAppStore((state) => state.toggleOrderSelect);
  const clearOrderSelect = useAppStore((state) => state.clearOrderSelect);
  const selectAllOrders = useAppStore((state) => state.selectAllOrders);

  const [timeTab, setTimeTab] = useState<TimeTab>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchText, setSearchText] = useState('');

  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach((p) => map.set(p.id, p));
    return map;
  }, [patients]);

  const filteredOrders = useMemo(() => {
    let orders = getPendingOrders();

    if (selectedPatientId) {
      orders = orders.filter((o) => o.patientId === selectedPatientId);
    }

    if (timeTab !== 'all') {
      orders = orders.filter((o) => {
        if (timeTab === 'overdue') return isOverdue(o.plannedTime);
        if (timeTab === 'upcoming') return isUpcoming(o.plannedTime);
        if (timeTab === 'today') {
          const planned = new Date(o.plannedTime);
          const now = new Date();
          return (
            planned.getFullYear() === now.getFullYear() &&
            planned.getMonth() === now.getMonth() &&
            planned.getDate() === now.getDate()
          );
        }
        return true;
      });
    }

    if (typeFilter !== 'all') {
      orders = orders.filter((o) => o.type === typeFilter);
    }

    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();
      orders = orders.filter((o) => {
        const patient = patientMap.get(o.patientId);
        return (
          o.content.toLowerCase().includes(keyword) ||
          o.orderNo.toLowerCase().includes(keyword) ||
          o.doctorName.toLowerCase().includes(keyword) ||
          patient?.name.toLowerCase().includes(keyword) ||
          patient?.bedNo.toLowerCase().includes(keyword) ||
          patient?.hospitalNo.toLowerCase().includes(keyword)
        );
      });
    }

    return orders;
  }, [getPendingOrders, selectedPatientId, timeTab, typeFilter, searchText, patientMap]);

  const groupedOrders = useMemo(() => groupAndSortOrders(filteredOrders), [filteredOrders]);

  const visibleOrderIds = useMemo(
    () => filteredOrders.map((o) => o.id),
    [filteredOrders],
  );

  const allSelected =
    visibleOrderIds.length > 0 && visibleOrderIds.every((id) => selectedOrderIds.includes(id));
  const someSelected = visibleOrderIds.some((id) => selectedOrderIds.includes(id));

  const handleSelectAll = () => {
    if (allSelected) {
      clearOrderSelect();
    } else {
      selectAllOrders(visibleOrderIds);
    }
  };

  const handleScanVerify = (orderId: string) => {
    navigate(`/scan?orderId=${orderId}`);
  };

  const handleException = (orderId: string) => {
    console.log('异常处理', orderId);
  };

  const handleBatchExecute = () => {
    console.log('批量执行', selectedOrderIds);
  };

  const handleBatchMark = () => {
    console.log('批量标记', selectedOrderIds);
  };

  const renderGroup = (key: keyof typeof groupedOrders) => {
    const orders = groupedOrders[key];
    if (orders.length === 0) return null;

    const groupInfo = GROUP_TITLES[key];

    return (
      <div key={key} className="mb-6 animate-fade-in">
        <div
          className={cn(
            'mb-3 flex items-center gap-2 rounded-lg border px-4 py-2.5',
            groupInfo.color,
          )}
        >
          <span className="text-base font-semibold">{groupInfo.title}</span>
          <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-sm font-semibold">
            {orders.length}
          </span>
          <ChevronRight className="ml-auto h-5 w-5 opacity-60" />
        </div>
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              patient={patientMap.get(order.patientId)}
              isSelected={selectedOrderIds.includes(order.id)}
              onToggleSelect={() => toggleOrderSelect(order.id)}
              onScanVerify={() => handleScanVerify(order.id)}
              onException={() => handleException(order.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="overflow-x-auto px-4 py-3">
          <div className="flex gap-3">
            <button
              onClick={() => selectPatient(null)}
              className={cn(
                'flex h-auto w-auto shrink-0 flex-col items-center justify-center rounded-xl border-2 px-5 py-4 transition-all hover:shadow-md',
                selectedPatientId === null
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                  : 'border-slate-200 bg-white',
              )}
            >
              <span className="text-2xl font-bold text-slate-700">全部</span>
              <span className="mt-1 text-xs text-slate-500">{patients.length} 位患者</span>
            </button>
            {patients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {TIME_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = timeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setTimeTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1">
            {TYPE_FILTERS.map((filter) => {
              const isActive = typeFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => setTypeFilter(filter.key)}
                  className={cn(
                    'rounded-md px-3.5 py-1.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800',
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索患者姓名、床号、医嘱内容..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-base text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
      </div>

      {(selectedOrderIds.length > 0 || someSelected) && (
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-primary-50 px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-primary-100"
            >
              {allSelected ? (
                <CheckSquare className="h-5 w-5 text-primary-600" />
              ) : (
                <Square className={cn('h-5 w-5', someSelected && 'text-primary-500')} />
              )}
              全选
            </button>
            <span className="rounded-full bg-primary-500 px-3 py-0.5 text-sm font-semibold text-white">
              已选 {selectedOrderIds.length} 条
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleBatchExecute}
                disabled={selectedOrderIds.length === 0}
                className="flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                批量执行
              </button>
              <button
                onClick={handleBatchMark}
                disabled={selectedOrderIds.length === 0}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Flag className="h-4 w-4" />
                批量标记
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filteredOrders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-6">
              <Search className="h-12 w-12 text-slate-400" />
            </div>
            <div className="text-lg font-medium text-slate-600">暂无符合条件的医嘱</div>
            <div className="mt-1 text-sm text-slate-400">请尝试调整筛选条件</div>
          </div>
        ) : (
          <>
            {renderGroup('overdue')}
            {renderGroup('upcoming')}
            {renderGroup('today')}
            {renderGroup('later')}
          </>
        )}
      </div>
    </div>
  );
}
