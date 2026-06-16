import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  X,
  User,
  ChevronDown,
  FileText,
  ThumbsUp,
  ThumbsDown,
  PenLine,
} from 'lucide-react';
import { useAppStore } from '../store';
import StatusBadge from '../components/StatusBadge';
import SignaturePad from '../components/SignaturePad';
import Empty from '../components/Empty';
import type { ExceptionRecord } from '../types';
import { formatDate, formatTime } from '../utils/time';
import { cn } from '../lib/utils';

const exceptionTypeColors: Record<ExceptionRecord['type'], string> = {
  拒绝执行: 'bg-red-100 text-red-700',
  补录: 'bg-amber-100 text-amber-700',
  暂停: 'bg-blue-100 text-blue-700',
  冲突: 'bg-purple-100 text-purple-700',
};

const presetReasons = ['药品破损', '患者拒绝', '医嘱疑问', '过敏风险', '其他'];

type TabType = '待处理' | '处理中' | '已完成';

export default function ExceptionHandling() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramOrderId = searchParams.get('orderId');
  const paramPatientId = searchParams.get('patientId');
  const paramSource = searchParams.get('source') as ExceptionRecord['source'] | null;
  const paramExpectedBedNo = searchParams.get('expectedBedNo');
  const paramExpectedName = searchParams.get('expectedName');
  const paramActualBedNo = searchParams.get('actualBedNo');
  const paramActualName = searchParams.get('actualName');
  const paramScannedCode = searchParams.get('scannedCode');
  const paramExpectedDrugCode = searchParams.get('expectedDrugCode');
  const paramActualDrugCode = searchParams.get('actualDrugCode');

  const { exceptionRecords, patients, orders, currentUser, reportException, reviewException } =
    useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('待处理');

  const [scanContext, setScanContext] = useState<{
    source?: ExceptionRecord['source'];
    expectedPatient?: { bedNo: string; name: string };
    actualPatient?: { bedNo: string; name: string };
    scannedCode?: string;
    expectedDrugCode?: string;
    actualDrugCode?: string;
  } | null>(null);

  useEffect(() => {
    if (paramOrderId) {
      setSelectedOrderId(paramOrderId);
      setShowNewModal(true);
      if (paramSource || paramExpectedBedNo || paramActualBedNo || paramScannedCode || paramExpectedDrugCode) {
        const ctx: NonNullable<typeof scanContext> = {};
        if (paramSource) ctx.source = paramSource;
        if (paramExpectedBedNo && paramExpectedName) {
          ctx.expectedPatient = { bedNo: paramExpectedBedNo, name: paramExpectedName };
        }
        if (paramActualBedNo && paramActualName) {
          ctx.actualPatient = { bedNo: paramActualBedNo, name: paramActualName };
        }
        if (paramScannedCode) ctx.scannedCode = paramScannedCode;
        if (paramExpectedDrugCode) ctx.expectedDrugCode = paramExpectedDrugCode;
        if (paramActualDrugCode) ctx.actualDrugCode = paramActualDrugCode;
        setScanContext(ctx);
      }
    }
  }, [paramOrderId]);

  const clearUrlParams = () => {
    ['orderId','patientId','source','expectedBedNo','expectedName','actualBedNo','actualName','scannedCode','expectedDrugCode','actualDrugCode'].forEach(k => searchParams.delete(k));
    setSearchParams(searchParams, { replace: true });
  };
  const [showDetailModal, setShowDetailModal] = useState<ExceptionRecord | null>(null);
  const [showHandleModal, setShowHandleModal] = useState<ExceptionRecord | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const [exceptionType, setExceptionType] = useState<ExceptionRecord['type']>('拒绝执行');
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [description, setDescription] = useState('');
  const [supplementTime, setSupplementTime] = useState('');
  const [showSignature, setShowSignature] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');

  const [reviewOpinion, setReviewOpinion] = useState('');
  const [showReviewSignature, setShowReviewSignature] = useState(false);
  const [reviewAction, setReviewAction] = useState<'pass' | 'reject' | null>(null);

  const patientMap = useMemo(() => {
    const map = new Map<string, typeof patients[number]>();
    patients.forEach((p) => map.set(p.id, p));
    return map;
  }, [patients]);

  const orderMap = useMemo(() => {
    const map = new Map<string, typeof orders[number]>();
    orders.forEach((o) => map.set(o.id, o));
    return map;
  }, [orders]);

  const stats = useMemo(() => {
    const pending = exceptionRecords.filter((r) => r.status === '待审核').length;
    const passed = exceptionRecords.filter((r) => r.status === '已通过').length;
    const rejected = exceptionRecords.filter((r) => r.status === '已驳回').length;
    return { pending, passed, rejected };
  }, [exceptionRecords]);

  const filteredRecords = useMemo(() => {
    const tabFilterMap: Record<TabType, ExceptionRecord['status'][]> = {
      待处理: ['待审核'],
      处理中: ['待审核'],
      已完成: ['已通过', '已驳回'],
    };
    const statuses = tabFilterMap[activeTab];
    let records = exceptionRecords.filter((r) => statuses.includes(r.status));

    if (activeTab === '处理中') {
      records = records.filter(
        (r) => r.status === '待审核' && currentUser && ['医生', '药师'].includes(currentUser.role),
      );
    }

    return records.sort(
      (a, b) => new Date(b.reportTime).getTime() - new Date(a.reportTime).getTime(),
    );
  }, [exceptionRecords, activeTab, currentUser]);

  const isReviewer = currentUser && ['医生', '药师'].includes(currentUser.role);

  const resetForm = () => {
    setExceptionType('拒绝执行');
    setSelectedReason('');
    setCustomReason('');
    setDescription('');
    setSupplementTime('');
    setSelectedOrderId('');
    setShowSignature(false);
    setScanContext(null);
  };

  const closeAllModals = () => {
    setShowNewModal(false);
    setShowHandleModal(null);
    setShowDetailModal(null);
    clearUrlParams();
    resetForm();
  };

  const handleConfirmSignature = (_signatureData: string) => {
    if (!currentUser) return;

    const orderId = showHandleModal ? showHandleModal.orderId : selectedOrderId;
    const patientId = showHandleModal
      ? showHandleModal.patientId
      : orderMap.get(selectedOrderId)?.patientId || paramPatientId || '';

    const finalReason = selectedReason === '其他' ? customReason : selectedReason;

    reportException({
      orderId,
      patientId,
      type: exceptionType,
      reason: finalReason,
      customReason: selectedReason === '其他' ? customReason : undefined,
      description,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      source: scanContext?.source || '手动登记',
      expectedPatient: scanContext?.expectedPatient,
      actualPatient: scanContext?.actualPatient,
      scannedCode: scanContext?.scannedCode,
      expectedDrugCode: scanContext?.expectedDrugCode,
      actualDrugCode: scanContext?.actualDrugCode,
    });

    setShowSignature(false);
    closeAllModals();
    setActiveTab('待处理');
  };

  const handleReviewSignature = (_signatureData: string) => {
    if (!showHandleModal || !currentUser || !reviewAction) return;

    reviewException(
      showHandleModal.id,
      reviewAction === 'pass',
      reviewOpinion,
      currentUser.id,
      currentUser.name,
    );

    setShowReviewSignature(false);
    setReviewAction(null);
    setReviewOpinion('');
    closeAllModals();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">异常处理</h1>
        {currentUser?.role === '护士' && (
          <button
            onClick={() => {
              resetForm();
              setShowNewModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            新增异常
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">待审核</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">已通过</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.passed}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">已驳回</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex border-b border-slate-200 px-4">
          {(['待处理', '处理中', '已完成'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'relative px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        <div>
          {filteredRecords.length === 0 ? (
            <Empty description={`暂无${activeTab}的异常记录`} />
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredRecords.map((record) => {
                const patient = patientMap.get(record.patientId);
                const order = orderMap.get(record.orderId);

                return (
                  <div key={record.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                              exceptionTypeColors[record.type],
                            )}
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {record.type}
                          </span>
                          {record.source && record.source !== '手动登记' && (
                            <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                              {record.source}
                            </span>
                          )}
                          <span className="text-sm text-slate-500">
                            {formatDate(record.reportTime)} {formatTime(record.reportTime)}
                          </span>
                          {patient && (
                            <span className="text-sm font-medium text-slate-900">
                              {patient.bedNo} {patient.name}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {order?.content || '医嘱'}
                        </p>

                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-slate-600">
                            <span className="text-slate-400">异常原因：</span>
                            {record.reason}
                            {record.customReason && `（${record.customReason}）`}
                          </p>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            <span className="text-slate-400">详细说明：</span>
                            {record.description}
                          </p>
                          <p className="text-sm text-slate-600">
                            <span className="text-slate-400">上报人：</span>
                            {record.reporterName}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                              record.status === '待审核'
                                ? 'bg-amber-100 text-amber-700'
                                : record.status === '已通过'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700',
                            )}
                          >
                            {record.status}
                          </span>
                          {record.reviewerName && (
                            <span className="text-xs text-slate-500">
                              审核人：{record.reviewerName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowDetailModal(record)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          查看详情
                        </button>
                        {record.status === '待审核' && (
                          <>
                            {currentUser?.role === '护士' && (
                              <button
                                onClick={() => {
                                  setShowHandleModal(record);
                                  setExceptionType(record.type);
                                  setSelectedReason(record.reason);
                                  setDescription(record.description);
                                }}
                                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                              >
                                <PenLine className="h-4 w-4" />
                                处理
                              </button>
                            )}
                            {isReviewer && (
                              <button
                                onClick={() => {
                                  setShowHandleModal(record);
                                  setReviewOpinion('');
                                }}
                                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                              >
                                <FileText className="h-4 w-4" />
                                审核
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="text-lg font-semibold text-slate-900">异常详情</h2>
              <button
                onClick={() => setShowDetailModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                      exceptionTypeColors[showDetailModal.type],
                    )}
                  >
                    <AlertTriangle className="mr-1.5 h-4 w-4" />
                    {showDetailModal.type}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
                      showDetailModal.status === '待审核'
                        ? 'bg-amber-100 text-amber-700'
                        : showDetailModal.status === '已通过'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700',
                    )}
                  >
                    {showDetailModal.status}
                  </span>
                  {showDetailModal.source && showDetailModal.source !== '手动登记' && (
                    <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
                      来源：{showDetailModal.source}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium text-slate-500">医嘱信息</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    {(() => {
                      const order = orderMap.get(showDetailModal.orderId);
                      if (!order) return <p className="text-sm text-slate-500">暂无医嘱信息</p>;
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">医嘱号</span>
                            <span className="font-medium text-slate-900">{order.orderNo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">类型</span>
                            <StatusBadge status={order.type} variant="type" />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">内容</span>
                            <span className="font-medium text-slate-900">{order.content}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">计划执行时间</span>
                            <span className="text-slate-900">
                              {formatDate(order.plannedTime)} {formatTime(order.plannedTime)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">开立医生</span>
                            <span className="text-slate-900">{order.doctorName}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium text-slate-500">患者信息</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    {(() => {
                      const patient = patientMap.get(showDetailModal.patientId);
                      if (!patient) return <p className="text-sm text-slate-500">暂无患者信息</p>;
                      return (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">床号</span>
                            <span className="font-medium text-slate-900">{patient.bedNo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">姓名</span>
                            <span className="text-slate-900">{patient.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">性别</span>
                            <span className="text-slate-900">{patient.gender}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">年龄</span>
                            <span className="text-slate-900">{patient.age}岁</span>
                          </div>
                          <div className="col-span-2 flex justify-between">
                            <span className="text-slate-500">诊断</span>
                            <span className="text-slate-900">{patient.diagnosis}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium text-slate-500">异常信息</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">上报时间</span>
                      <span className="text-slate-900">
                        {formatDate(showDetailModal.reportTime)} {formatTime(showDetailModal.reportTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">上报人</span>
                      <span className="text-slate-900">{showDetailModal.reporterName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">异常原因</span>
                      <span className="text-slate-900">
                        {showDetailModal.reason}
                        {showDetailModal.customReason && `（${showDetailModal.customReason}）`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">详细说明</span>
                      <p className="mt-1 text-slate-700">{showDetailModal.description}</p>
                    </div>
                  </div>
                </div>

                {(showDetailModal.source || showDetailModal.expectedPatient || showDetailModal.actualPatient || showDetailModal.scannedCode || showDetailModal.expectedDrugCode || showDetailModal.actualDrugCode) && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-slate-500">扫码追溯信息</h3>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 space-y-2 text-sm">
                      {showDetailModal.source && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">异常来源</span>
                          <span className="inline-flex items-center rounded-full bg-violet-200 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                            {showDetailModal.source}
                          </span>
                        </div>
                      )}
                      {showDetailModal.expectedPatient && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">应核对患者</span>
                          <span className="font-medium text-slate-900">{showDetailModal.expectedPatient.bedNo} {showDetailModal.expectedPatient.name}</span>
                        </div>
                      )}
                      {showDetailModal.actualPatient && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">实际扫描患者</span>
                          <span className="font-medium text-red-700">{showDetailModal.actualPatient.bedNo} {showDetailModal.actualPatient.name}</span>
                        </div>
                      )}
                      {showDetailModal.scannedCode && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">扫描条码</span>
                          <span className="font-mono text-slate-900">{showDetailModal.scannedCode}</span>
                        </div>
                      )}
                      {showDetailModal.expectedDrugCode && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">应核对药品条码</span>
                          <span className="font-mono text-slate-900">{showDetailModal.expectedDrugCode}</span>
                        </div>
                      )}
                      {showDetailModal.actualDrugCode && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">实际扫描药品条码</span>
                          <span className="font-mono text-red-700">{showDetailModal.actualDrugCode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {showDetailModal.status !== '待审核' && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-slate-500">审核信息</h3>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">审核时间</span>
                        <span className="text-slate-900">
                          {showDetailModal.reviewTime &&
                            `${formatDate(showDetailModal.reviewTime)} ${formatTime(showDetailModal.reviewTime)}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">审核人</span>
                        <span className="text-slate-900">{showDetailModal.reviewerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">审核意见</span>
                        <p className="mt-1 text-slate-700">{showDetailModal.reviewOpinion}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {(showNewModal || showHandleModal) && !showSignature && !showReviewSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {showNewModal ? '新增异常记录' : isReviewer ? '审核异常' : '处理异常'}
              </h2>
              <button
                onClick={closeAllModals}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {isReviewer && showHandleModal ? (
                  <>
                    <div className="rounded-lg bg-slate-50 p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">异常类型</span>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            exceptionTypeColors[showHandleModal.type],
                          )}
                        >
                          {showHandleModal.type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">异常原因</span>
                        <span className="text-slate-900">{showHandleModal.reason}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">详细说明</span>
                        <p className="mt-1 text-slate-700">{showHandleModal.description}</p>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        审核意见
                      </label>
                      <textarea
                        value={reviewOpinion}
                        onChange={(e) => setReviewOpinion(e.target.value)}
                        placeholder="请输入审核意见..."
                        rows={4}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {showNewModal && scanContext && (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
                          <AlertTriangle className="h-4 w-4" />
                          异常来源：{scanContext.source || '扫码流程'}
                        </div>
                        <div className="space-y-1 text-xs text-amber-700">
                          {scanContext.expectedPatient && (
                            <div>应核对患者：{scanContext.expectedPatient.bedNo} {scanContext.expectedPatient.name}</div>
                          )}
                          {scanContext.actualPatient && (
                            <div>实际扫描患者：{scanContext.actualPatient.bedNo} {scanContext.actualPatient.name}</div>
                          )}
                          {scanContext.scannedCode && (
                            <div>扫描条码：{scanContext.scannedCode}</div>
                          )}
                          {scanContext.expectedDrugCode && (
                            <div>应核对药品条码：{scanContext.expectedDrugCode}</div>
                          )}
                          {scanContext.actualDrugCode && (
                            <div>实际扫描药品条码：{scanContext.actualDrugCode}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {showNewModal && (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          选择医嘱
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <select
                            value={selectedOrderId}
                            onChange={(e) => setSelectedOrderId(e.target.value)}
                            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">请选择关联医嘱</option>
                            {orders.map((order) => {
                              const patient = patientMap.get(order.patientId);
                              return (
                                <option key={order.id} value={order.id}>
                                  {patient?.bedNo} {patient?.name} - {order.content}
                                </option>
                              );
                            })}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        异常类型
                      </label>
                      <div className="relative">
                        <AlertTriangle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <select
                          value={exceptionType}
                          onChange={(e) => setExceptionType(e.target.value as ExceptionRecord['type'])}
                          className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="拒绝执行">拒绝执行</option>
                          <option value="补录">补录</option>
                          <option value="暂停">暂停</option>
                          <option value="冲突">冲突</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
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
                            onClick={() => setSelectedReason(reason)}
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                              selectedReason === reason
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                            )}
                          >
                            {reason}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedReason === '其他' && (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          自定义原因
                        </label>
                        <input
                          type="text"
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="请输入自定义原因"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {exceptionType === '补录' && (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          补录时间
                        </label>
                        <input
                          type="datetime-local"
                          value={supplementTime}
                          onChange={(e) => setSupplementTime(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        详细说明
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="请详细描述异常情况..."
                        rows={4}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4">
              <button
                onClick={closeAllModals}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                取消
              </button>
              {isReviewer && showHandleModal ? (
                <>
                  <button
                    onClick={() => {
                      setReviewAction('reject');
                      setShowReviewSignature(true);
                    }}
                    disabled={!reviewOpinion.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    驳回
                  </button>
                  <button
                    onClick={() => {
                      setReviewAction('pass');
                      setShowReviewSignature(true);
                    }}
                    disabled={!reviewOpinion.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    通过
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowSignature(true)}
                  disabled={
                    !selectedReason ||
                    (selectedReason === '其他' && !customReason.trim()) ||
                    !description.trim() ||
                    (showNewModal && !selectedOrderId)
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PenLine className="h-4 w-4" />
                  签名确认
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">签名确认</h2>
            <SignaturePad
              onConfirm={handleConfirmSignature}
              onCancel={() => setShowSignature(false)}
            />
          </div>
        </div>
      )}

      {showReviewSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              {reviewAction === 'pass' ? '审核通过签名' : '审核驳回签名'}
            </h2>
            <SignaturePad
              onConfirm={handleReviewSignature}
              onCancel={() => setShowReviewSignature(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
