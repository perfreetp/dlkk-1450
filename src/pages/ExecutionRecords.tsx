import { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Filter,
  User,
  ChevronDown,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Stethoscope,
  Pill,
  Syringe,
  HeartPulse,
  FileText,
  Shield,
} from 'lucide-react';
import { useAppStore } from '../store';
import StatusBadge from '../components/StatusBadge';
import Empty from '../components/Empty';
import type { ExecutionRecord, OrderStatus, OrderType } from '../types';
import { formatDate, formatTime } from '../utils/time';
import { cn } from '../lib/utils';

const statusColorMap: Record<OrderStatus, string> = {
  待执行: 'bg-blue-500',
  执行中: 'bg-cyan-500',
  已执行: 'bg-green-500',
  已退回: 'bg-slate-400',
  已暂停: 'bg-amber-500',
  异常: 'bg-red-500',
  漏执行: 'bg-orange-500',
};

const typeIconMap: Record<OrderType, React.ReactNode> = {
  药品: <Pill className="h-3.5 w-3.5" />,
  治疗: <Syringe className="h-3.5 w-3.5" />,
  检查: <Stethoscope className="h-3.5 w-3.5" />,
  护理: <HeartPulse className="h-3.5 w-3.5" />,
  手术: <Activity className="h-3.5 w-3.5" />,
};

type TimeRange = 'today' | '3days' | '7days' | 'custom';
type StatusFilter = '全部' | OrderStatus;
type TypeFilter = '全部' | OrderType;

