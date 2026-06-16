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
  X,
  PenLine,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/store';
import PatientCard from '@/components/PatientCard';
import StatusBadge from '@/components/StatusBadge';
import SignaturePad from '@/components/SignaturePad';
import { groupAndSortOrders } from '@/utils/order';
import { formatTime, isOverdue, isUpcoming } from '@/utils/time';
import { cn } from '@/lib/utils';
import type { Order, OrderType, Patient, ExceptionRecord } from '@/types';

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

interface PatientSummary {
  patient: Patient;
  pendingCount: number;
  earliestTime: string | null;
  hasConflict: boolean;
  hasPendingException: boolean;
}

export default function PendingOrders() {
  const navigate = useNavigate();
  const patients = useAppStore((state) => state.patients);
  const orders = useAppStore((state) => state.orders);
  const exceptionRecords = useAppStore((state) => state.exceptionRecords);
  const currentUser = useAppStore((state) => state.currentUser);
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

  const [showBatchExecuteModal, setShowBatchExecuteModal] = useState(false);
  const [showBatchExceptionModal, setShowBatchExceptionModal] = useState(false);
  const [showBatchSignature, setShowBatchSignature] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [batchExceptionType, setBatchExceptionType] = useState<ExceptionRecord['type']>('暂停');
  const [batchExceptionReason, setBatchExceptionReason] = useState('');
  const [batchExceptionDesc, setBatchExceptionDesc] = useState('');

  const executeOrdersBatch = useAppStore((state) => state.executeOrdersBatch);
  const reportException = useAppStore((state) => state.reportException);

  const presetReasons = ['药品破损', '患者拒绝', '医嘱疑问', '过敏风险', '其他'];

  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach((p) => map.set(p.id, p));
    return map;
  }, [patients]);

  const patientSummaries = useMemo<PatientSummary[]>(() => {
    const pendingOrders = getPendingOrders();
    return patients
      .map((patient) => {
        const patientOrders = pendingOrders.filter((o) => o.patientId === patient.id);
        const earliestOrder = patientOrders.reduce<Order | null>((earliest, order) => {
          if (!earliest) return order;
          return new Date(order.plannedTime) < new Date(earliest.plannedTime) ? order : earliest;
        }, null);
        const hasConflict = patientOrders.some((o) => o.isConflict);
        const hasPendingException = exceptionRecords.some(
          (r) => r.patientId === patient.id && r.status === '待审核',
        );
        return {
          patient,
          pendingCount: patientOrders.length,
          earliestTime: earliestOrder ? earliestOrder.plannedTime : null,
          hasConflict,
          hasPendingException,
        };
      })
      .filter((s) => s.pendingCount > 0)
      .sort((a, b) => {
        if (a.earliestTime && b.earliestTime) {
          return new Date(a.earliestTime).getTime() - new Date(b.earliestTime).getTime();
        }
        if (a.earliestTime) return -1;
        if (b.earliestTime) return 1;
        return 0;
      });
  }, [patients, getPendingOrders, exceptionRecords]);

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
    navigate(`/exceptions?orderId=${orderId}`);
  };

  const handleBatchExecute = () => {
    if (selectedOrderIds.length === 0) return;
    setShowBatchExecuteModal(true);
  };

  const handleBatchMark = () => {
    if (selectedOrderIds.length === 0) return;
    setBatchExceptionType('暂停');
    setBatchExceptionReason('');
    setBatchExceptionDesc('');
    setShowBatchExceptionModal(true);
  };

  const handleConfirmBatchExecute = (signatureData: string) => {
    if (!currentUser || selectedOrderIds.length === 0) return;

    const count = selectedOrderIds.length;
    const processedCount = executeOrdersBatch(selectedOrderIds, currentUser.id, signatureData, true, false);
    const actualCount = processedCount > 0 ? processedCount : count;

    setShowBatchSignature(false);
    setShowBatchExecuteModal(false);
    clearOrderSelect();
    setSuccessMessage(`已成功批量执行 ${actualCount} 条医嘱`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const handleConfirmBatchException = (signatureData: string) => {
    if (!currentUser || selectedOrderIds.length === 0) return;

    const count = selectedOrderIds.length;
    const finalReason = batchExceptionReason === '其他' ? batchExceptionDesc : batchExceptionReason;
    let processedCount = 0;

    selectedOrderIds.forEach((orderId) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      reportException({
        orderId,
        patientId: order.patientId,
        type: batchExceptionType,
        reason: finalReason,
        customReason: batchExceptionReason === '其他' ? batchExceptionDesc : undefined,
        description: batchExceptionDesc,
        reporterId: currentUser.id,
        reporterName: currentUser.name,
      });
      processedCount++;
    });

    setShowBatchSignature(false);
    setShowBatchExceptionModal(false);
    clearOrderSelect();
    setSuccessMessage(`已成功登记 ${processedCount} 条异常记录`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const resetBatchForm = () => {
    setBatchExceptionType('暂停');
    setBatchExceptionReason('');
    setBatchExceptionDesc('');
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
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center rounded-2xl bg-white p-10 shadow-2xl animate-fade-in">
            <div className="mb-4 rounded-full bg-green-100 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800">操作成功！</div>
            <div className="mt-2 text-slate-500">{successMessage}</div>
          </div>
        </div>
      )}

      {showBatchExecuteModal && !showBatchSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="text-xl font-bold text-slate-800">批量执行确认</div>
              <button
                onClick={() => setShowBatchExecuteModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 rounded-xl border-2 border-primary-200 bg-primary-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-primary-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-base font-bold">请确认以下信息</span>
                </div>
                <div className="text-sm text-primary-600">
                  即将批量执行 <span className="font-bold">{selectedOrderIds.length}</span> 条医嘱
                </div>
              </div>

              <div className="mb-4 max-h-60 overflow-y-auto rounded-xl border border-slate-200">
                {selectedOrderIds.slice(0, 5).map((orderId) => {
                  const order = orders.find((o) => o.id === orderId);
                  const patient = patientMap.get(order?.patientId || '');
                  return order ? (
                    <div key={orderId} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
                      <CheckCircle2 className="h-5 w-5 text-primary-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {patient?.bedNo} {patient?.name} - {order.content}
                        </div>
                        <div className="text-xs text-slate-500">
                          计划时间：{formatTime(order.plannedTime)}
                        </div>
                      </div>
                    </div>
                  ) : null;
                })}
                {selectedOrderIds.length > 5 && (
                  <div className="px-4 py-3 text-center text-sm text-slate-500 border-t border-slate-100">
                    还有 {selectedOrderIds.length - 5} 条医嘱未显示...
                  </div>
                )}
              </div>

              <div className="mb-4 rounded-lg bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <span className="font-bold">重要提示：</span>
                    批量执行将跳过扫码核对环节，默认已完成患者身份核对。请确保已人工核对无误后再执行。
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBatchExecuteModal(false)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  onClick={() => setShowBatchSignature(true)}
                  className="flex-1 rounded-xl bg-primary-500 px-5 py-3 text-base font-semibold text-white transition-all hover:bg-primary-600 active:bg-primary-700"
                >
                  签名确认执行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBatchExceptionModal && !showBatchSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div className="text-xl font-bold text-slate-800">批量异常登记</div>
              <button
                onClick={() => {
                  setShowBatchExceptionModal(false);
                  resetBatchForm();
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-base font-bold">批量标记异常</span>
                </div>
                <div className="text-sm text-amber-600">
                  即将为 <span className="font-bold">{selectedOrderIds.length}</span> 条医嘱登记异常
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    异常类型
                  </label>
                  <select
                    value={batchExceptionType}
                    onChange={(e) => setBatchExceptionType(e.target.value as ExceptionRecord['type'])}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="拒绝执行">拒绝执行</option>
                    <option value="补录">补录</option>
                    <option value="暂停">暂停</option>
                    <option value="冲突">冲突</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    异常原因
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {presetReasons.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setBatchExceptionReason(reason)}
                        className={cn(
                          'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                          batchExceptionReason === reason
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                        )}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                {batchExceptionReason === '其他' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      自定义原因
                    </label>
                    <input
                      type="text"
                      value={batchExceptionReason === '其他' ? batchExceptionDesc : ''}
                      onChange={(e) => setBatchExceptionDesc(e.target.value)}
                      placeholder="请输入自定义原因"
                      className="input-base"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    详细说明
                  </label>
                  <textarea
                    value={batchExceptionReason !== '其他' ? batchExceptionDesc : ''}
                    onChange={(e) => setBatchExceptionDesc(e.target.value)}
                    placeholder="请详细描述异常情况..."
                    rows={4}
                    className="input-base resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowBatchExceptionModal(false);
                    resetBatchForm();
                  }}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  onClick={() => setShowBatchSignature(true)}
                  disabled={
                    !batchExceptionReason ||
                    (batchExceptionReason === '其他' && !batchExceptionDesc.trim()) ||
                    (batchExceptionReason !== '其他' && !batchExceptionDesc.trim())
                  }
                  className="flex-1 rounded-xl bg-primary-500 px-5 py-3 text-base font-semibold text-white transition-all hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  签名确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBatchSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="px-6 pt-6">
              <div className="text-xl font-bold text-slate-800">护士签名确认</div>
              <div className="mt-1 text-sm text-slate-500">
                执行人：{currentUser?.name}（工号：{currentUser?.jobNo}）
              </div>
            </div>
            <SignaturePad
              onConfirm={showBatchExecuteModal ? handleConfirmBatchExecute : handleConfirmBatchException}
              onCancel={() => setShowBatchSignature(false)}
              width={600}
              height={200}
            />
          </div>
        </div>
      )}
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

      {patientSummaries.length > 0 && (
        <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-slate-700">按病人汇总</span>
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                {patientSummaries.length} 位患者有待执行医嘱
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {patientSummaries.map((summary) => {
              const isSelected = selectedPatientId === summary.patient.id;
              const isOverdueTime = summary.earliestTime ? isOverdue(summary.earliestTime) : false;
              const isUpcomingTime = summary.earliestTime ? isUpcoming(summary.earliestTime) : false;
              const badgeColor = isOverdueTime
                ? 'bg-red-500 text-white'
                : isUpcomingTime
                ? 'bg-amber-500 text-white'
                : 'bg-primary-500 text-white';

              return (
                <button
                  key={summary.patient.id}
                  onClick={() => selectPatient(isSelected ? null : summary.patient.id)}
                  className={cn(
                    'relative rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-1'
                      : 'border-slate-200 bg-white hover:border-slate-300',
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-2xl font-bold text-slate-800">
                        {summary.patient.bedNo.replace('床', '')}
                      </span>
                      <span className="ml-1 text-sm text-slate-500">床</span>
                      <span className="ml-2 text-lg font-semibold text-slate-800">
                        {summary.patient.name}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-sm font-bold min-w-[32px] text-center',
                        badgeColor,
                      )}
                    >
                      {summary.pendingCount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className={cn('h-4 w-4', isOverdueTime ? 'text-red-500' : 'text-slate-400')} />
                    <span className={cn(isOverdueTime ? 'text-red-600 font-medium' : 'text-slate-600')}>
                      {summary.earliestTime
                        ? isOverdueTime
                          ? `已超时 ${formatTime(summary.earliestTime)}`
                          : formatTime(summary.earliestTime)
                        : '-'}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    {summary.hasConflict && (
                      <div className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-xs font-medium text-red-700">冲突</span>
                      </div>
                    )}
                    {summary.hasPendingException && (
                      <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-xs font-medium text-amber-700">待审核</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
