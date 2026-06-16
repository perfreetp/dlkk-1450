import { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  User,
  ArrowRightLeft,
  AlertCircle,
  Play,
  Hourglass,
  ShieldAlert,
  Eye,
  Check,
  ClipboardList,
  FileText,
  AlertTriangle,
  StickyNote,
  History,
  ChevronDown,
  ChevronUp,
  PenLine,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import type { HandoverRecord } from '@/types';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/StatusBadge';
import SignaturePad from '@/components/SignaturePad';
import { cn } from '@/lib/utils';
import { formatTime, formatDate } from '@/utils/time';
import { mockUsers } from '@/data/users';
import type { Order, Patient } from '@/types';

type ShiftType = '早班' | '中班' | '晚班';
type HandoverTab = 'pending' | 'exception' | 'remarks';
type ExpandedCard = 'pending' | 'executing' | 'exception' | 'review' | null;

function getCurrentShift(): ShiftType {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 16) return '早班';
  if (hour >= 16 && hour < 24) return '中班';
  return '晚班';
}

function getShiftColor(shift: ShiftType): string {
  switch (shift) {
    case '早班':
      return 'bg-amber-500';
    case '中班':
      return 'bg-blue-500';
    case '晚班':
      return 'bg-indigo-600';
  }
}

interface StatCardProps {
  title: string;
  count: number;
  icon: typeof AlertCircle;
  color: string;
  bgColor: string;
  borderColor: string;
  isExpanded: boolean;
  isPulsing?: boolean;
  onClick: () => void;
}

function StatCard({
  title,
  count,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  isExpanded,
  isPulsing,
  onClick,
}: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-2xl border-4 p-6 transition-all duration-300',
        bgColor,
        borderColor,
        isExpanded ? 'scale-[1.02] shadow-xl' : 'hover:scale-[1.02] hover:shadow-lg',
        isPulsing && 'animate-pulse-red',
      )}
    >
      <div className={cn('flex items-center gap-2 mb-2', color)}>
        <Icon className="h-6 w-6" />
        <span className="text-lg font-bold">{title}</span>
      </div>
      <div className={cn('text-7xl font-black leading-none', color)}>
        {count}
      </div>
      <div className="mt-3 flex items-center gap-1 text-sm text-slate-500">
        {isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            点击收起
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            点击展开
          </>
        )}
      </div>
    </button>
  );
}

interface OrderListRowProps {
  order: Order;
  patient: Patient | undefined;
  isSelected?: boolean;
  showCheckbox?: boolean;
  onToggleSelect?: () => void;
}

function OrderListRow({ order, patient, isSelected, showCheckbox, onToggleSelect }: OrderListRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all',
        isSelected && 'border-primary-400 bg-primary-50',
      )}
    >
      {showCheckbox && onToggleSelect && (
        <button onClick={onToggleSelect} className="shrink-0">
          {isSelected ? (
            <CheckCircle2 className="h-6 w-6 text-primary-500" />
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-slate-300 hover:border-primary-400" />
          )}
        </button>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-slate-800">
            {patient?.bedNo} {patient?.name}
          </span>
          <StatusBadge status={order.type} variant="type" />
          <StatusBadge status={order.priority} variant="priority" />
          <StatusBadge status={order.status} variant="status" />
        </div>
        <div className="text-sm font-medium text-slate-700">{order.content}</div>
        <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            计划时间：{formatTime(order.plannedTime)}
          </span>
          <span>开单医生：{order.doctorName}</span>
        </div>
      </div>
    </div>
  );
}