export default function ExecutionRecords() {
  const { executionRecords, patients, orders } = useAppStore();

  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('全部');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('全部');
  const [executorFilter, setExecutorFilter] = useState('');
  const [bedNoSearch, setBedNoSearch] = useState('');
  const [expandedRecord, setExpandedRecord] = useState<ExecutionRecord | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState<string | null>(null);

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

  const executors = useMemo(() => {
    const set = new Set<string>();
    executionRecords.forEach((r) => set.add(r.executorName));
    return Array.from(set);
  }, [executionRecords]);

  const filteredRecords = useMemo(() => {
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case 'today':
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '3days':
        startTime = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        startTime.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startTime = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        startTime.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        startTime = customStart ? new Date(customStart) : new Date(0);
        break;
    }

    const endTime =
      timeRange === 'custom' && customEnd
        ? new Date(customEnd + ' 23:59:59')
        : new Date();

    return executionRecords
      .filter((r) => {
        const execTime = new Date(r.executeTime);
        if (timeRange === 'custom' && (!customStart || !customEnd)) return true;
        return execTime >= startTime && execTime <= endTime;
      })
      .filter((r) => (statusFilter === '全部' ? true : r.status === statusFilter))
      .filter((r) => {
        if (typeFilter === '全部') return true;
        const order = orderMap.get(r.orderId);
        return order?.type === typeFilter;
      })
      .filter((r) => (executorFilter ? r.executorName === executorFilter : true))
      .filter((r) => {
        if (!bedNoSearch) return true;
        const patient = patientMap.get(r.patientId);
        return patient?.bedNo.includes(bedNoSearch);
      })
      .sort((a, b) => new Date(b.executeTime).getTime() - new Date(a.executeTime).getTime());
  }, [executionRecords, timeRange, customStart, customEnd, statusFilter, typeFilter, executorFilter, bedNoSearch, patientMap, orderMap]);

  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const executed = filteredRecords.filter((r) => r.status === '已执行').length;
    const exceptions = filteredRecords.filter((r) => r.status === '异常' || r.status === '漏执行').length;

    let totalDuration = 0;
    let durationCount = 0;
    filteredRecords.forEach((r) => {
      if (r.operationLog.length >= 2) {
        const start = new Date(r.operationLog[0].time).getTime();
        const end = new Date(r.operationLog[r.operationLog.length - 1].time).getTime();
        totalDuration += (end - start) / 60000;
        durationCount++;
      }
    });
    const avgDuration = durationCount > 0 ? (totalDuration / durationCount).toFixed(1) : '0';
    const onTimeRate = total > 0 ? ((executed / total) * 100).toFixed(1) : '0';

    return { total, onTimeRate, exceptions, avgDuration };
  }, [filteredRecords]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">执行记录</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(['today', '3days', '7days'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    timeRange === range ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  {range === 'today' ? '今日' : range === '3days' ? '近3日' : '近7日'}
                </button>
              ))}
              <button
                onClick={() => setTimeRange('custom')}
                className={cn(
                  'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  timeRange === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                自定义
              </button>
            </div>

            {timeRange === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-slate-500">至</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-8 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="全部">全部状态</option>
                <option value="已执行">已执行</option>
                <option value="已退回">已退回</option>
                <option value="异常">异常</option>
                <option value="漏执行">漏执行</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-8 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="全部">全部类型</option>
                <option value="药品">药品</option>
                <option value="治疗">治疗</option>
                <option value="检查">检查</option>
                <option value="护理">护理</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={executorFilter}
                onChange={(e) => setExecutorFilter(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-8 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">全部执行人</option>
                {executors.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索床号..."
                value={bedNoSearch}
                onChange={(e) => setBedNoSearch(e.target.value)}
                className="w-36 rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">总执行数</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">按时执行率</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.onTimeRate}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">异常数</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.exceptions}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">平均执行时长</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.avgDuration} 分钟</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        {filteredRecords.length === 0 ? (
          <Empty description="暂无执行记录" />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRecords.map((record) => {
              const patient = patientMap.get(record.patientId);
              const order = orderMap.get(record.orderId);

              return (
                <div
                  key={record.id}
                  className="relative flex gap-4 p-4 hover:bg-slate-50"
                >
                  <div className={cn('absolute left-0 top-0 h-full w-1 rounded-r', statusColorMap[record.status])} />

                  <div className="flex-1 pl-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {formatDate(record.executeTime)} {formatTime(record.executeTime)}
                          </span>
                          {patient && (
                            <span className="text-sm text-slate-600">
                              {patient.bedNo} {patient.name}
                            </span>
                          )}
                          {order && (
                            <>
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                {typeIconMap[order.type]}
                                {order.type}
                              </span>
                              <StatusBadge status={record.status} variant="status" />
                            </>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {order?.content || '医嘱详情'}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-medium text-white">
                              {record.executorName.charAt(0)}
                            </div>
                            <span className="text-sm text-slate-600">{record.executorName}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              患者核对：
                              <span className={record.verifyPatient ? 'text-green-600' : 'text-red-600'}>
                                {record.verifyPatient ? '通过' : '未通过'}
                              </span>
                            </span>
                          </div>

                          {order?.type === '药品' && (
                            <div className="flex items-center gap-2">
                              <Pill className="h-4 w-4 text-slate-400" />
                              <span className="text-sm text-slate-600">
                                药品核对：
                                <span className={record.verifyDrug ? 'text-green-600' : 'text-red-600'}>
                                  {record.verifyDrug ? '通过' : '未通过'}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedRecord(record)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {expandedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="text-lg font-semibold text-slate-900">执行记录详情</h2>
              <button
                onClick={() => setExpandedRecord(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-medium text-slate-500">医嘱信息</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    {(() => {
                      const order = orderMap.get(expandedRecord.orderId);
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
                          {order.specification && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">规格</span>
                              <span className="text-slate-900">{order.specification}</span>
                            </div>
                          )}
                          {order.dosage && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">剂量</span>
                              <span className="text-slate-900">{order.dosage}</span>
                            </div>
                          )}
                          {order.usage && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">用法</span>
                              <span className="text-slate-900">{order.usage}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-500">状态</span>
                            <StatusBadge status={order.status} variant="status" />
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
                      const patient = patientMap.get(expandedRecord.patientId);
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
                          <div className="flex justify-between">
                            <span className="text-slate-500">住院号</span>
                            <span className="text-slate-900">{patient.hospitalNo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">诊断</span>
                            <span className="text-slate-900">{patient.diagnosis}</span>
                          </div>
                          {patient.allergies.length > 0 && (
                            <div className="col-span-2 flex justify-between">
                              <span className="text-slate-500">过敏史</span>
                              <span className="text-red-600">{patient.allergies.join('、')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium text-slate-500">操作时间线</h3>
                  <div className="relative space-y-4 pl-6">
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />
                    {expandedRecord.operationLog.map((log, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-[18px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white bg-blue-500" />
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900">{log.action}</span>
                            <span className="text-xs text-slate-500">
                              {formatDate(log.time)} {formatTime(log.time)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">操作人：{log.operator}</p>
                          {log.detail && <p className="mt-1 text-sm text-slate-600">{log.detail}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium text-slate-500">执行人签名</h3>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <button
                      onClick={() => setShowSignatureModal(expandedRecord.signature)}
                      className="block w-full"
                    >
                      <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white py-6 hover:border-blue-400">
                        <div className="text-center">
                          <div className="text-lg font-medium text-slate-700">{expandedRecord.executorName}</div>
                          <p className="mt-1 text-xs text-slate-400">点击查看签名大图</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {expandedRecord.remark && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-slate-500">执行备注</h3>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-700">{expandedRecord.remark}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative rounded-xl bg-white p-6">
            <button
              onClick={() => setShowSignatureModal(null)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex min-h-[300px] min-w-[400px] items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-medium text-slate-800">{showSignatureModal}</div>
                <p className="mt-2 text-sm text-slate-500">电子签名</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
