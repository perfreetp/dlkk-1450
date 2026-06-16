import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  QrCode,
  Check,
  X,
  User,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Pill,
  Home,
  ChevronsRight,
  Info,
  ClipboardList,
  Search,
  Clock,
  Stethoscope,
} from 'lucide-react';
import { useAppStore } from '@/store';
import SignaturePad from '@/components/SignaturePad';
import StatusBadge from '@/components/StatusBadge';
import { formatTime, isOverdue, isUpcoming } from '@/utils/time';
import { cn } from '@/lib/utils';
import type { Patient, Order } from '@/types';

type Step = 1 | 2 | 3 | 4 | 5;

const getSteps = (orderType: string | null) => {
  const isDrugOrder = orderType === '药品';
  return [
    { key: 1 as Step, title: '腕带扫码' },
    { key: 2 as Step, title: '患者确认' },
    ...(isDrugOrder ? [{ key: 3 as Step, title: '药品扫码' }] : []),
    { key: 4 as Step, title: isDrugOrder ? '双重校验' : '信息校验' },
    { key: 5 as Step, title: '签名执行' },
  ];
};

interface StepIndicatorProps {
  currentStep: Step;
  orderType: string | null;
}

function StepIndicator({ currentStep, orderType }: StepIndicatorProps) {
  const STEPS = getSteps(orderType);
  const displayStepNumbers = STEPS.map((s, i) => ({ ...s, displayKey: i + 1 }));

  return (
    <div className="flex items-center justify-center px-4">
      {displayStepNumbers.map((step, index) => {
        const isCompleted = step.key < currentStep;
        const isCurrent = step.key === currentStep;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-primary-500 text-white ring-4 ring-primary-100',
                  !isCompleted && !isCurrent && 'bg-slate-200 text-slate-500',
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : step.displayKey}
              </div>
              <span
                className={cn(
                  'mt-1.5 text-xs font-medium whitespace-nowrap',
                  isCurrent ? 'text-primary-600' : isCompleted ? 'text-slate-600' : 'text-slate-400',
                )}
              >
                {step.title}
              </span>
            </div>
            {index < displayStepNumbers.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-1 w-12 rounded md:w-20',
                  isCompleted ? 'bg-green-500' : 'bg-slate-200',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface PatientInfoCardProps {
  patient: Patient;
}

function PatientInfoCard({ patient }: PatientInfoCardProps) {
  return (
    <div className="rounded-xl border-2 border-primary-200 bg-primary-50/50 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
          <User className="h-7 w-7 text-primary-600" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-800">
            {patient.bedNo} {patient.name}
          </div>
          <div className="text-sm text-slate-500">
            {patient.gender} · {patient.age}岁
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-lg bg-green-100 px-3 py-1.5">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm font-semibold text-green-700">腕带核对成功</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg bg-white p-3">
          <div className="text-xs text-slate-500">住院号</div>
          <div className="mt-0.5 text-sm font-semibold text-slate-800">{patient.hospitalNo}</div>
        </div>
        <div className="rounded-lg bg-white p-3">
          <div className="text-xs text-slate-500">病区</div>
          <div className="mt-0.5 text-sm font-semibold text-slate-800">{patient.ward}</div>
        </div>
        <div className="col-span-2 rounded-lg bg-white p-3">
          <div className="text-xs text-slate-500">诊断</div>
          <div className="mt-0.5 text-sm font-semibold text-slate-800">{patient.diagnosis}</div>
        </div>
      </div>

      {patient.allergies.length > 0 && (
        <div className="mt-4 rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-base font-bold">过敏史</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {patient.allergies.map((allergy, idx) => (
              <span
                key={idx}
                className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700"
              >
                {allergy}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const orders = useAppStore((state) => state.orders);
  const patients = useAppStore((state) => state.patients);
  const currentUser = useAppStore((state) => state.currentUser);
  const verifyWristband = useAppStore((state) => state.verifyWristband);
  const verifyDrugBarcode = useAppStore((state) => state.verifyDrugBarcode);
  const executeOrder = useAppStore((state) => state.executeOrder);
  const getPendingOrders = useAppStore((state) => state.getPendingOrders);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [wristbandInput, setWristbandInput] = useState('');
  const [drugInput, setDrugInput] = useState('');
  const [verifiedPatient, setVerifiedPatient] = useState<Patient | null>(null);
  const [patientConfirmed, setPatientConfirmed] = useState(false);
  const [wristbandVerified, setWristbandVerified] = useState(false);
  const [drugVerified, setDrugVerified] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [executionSuccess, setExecutionSuccess] = useState(false);
  const [wristbandError, setWristbandError] = useState('');
  const [scanError, setScanError] = useState('');
  const [orderSearchText, setOrderSearchText] = useState('');

  const pendingOrders = useMemo(() => {
    let result = getPendingOrders();
    if (orderSearchText.trim()) {
      const kw = orderSearchText.trim().toLowerCase();
      result = result.filter((o) => {
        const p = patients.find((pt) => pt.id === o.patientId);
        return (
          o.content.toLowerCase().includes(kw) ||
          p?.name.toLowerCase().includes(kw) ||
          p?.bedNo.toLowerCase().includes(kw) ||
          o.orderNo.toLowerCase().includes(kw)
        );
      });
    }
    return result;
  }, [getPendingOrders, patients, orderSearchText]);

  useEffect(() => {
    if (orderId) {
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        setCurrentOrder(order);
      }
    }
  }, [orderId, orders]);

  const patient = currentOrder
    ? patients.find((p) => p.id === currentOrder.patientId)
    : undefined;

  const resetFlow = () => {
    setCurrentStep(1);
    setWristbandInput('');
    setDrugInput('');
    setVerifiedPatient(null);
    setPatientConfirmed(false);
    setWristbandVerified(false);
    setDrugVerified(false);
    setWristbandError('');
    setScanError('');
  };

  const handleSelectOrder = (order: Order) => {
    navigate(`/scan?orderId=${order.id}`, { replace: true });
    setCurrentOrder(order);
    resetFlow();
  };

  const handleScanWristband = () => {
    if (!wristbandInput.trim()) return;
    setWristbandError('');
    const result = verifyWristband(wristbandInput.trim());

    if (!result) {
      setWristbandVerified(false);
      setWristbandError('腕带条码无效，请检查腕带');
      return;
    }

    if (currentOrder && result.id !== currentOrder.patientId) {
      const orderPatient = patients.find((p) => p.id === currentOrder.patientId);
      setWristbandVerified(false);
      setWristbandError(
        `患者不匹配！当前医嘱属于【${orderPatient?.bedNo || ''} ${orderPatient?.name || ''}】，您扫描的是【${result.bedNo} ${result.name}】，请核对后重新扫描`
      );
      return;
    }

    setVerifiedPatient(result);
    setWristbandVerified(true);
    setTimeout(() => setCurrentStep(2), 500);
  };

  const handleMockScanWristband = () => {
    setWristbandError('');
    if (patient) {
      setWristbandInput(patient.wristbandCode);
      setVerifiedPatient(patient);
      setWristbandVerified(true);
      setTimeout(() => setCurrentStep(2), 500);
    }
  };

  const handleStep2Continue = () => {
    if (patientConfirmed) {
      if (currentOrder?.type === '药品') {
        setCurrentStep(3);
      } else {
        setDrugVerified(true);
        setCurrentStep(4);
      }
    }
  };

  const handleScanDrug = () => {
    if (!drugInput.trim() || !currentOrder) return;
    const result = verifyDrugBarcode(currentOrder.id, drugInput.trim());
    setDrugVerified(result);
    setTimeout(() => setCurrentStep(4), 500);
  };

  const handleMockScanDrug = () => {
    if (currentOrder?.barcode) {
      setDrugInput(currentOrder.barcode);
      setDrugVerified(true);
      setTimeout(() => setCurrentStep(4), 500);
    }
  };

  const handleStep4Continue = () => {
    if (wristbandVerified && drugVerified) {
      setCurrentStep(5);
    }
  };

  const handleSignatureConfirm = (signatureData: string) => {
    if (!currentOrder || !currentUser) return;
    executeOrder(currentOrder.id, currentUser.id, signatureData, wristbandVerified, drugVerified);
    setExecutionSuccess(true);
  };

  const handleReturnList = () => {
    navigate('/orders/pending');
  };

  const handleNextOrder = () => {
    const pending = getPendingOrders();
    const next = pending.find((o) => o.id !== currentOrder?.id);
    if (next) {
      navigate(`/scan?orderId=${next.id}`);
      resetFlow();
      setExecutionSuccess(false);
      setCurrentOrder(next);
    } else {
      navigate('/orders/pending');
    }
  };

  const handleException = () => {
    if (!currentOrder) return;
    navigate(`/exceptions?orderId=${currentOrder.id}&patientId=${currentOrder.patientId}`);
  };

  const allVerified = wristbandVerified && drugVerified;

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">返回</span>
          </button>
          <div className="ml-auto mr-auto">
            <StepIndicator currentStep={currentStep} orderType={currentOrder?.type || null} />
          </div>
          <div className="w-20" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl">
          {!currentOrder && (
            <div className="animate-fade-in">
              <div className="mb-6 text-center">
                <h1 className="mb-2 text-3xl font-bold text-slate-800">选择待执行医嘱</h1>
                <p className="text-slate-500">请选择一条医嘱开始扫码核对流程</p>
              </div>

              <div className="mb-5 relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={orderSearchText}
                  onChange={(e) => setOrderSearchText(e.target.value)}
                  placeholder="搜索患者姓名、床号、医嘱内容..."
                  className="w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 pl-12 pr-4 text-base text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                />
              </div>

              {pendingOrders.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                    <ClipboardList className="h-10 w-10 text-slate-400" />
                  </div>
                  <div className="mb-2 text-xl font-bold text-slate-700">暂无待执行医嘱</div>
                  <div className="mb-6 text-sm text-slate-500">当前没有需要执行的医嘱</div>
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => navigate('/orders/pending')}
                      className="flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary-600"
                    >
                      <ClipboardList className="h-5 w-5" />
                      查看医嘱列表
                    </button>
                    <button
                      onClick={() => navigate('/records')}
                      className="flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      查看执行记录
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.map((order) => {
                    const p = patients.find((pt) => pt.id === order.patientId);
                    const overdue = isOverdue(order.plannedTime);
                    const upcoming = isUpcoming(order.plannedTime);
                    return (
                      <button
                        key={order.id}
                        onClick={() => handleSelectOrder(order)}
                        className={cn(
                          'w-full text-left rounded-xl border-2 p-5 transition-all duration-200',
                          order.isConflict && 'border-red-400 bg-red-50 hover:shadow-md',
                          !order.isConflict && overdue && 'border-red-300 bg-red-50/50 hover:shadow-md',
                          !order.isConflict && !overdue && upcoming && 'border-amber-400 bg-amber-50/50 hover:shadow-md',
                          !order.isConflict && !overdue && !upcoming && 'border-slate-200 bg-white hover:border-primary-400 hover:shadow-md',
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                            order.type === '药品' && 'bg-blue-100',
                            order.type === '治疗' && 'bg-purple-100',
                            order.type === '检查' && 'bg-cyan-100',
                            order.type === '护理' && 'bg-green-100',
                          )}>
                            {order.type === '药品' && <Pill className="h-6 w-6 text-blue-600" />}
                            {order.type === '治疗' && <Stethoscope className="h-6 w-6 text-purple-600" />}
                            {order.type === '检查' && <QrCode className="h-6 w-6 text-cyan-600" />}
                            {order.type === '护理' && <User className="h-6 w-6 text-green-600" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="text-lg font-bold text-slate-800">
                                {p?.bedNo} {p?.name}
                              </span>
                              <StatusBadge status={order.type} variant="type" />
                              <StatusBadge status={order.priority} variant="priority" />
                              <StatusBadge status={order.status} variant="status" />
                              {overdue && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                  已超时
                                </span>
                              )}
                              {!overdue && upcoming && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                  即将执行
                                </span>
                              )}
                            </div>
                            <div className="mb-2 text-base font-semibold text-slate-700">{order.content}</div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                计划时间：{formatTime(order.plannedTime)}
                              </span>
                              <span>开单医生：{order.doctorName}</span>
                              <span>医嘱号：{order.orderNo}</span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center">
                            <ArrowRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentOrder && currentStep === 1 && (
            <div className="animate-fade-in">
              <div className="mb-8 text-center">
                <h1 className="mb-2 text-3xl font-bold text-slate-800">请扫描患者腕带</h1>
                <p className="text-slate-500">使用扫码枪扫描患者腕带条码，或手动输入</p>
              </div>

              {currentOrder && patient && (
                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                    <Info className="h-4 w-4" />
                    当前医嘱对应患者
                  </div>
                  <div className="text-lg font-semibold text-slate-800">
                    {patient.bedNo} {patient.name} - {currentOrder.content}
                  </div>
                </div>
              )}

              <div
                className={cn(
                  'relative rounded-xl border-4 p-6 transition-all',
                  wristbandVerified
                    ? 'border-green-400 bg-green-50'
                    : 'border-primary-400 bg-white animate-breath',
                )}
              >
                <div className="mb-4 flex items-center gap-3">
                  <QrCode className="h-8 w-8 text-primary-500" />
                  <span className="text-lg font-semibold text-slate-700">腕带条码</span>
                  {wristbandVerified && (
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      识别成功
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={wristbandInput}
                  onChange={(e) => setWristbandInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanWristband()}
                  placeholder="请扫描或输入腕带条码..."
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-5 py-4 text-xl font-mono tracking-wide text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                  autoFocus
                />
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleScanWristband}
                    disabled={!wristbandInput.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-lg font-semibold text-white shadow-sm transition-all hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="h-5 w-5" />
                    确认扫码
                  </button>
                  <button
                    onClick={handleMockScanWristband}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3.5 text-lg font-semibold text-slate-700 transition-all hover:bg-slate-50 active:bg-slate-100"
                  >
                    <RefreshCw className="h-5 w-5" />
                    模拟扫码
                  </button>
                </div>
              </div>

              {wristbandError && (
                <div className="mt-4 rounded-xl border-2 border-red-400 bg-red-50 p-4 animate-slide-in">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-base font-bold text-red-700">患者不匹配</div>
                      <div className="text-sm text-red-600 mt-1">{wristbandError}</div>
                    </div>
                  </div>
                </div>
              )}

              {verifiedPatient && (
                <div className="mt-6 animate-slide-in">
                  <PatientInfoCard patient={verifiedPatient} />
                </div>
              )}
            </div>
          )}

          {currentOrder && currentStep === 2 && verifiedPatient && (
            <div className="animate-fade-in">
              <div className="mb-6 text-center">
                <h1 className="mb-2 text-3xl font-bold text-slate-800">请核对患者信息</h1>
                <p className="text-slate-500">请仔细核对以下患者信息是否正确</p>
              </div>

              <PatientInfoCard patient={verifiedPatient} />

              {currentOrder && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary-500" />
                    <span className="text-base font-semibold text-slate-800">当前医嘱</span>
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={currentOrder.type} variant="type" />
                    <StatusBadge status={currentOrder.priority} variant="priority" />
                    <StatusBadge status={currentOrder.status} variant="status" />
                  </div>
                  <div className="text-lg font-bold text-slate-800">{currentOrder.content}</div>
                  {(currentOrder.specification || currentOrder.dosage || currentOrder.usage) && (
                    <div className="mt-1 text-sm text-slate-500">
                      {currentOrder.specification && <span>规格：{currentOrder.specification}　</span>}
                      {currentOrder.dosage && <span>剂量：{currentOrder.dosage}　</span>}
                      {currentOrder.usage && <span>用法：{currentOrder.usage}</span>}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-slate-500">
                    计划时间：{formatTime(currentOrder.plannedTime)} · 开单医生：{currentOrder.doctorName}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-primary-300 hover:bg-primary-50/30">
                  <input
                    type="checkbox"
                    checked={patientConfirmed}
                    onChange={(e) => setPatientConfirmed(e.target.checked)}
                    className="mt-0.5 h-6 w-6 accent-primary-500"
                  />
                  <span className="text-base font-medium text-slate-700">
                    我已仔细核对以上患者信息，确认信息无误
                  </span>
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3.5 text-lg font-semibold text-slate-700 transition-all hover:bg-slate-50"
                >
                  <ArrowLeft className="h-5 w-5" />
                  上一步
                </button>
                <button
                  onClick={handleStep2Continue}
                  disabled={!patientConfirmed}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-lg font-semibold text-white shadow-sm transition-all hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  继续
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && currentOrder && (
            <div className="animate-fade-in">
              <div className="mb-8 text-center">
                <h1 className="mb-2 text-3xl font-bold text-slate-800">请扫描药品/物品条码</h1>
                <p className="text-slate-500">使用扫码枪扫描药品或物品条码</p>
              </div>

              <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Pill className="h-5 w-5 text-primary-500" />
                  <span className="text-base font-semibold text-slate-800">医嘱药品信息</span>
                </div>
                <div className="text-xl font-bold text-slate-800">{currentOrder.content}</div>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">规格</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-800">
                      {currentOrder.specification || '-'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">剂量</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-800">
                      {currentOrder.dosage || '-'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">用法</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-800">
                      {currentOrder.usage || '-'}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  'relative rounded-xl border-4 p-6 transition-all',
                  drugVerified
                    ? 'border-green-400 bg-green-50'
                    : 'border-primary-400 bg-white animate-breath',
                )}
              >
                <div className="mb-4 flex items-center gap-3">
                  <QrCode className="h-8 w-8 text-primary-500" />
                  <span className="text-lg font-semibold text-slate-700">药品/物品条码</span>
                  {drugVerified && (
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      核对通过
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={drugInput}
                  onChange={(e) => setDrugInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanDrug()}
                  placeholder="请扫描或输入药品条码..."
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-5 py-4 text-xl font-mono tracking-wide text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                  autoFocus
                />
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleScanDrug}
                    disabled={!drugInput.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-lg font-semibold text-white shadow-sm transition-all hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="h-5 w-5" />
                    确认核对
                  </button>
                  <button
                    onClick={handleMockScanDrug}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3.5 text-lg font-semibold text-slate-700 transition-all hover:bg-slate-50 active:bg-slate-100"
                  >
                    <RefreshCw className="h-5 w-5" />
                    模拟扫码
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentOrder && currentStep === 4 && (
            <div className="animate-fade-in">
              <div className="mb-8 text-center">
                <h1 className="mb-2 text-3xl font-bold text-slate-800">
                  {currentOrder?.type === '药品' ? '双重校验结果' : '信息校验结果'}
                </h1>
                <p className="text-slate-500">
                  {currentOrder?.type === '药品' ? '请确认腕带与药品核对结果' : '请确认患者信息核对结果'}
                </p>
              </div>

              <div className={cn(
                'mb-6 grid gap-4',
                currentOrder?.type === '药品' ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-lg mx-auto'
              )}>
                <div
                  className={cn(
                    'rounded-xl border-2 p-6 text-center transition-all',
                    wristbandVerified
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50',
                  )}
                >
                  <div
                    className={cn(
                      'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full',
                      wristbandVerified ? 'bg-green-100' : 'bg-red-100',
                    )}
                  >
                    {wristbandVerified ? (
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    ) : (
                      <XCircle className="h-12 w-12 text-red-600" />
                    )}
                  </div>
                  <div className="mb-1 text-xl font-bold text-slate-800">腕带核对</div>
                  <div
                    className={cn(
                      'text-base font-semibold',
                      wristbandVerified ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {wristbandVerified ? '核对通过' : '核对不通过'}
                  </div>
                  {verifiedPatient && (
                    <div className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-slate-600">
                      {verifiedPatient.bedNo} {verifiedPatient.name}
                    </div>
                  )}
                </div>

                {currentOrder?.type === '药品' && (
                  <div
                    className={cn(
                      'rounded-xl border-2 p-6 text-center transition-all',
                      drugVerified
                        ? 'border-green-300 bg-green-50'
                        : 'border-red-300 bg-red-50',
                    )}
                  >
                    <div
                      className={cn(
                        'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full',
                        drugVerified ? 'bg-green-100' : 'bg-red-100',
                      )}
                    >
                      {drugVerified ? (
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                      ) : (
                        <XCircle className="h-12 w-12 text-red-600" />
                      )}
                    </div>
                    <div className="mb-1 text-xl font-bold text-slate-800">药品核对</div>
                    <div
                      className={cn(
                        'text-base font-semibold',
                        drugVerified ? 'text-green-600' : 'text-red-600',
                      )}
                    >
                      {drugVerified ? '核对通过' : '核对不通过'}
                    </div>
                    {currentOrder && (
                      <div className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-slate-600">
                        {currentOrder.content}
                      </div>
                    )}
                  </div>
                )}

                {currentOrder?.type !== '药品' && (
                  <div
                    className={cn(
                      'rounded-xl border-2 p-4 text-center transition-all',
                      'border-primary-200 bg-primary-50',
                    )}
                  >
                    <div className="flex items-center justify-center gap-2 text-primary-700">
                      <Info className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        该医嘱为【{currentOrder?.type}】类医嘱，无需药品扫码核对
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {allVerified ? (
                <div className="mb-6 rounded-xl border-2 border-green-300 bg-green-50 p-6 text-center">
                  <div className="mb-3 flex items-center justify-center gap-2">
                    <ShieldCheck className="h-10 w-10 text-green-600" />
                    <span className="text-2xl font-bold text-green-700">
                      {currentOrder?.type === '药品' ? '双重核对通过' : '信息核对通过'}
                    </span>
                  </div>
                  <p className="text-green-600">
                    {currentOrder?.type === '药品'
                      ? '腕带与药品核对均已通过，可以执行医嘱'
                      : '患者身份信息已核对通过，可以执行医嘱'}
                  </p>
                </div>
              ) : (
                <div className="mb-6 rounded-xl border-2 border-red-300 bg-red-50 p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                    <span className="text-xl font-bold text-red-700">核对不通过</span>
                  </div>
                  <p className="mb-4 text-red-600">
                    核对未通过，禁止执行医嘱。请确认扫码是否正确，或进行异常处理。
                  </p>
                  <button
                    onClick={handleException}
                    className="flex items-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-red-600"
                  >
                    <AlertTriangle className="h-5 w-5" />
                    异常处理
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(currentOrder?.type === '药品' ? 3 : 2)}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3.5 text-lg font-semibold text-slate-700 transition-all hover:bg-slate-50"
                >
                  <ArrowLeft className="h-5 w-5" />
                  重新核对
                </button>
                <button
                  onClick={handleStep4Continue}
                  disabled={!allVerified}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-lg font-semibold text-white shadow-sm transition-all hover:bg-primary-600 active:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  继续签名
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 5 && currentOrder && patient && !executionSuccess && (
            <div className="animate-fade-in">
              <div className="mb-6 text-center">
                <h1 className="mb-2 text-3xl font-bold text-slate-800">签名确认执行</h1>
                <p className="text-slate-500">请确认医嘱信息并签名</p>
              </div>

              <div className="mb-6 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary-500" />
                    <span className="text-base font-semibold text-slate-800">患者信息</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {patient.bedNo} {patient.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {patient.gender} · {patient.age}岁 · {patient.hospitalNo}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary-500" />
                    <span className="text-base font-semibold text-slate-800">医嘱信息</span>
                  </div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={currentOrder.type} variant="type" />
                    <StatusBadge status={currentOrder.priority} variant="priority" />
                  </div>
                  <div className="text-lg font-bold text-slate-800">{currentOrder.content}</div>
                  {(currentOrder.specification || currentOrder.dosage || currentOrder.usage) && (
                    <div className="mt-1 text-sm text-slate-500">
                      {currentOrder.specification && <span>规格：{currentOrder.specification}　</span>}
                      {currentOrder.dosage && <span>剂量：{currentOrder.dosage}　</span>}
                      {currentOrder.usage && <span>用法：{currentOrder.usage}</span>}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-slate-500">
                    计划时间：{formatTime(currentOrder.plannedTime)} · 开单医生：{currentOrder.doctorName}
                  </div>
                </div>

                <div className="rounded-xl border border-green-300 bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm font-semibold">
                      腕带核对：{wristbandVerified ? '已通过' : '未通过'} · 药品核对：{drugVerified ? '已通过' : '未通过'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-3 text-base font-semibold text-slate-800">护士签名</div>
                <SignaturePad onConfirm={handleSignatureConfirm} width={600} height={200} />
              </div>

              {currentUser && (
                <div className="text-center text-sm text-slate-500">
                  执行人：<span className="font-semibold text-slate-700">{currentUser.name}</span>（工号：{currentUser.jobNo}）
                </div>
              )}
            </div>
          )}

          {executionSuccess && (
            <div className="animate-fade-in">
              <div className="mx-auto max-w-md rounded-2xl border-2 border-green-300 bg-white p-10 text-center shadow-lg">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
                <h1 className="mb-2 text-3xl font-bold text-slate-800">执行成功</h1>
                <p className="mb-8 text-slate-500">医嘱已成功执行并记录</p>

                <div className="space-y-3">
                  <button
                    onClick={handleNextOrder}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-4 text-lg font-semibold text-white shadow-sm transition-all hover:bg-primary-600 active:bg-primary-700"
                  >
                    <ChevronsRight className="h-5 w-5" />
                    继续下一单
                  </button>
                  <button
                    onClick={handleReturnList}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-4 text-lg font-semibold text-slate-700 transition-all hover:bg-slate-50"
                  >
                    <Home className="h-5 w-5" />
                    返回列表
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