export default function HandoverConfirm() {
  const currentUser = useAppStore((state) => state.currentUser);
  const orders = useAppStore((state) => state.orders);
  const patients = useAppStore((state) => state.patients);
  const exceptionRecords = useAppStore((state) => state.exceptionRecords);
  const handoverRecords = useAppStore((state) => state.handoverRecords);
  const createHandover = useAppStore((state) => state.createHandover);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentShift] = useState<ShiftType>(getCurrentShift());
  const [selectedNurseId, setSelectedNurseId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<HandoverTab>('pending');
  const [expandedCard, setExpandedCard] = useState<ExpandedCard>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [remarks, setRemarks] = useState('');
  const [outgoingSignature, setOutgoingSignature] = useState<string>(currentUser?.signature || '');
  const [incomingSignature, setIncomingSignature] = useState<string>('');
  const [showOutgoingPad, setShowOutgoingPad] = useState(false);
  const [showIncomingPad, setShowIncomingPad] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedHandoverRecord, setSelectedHandoverRecord] = useState<HandoverRecord | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser?.signature) {
      setOutgoingSignature(currentUser.signature);
    }
  }, [currentUser]);

  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach((p) => map.set(p.id, p));
    return map;
  }, [patients]);

  const nurseUsers = useMemo(() => {
    return mockUsers.filter((u) => u.role === '护士' && u.id !== currentUser?.id);
  }, [currentUser]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === '待执行' || o.status === '漏执行').length;
    const executing = orders.filter((o) => o.status === '执行中').length;
    const exception = orders.filter((o) => o.status === '异常').length;
    const review = exceptionRecords.filter((r) => r.status === '待审核').length;
    return { pending, executing, exception, review };
  }, [orders, exceptionRecords]);

  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.status === '待执行' || o.status === '漏执行');
  }, [orders]);

  const exceptionOrders = useMemo(() => {
    return orders.filter((o) => o.status === '异常' || o.status === '已暂停');
  }, [orders]);

  const executingOrders = useMemo(() => {
    return orders.filter((o) => o.status === '执行中');
  }, [orders]);

  const reviewOrders = useMemo(() => {
    const reviewOrderIds = exceptionRecords
      .filter((r) => r.status === '待审核')
      .map((r) => r.orderId);
    return orders.filter((o) => reviewOrderIds.includes(o.id));
  }, [orders, exceptionRecords]);

  const canConfirm = useMemo(() => {
    return (
      !!selectedNurseId &&
      !!outgoingSignature &&
      !!incomingSignature
    );
  }, [selectedNurseId, outgoingSignature, incomingSignature]);

  const selectedNurse = nurseUsers.find((u) => u.id === selectedNurseId);

  const getExceptionCountForHandover = (record: HandoverRecord) => {
    const handoverTime = new Date(record.handoverTime).getTime();
    return exceptionRecords.filter((r) => {
      const reportTime = new Date(r.reportTime).getTime();
      return r.status === '待审核' && Math.abs(reportTime - handoverTime) < 4 * 60 * 60 * 1000;
    }).length;
  };

  const toggleOrderSelect = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    );
  };

  const handleToggleCard = (card: ExpandedCard) => {
    setExpandedCard(expandedCard === card ? null : card);
  };

  const handleConfirmHandover = () => {
    if (!currentUser || !selectedNurse || !canConfirm) return;

    createHandover({
      shift: currentShift,
      outgoingNurseId: currentUser.id,
      outgoingNurseName: currentUser.name,
      outgoingSignature,
      incomingNurseId: selectedNurse.id,
      incomingNurseName: selectedNurse.name,
      incomingSignature,
      pendingOrders: selectedOrderIds,
      remarks,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedOrderIds([]);
      setRemarks('');
      setIncomingSignature('');
      setSelectedNurseId('');
    }, 2000);
  };

  const getExpandedOrders = (): Order[] => {
    switch (expandedCard) {
      case 'pending':
        return pendingOrders;
      case 'executing':
        return executingOrders;
      case 'exception':
        return exceptionOrders;
      case 'review':
        return reviewOrders;
      default:
        return [];
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${formatDate(d)} ${formatTime(d)}`;
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-50">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center rounded-2xl bg-white p-10 shadow-2xl">
            <div className="mb-4 rounded-full bg-green-100 p-4">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800">交接成功！</div>
            <div className="mt-2 text-slate-500">交接记录已保存</div>
          </div>
        </div>
      )}

      {selectedHandoverRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <History className="h-6 w-6 text-primary-500" />
                <span className="text-xl font-bold text-slate-800">交接记录详情</span>
              </div>
              <button
                onClick={() => setSelectedHandoverRecord(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6 rounded-xl bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  <span className="text-base font-bold text-slate-800">基本信息</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-500">班次</div>
                    <div className="mt-1">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-3 py-1 text-sm font-bold text-white',
                          getShiftColor(selectedHandoverRecord.shift),
                        )}
                      >
                        {selectedHandoverRecord.shift}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">交接时间</div>
                    <div className="mt-1 text-lg font-bold text-slate-800">
                      {formatDateTime(selectedHandoverRecord.handoverTime)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">交班护士</div>
                    <div className="mt-1 text-lg font-bold text-slate-800">
                      {selectedHandoverRecord.outgoingNurseName}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">接班护士</div>
                    <div className="mt-1 text-lg font-bold text-slate-800">
                      {selectedHandoverRecord.incomingNurseName}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
                  <ClipboardList className="h-5 w-5 text-primary-500" />
                  交接医嘱清单（{selectedHandoverRecord.pendingOrders.length}）
                </div>
                {selectedHandoverRecord.pendingOrders.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 p-6 text-center text-slate-500">
                    <ClipboardList className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    暂无交接医嘱
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedHandoverRecord.pendingOrders.map((orderId) => {
                      const order = orders.find((o) => o.id === orderId);
                      if (!order) return null;
                      const patient = patientMap.get(order.patientId);
                      return (
                        <div
                          key={orderId}
                          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              <span className="text-base font-bold text-slate-800">
                                {patient?.bedNo} {patient?.name}
                              </span>
                              <StatusBadge status={order.type} variant="type" />
                              <StatusBadge status={order.status} variant="status" />
                            </div>
                            <div className="text-sm font-medium text-slate-700">{order.content}</div>
                            <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                计划时间：{formatTime(order.plannedTime)}
                              </span>
                              <span>开单医生：{order.doctorName}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedHandoverRecord.remarks && (
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
                    <StickyNote className="h-5 w-5 text-amber-500" />
                    交接备注
                  </div>
                  <div className="rounded-xl bg-amber-50 p-4 text-slate-700 whitespace-pre-wrap border border-amber-200">
                    {selectedHandoverRecord.remarks}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
                  <ShieldAlert className="h-5 w-5 text-orange-500" />
                  异常统计
                </div>
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-orange-100 p-3">
                      <ShieldAlert className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-orange-700">待审核异常数量</div>
                      <div className="text-4xl font-black text-orange-600">
                        {getExceptionCountForHandover(selectedHandoverRecord)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
                  <PenLine className="h-5 w-5 text-primary-500" />
                  双方签名
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="rounded-full bg-primary-100 p-1.5">
                        <User className="h-4 w-4 text-primary-600" />
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        交班护士签名
                      </div>
                    </div>
                    <div className="flex h-24 items-center justify-center rounded-lg bg-white border border-slate-200">
                      {selectedHandoverRecord.outgoingSignature ? (
                        <span className="text-2xl font-bold text-slate-700">
                          {selectedHandoverRecord.outgoingSignature}
                        </span>
                      ) : (
                        <span className="text-slate-400">未签名</span>
                      )}
                    </div>
                    <div className="mt-2 text-center text-sm font-medium text-slate-600">
                      {selectedHandoverRecord.outgoingNurseName}
                    </div>
                  </div>
                  <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="rounded-full bg-green-100 p-1.5">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        接班护士签名
                      </div>
                    </div>
                    <div className="flex h-24 items-center justify-center rounded-lg bg-white border border-slate-200">
                      {selectedHandoverRecord.incomingSignature ? (
                        <span className="text-2xl font-bold text-slate-700">
                          {selectedHandoverRecord.incomingSignature}
                        </span>
                      ) : (
                        <span className="text-slate-400">未签名</span>
                      )}
                    </div>
                    <div className="mt-2 text-center text-sm font-medium text-slate-600">
                      {selectedHandoverRecord.incomingNurseName}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-primary-500" />
                <span className="text-xl font-bold text-slate-800">交接单预览</span>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 rounded-xl bg-slate-50 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-500">班次</div>
                    <div className="mt-1 text-lg font-bold text-slate-800">{currentShift}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">交接时间</div>
                    <div className="mt-1 text-lg font-bold text-slate-800">
                      {formatDateTime(currentTime.toISOString())}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">交班护士</div>
                    <div className="mt-1 text-lg font-bold text-slate-800">
                      {currentUser?.name || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">接班护士</div>
                    <div className="mt-1 text-lg font-bold text-slate-800">
                      {selectedNurse?.name || '-'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
                  <ClipboardList className="h-5 w-5 text-primary-500" />
                  交接项目（{selectedOrderIds.length}）
                </div>
                {selectedOrderIds.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 p-4 text-center text-slate-500">
                    暂无交接项目
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedOrderIds.map((orderId) => {
                      const order = orders.find((o) => o.id === orderId);
                      if (!order) return null;
                      const patient = patientMap.get(order.patientId);
                      return (
                        <div
                          key={orderId}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                        >
                          <span className="font-medium text-slate-800">
                            {patient?.bedNo} {patient?.name}
                          </span>
                          <span className="text-slate-600">- {order.content}</span>
                          <StatusBadge status={order.status} variant="status" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {remarks && (
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
                    <StickyNote className="h-5 w-5 text-amber-500" />
                    注意事项
                  </div>
                  <div className="rounded-lg bg-amber-50 p-4 text-slate-700 whitespace-pre-wrap">
                    {remarks}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-600">交班护士签名</div>
                  <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                    {outgoingSignature ? (
                      <span className="text-2xl font-bold text-slate-700">
                        {outgoingSignature}
                      </span>
                    ) : (
                      <span className="text-slate-400">未签名</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-600">接班护士签名</div>
                  <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                    {incomingSignature ? (
                      <span className="text-2xl font-bold text-slate-700">
                        {incomingSignature}
                      </span>
                    ) : (
                      <span className="text-slate-400">未签名</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-white font-bold',
                  getShiftColor(currentShift),
                )}
              >
                <ArrowRightLeft className="h-5 w-5" />
                {currentShift}
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                <Clock className="h-5 w-5 text-slate-600" />
                <span className="font-mono text-lg font-bold text-slate-700">
                  {formatTime(currentTime)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary-100 p-1.5">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">交班护士</div>
                  <div className="text-base font-bold text-slate-800">
                    {currentUser?.name || '未登录'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-full bg-green-100 p-1.5">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">接班护士</div>
                <select
                  value={selectedNurseId}
                  onChange={(e) => setSelectedNurseId(e.target.value)}
                  className="border-0 bg-transparent text-base font-bold text-slate-800 focus:outline-none focus:ring-0 cursor-pointer min-w-[120px]"
                >
                  <option value="">请选择...</option>
                  {nurseUsers.map((nurse) => (
                    <option key={nurse.id} value={nurse.id}>
                      {nurse.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <StatCard
            title="待执行"
            count={stats.pending}
            icon={Hourglass}
            color="text-blue-600"
            bgColor="bg-blue-50"
            borderColor="border-blue-300"
            isExpanded={expandedCard === 'pending'}
            onClick={() => handleToggleCard('pending')}
          />
          <StatCard
            title="执行中"
            count={stats.executing}
            icon={Play}
            color="text-cyan-600"
            bgColor="bg-cyan-50"
            borderColor="border-cyan-300"
            isExpanded={expandedCard === 'executing'}
            onClick={() => handleToggleCard('executing')}
          />
          <StatCard
            title="异常中"
            count={stats.exception}
            icon={AlertTriangle}
            color="text-red-600"
            bgColor="bg-red-50"
            borderColor="border-red-400"
            isExpanded={expandedCard === 'exception'}
            isPulsing={stats.exception > 0}
            onClick={() => handleToggleCard('exception')}
          />
          <StatCard
            title="待审核"
            count={stats.review}
            icon={ShieldAlert}
            color="text-orange-600"
            bgColor="bg-orange-50"
            borderColor="border-orange-300"
            isExpanded={expandedCard === 'review'}
            onClick={() => handleToggleCard('review')}
          />
        </div>

        {expandedCard && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-bold text-slate-800">
                {expandedCard === 'pending' && '待执行医嘱列表'}
                {expandedCard === 'executing' && '执行中医嘱列表'}
                {expandedCard === 'exception' && '异常医嘱列表'}
                {expandedCard === 'review' && '待审核医嘱列表'}
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
                共 {getExpandedOrders().length} 条
              </span>
            </div>
            {getExpandedOrders().length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <AlertCircle className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                暂无数据
              </div>
            ) : (
              <div className="space-y-3">
                {getExpandedOrders().map((order) => (
                  <OrderListRow
                    key={order.id}
                    order={order}
                    patient={patientMap.get(order.patientId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-6 pb-5">
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-base font-semibold transition-all',
                activeTab === 'pending'
                  ? 'bg-white text-primary-600 border-b-2 border-primary-500 -mb-px'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
              )}
            >
              <ClipboardList className="h-5 w-5" />
              未执行医嘱
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                {pendingOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('exception')}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-base font-semibold transition-all',
                activeTab === 'exception'
                  ? 'bg-white text-primary-600 border-b-2 border-primary-500 -mb-px'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
              )}
            >
              <AlertTriangle className="h-5 w-5" />
              异常医嘱
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                {exceptionOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('remarks')}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-base font-semibold transition-all',
                activeTab === 'remarks'
                  ? 'bg-white text-primary-600 border-b-2 border-primary-500 -mb-px'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
              )}
            >
              <StickyNote className="h-5 w-5" />
              注意事项
            </button>
          </div>

          <div className="p-5">
            {activeTab === 'pending' && (
              <div>
                {pendingOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <ClipboardList className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                    暂无未执行医嘱
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingOrders.map((order) => (
                      <OrderListRow
                        key={order.id}
                        order={order}
                        patient={patientMap.get(order.patientId)}
                        isSelected={selectedOrderIds.includes(order.id)}
                        showCheckbox
                        onToggleSelect={() => toggleOrderSelect(order.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'exception' && (
              <div>
                {exceptionOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                    暂无异常医嘱
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exceptionOrders.map((order) => (
                      <OrderListRow
                        key={order.id}
                        order={order}
                        patient={patientMap.get(order.patientId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'remarks' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  特殊说明 / 注意事项
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="请输入需要特别说明的内容，如患者特殊情况、药品注意事项等..."
                  rows={8}
                  className="input-base resize-none"
                />
                <div className="mt-2 text-right text-xs text-slate-400">
                  {remarks.length} / 500
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <PenLine className="h-6 w-6 text-primary-500" />
            <span className="text-xl font-bold text-slate-800">双人签名确认</span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary-100 p-1.5">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">交班护士</div>
                    <div className="text-base font-bold text-slate-800">
                      {currentUser?.name || '-'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowOutgoingPad(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-primary-300 bg-white px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <PenLine className="h-4 w-4" />
                  {outgoingSignature ? '重签' : '签名'}
                </button>
              </div>
              <div className="flex h-32 items-center justify-center rounded-lg bg-white">
                {outgoingSignature ? (
                  <span className="text-3xl font-bold text-slate-700">
                    {outgoingSignature}
                  </span>
                ) : (
                  <span className="text-slate-400">点击右上角按钮签名</span>
                )}
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-1.5">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">接班护士</div>
                    <div className="text-base font-bold text-slate-800">
                      {selectedNurse?.name || '请先选择接班护士'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowIncomingPad(true)}
                  disabled={!selectedNurseId}
                  className="flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                >
                  <PenLine className="h-4 w-4" />
                  {incomingSignature ? '重签' : '签名'}
                </button>
              </div>
              <div className="flex h-32 items-center justify-center rounded-lg bg-white">
                {incomingSignature ? (
                  <span className="text-3xl font-bold text-slate-700">
                    {incomingSignature}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    {selectedNurseId ? '点击右上角按钮签名' : '请先选择接班护士'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-slate-50 px-4 py-3">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600">
              交接时间：
              <span className="font-mono font-bold text-slate-800">
                {formatDateTime(currentTime.toISOString())}
              </span>
            </span>
          </div>
        </div>
      </div>

      {showOutgoingPad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 text-xl font-bold text-slate-800">交班护士签名</div>
            <SignaturePad
              onConfirm={(sig) => {
                setOutgoingSignature(sig);
                setShowOutgoingPad(false);
              }}
              onCancel={() => setShowOutgoingPad(false)}
              width={600}
              height={200}
            />
          </div>
        </div>
      )}

      {showIncomingPad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 text-xl font-bold text-slate-800">接班护士签名</div>
            <SignaturePad
              onConfirm={(sig) => {
                setIncomingSignature(sig);
                setShowIncomingPad(false);
              }}
              onCancel={() => setShowIncomingPad(false)}
              width={600}
              height={200}
            />
          </div>
        </div>
      )}

      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {selectedOrderIds.length > 0 && (
              <span className="mr-4">
                已选择 <span className="font-bold text-primary-600">{selectedOrderIds.length}</span> 条交接项目
              </span>
            )}
            {!canConfirm && (
              <span className="text-amber-600">
                请完成接班护士选择和双人签名后确认交接
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50"
            >
              <Eye className="h-5 w-5" />
              预览交接单
            </button>
            <button
              onClick={handleConfirmHandover}
              disabled={!canConfirm}
              className={cn(
                'flex items-center gap-2 rounded-xl px-8 py-3 text-lg font-bold text-white transition-all',
                canConfirm
                  ? 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 shadow-lg hover:shadow-xl'
                  : 'bg-slate-300 cursor-not-allowed',
              )}
            >
              <Check className="h-6 w-6" />
              确认交接
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-6 w-6 text-slate-600" />
            <span className="text-xl font-bold text-slate-800">历史交接记录</span>
          </div>

          {handoverRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              暂无交接记录
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-600">班次</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-600">交接时间</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-600">交班人</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-600">接班人</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-slate-600">交接项目数</th>
                  </tr>
                </thead>
                <tbody>
                  {[...handoverRecords].reverse().slice(0, 10).map((record) => (
                    <tr
                      key={record.id}
                      onClick={() => setSelectedHandoverRecord(record)}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-3 py-1 text-sm font-bold text-white',
                            getShiftColor(record.shift),
                          )}
                        >
                          {record.shift}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm text-slate-700">
                        {formatDateTime(record.handoverTime)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-700">
                        {record.outgoingNurseName}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-700">
                        {record.incomingNurseName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-bold text-primary-700">
                          {record.pendingOrders.length}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
