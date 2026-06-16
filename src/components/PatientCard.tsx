import type { Patient } from '../types';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { isOverdue, isUpcoming } from '@/utils/time';

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
}

export default function PatientCard({ patient, onClick }: PatientCardProps) {
  const selectedPatientId = useAppStore((state) => state.selectedPatientId);
  const selectPatient = useAppStore((state) => state.selectPatient);
  const orders = useAppStore((state) => state.orders);
  const exceptionRecords = useAppStore((state) => state.exceptionRecords);

  const isSelected = selectedPatientId === patient.id;

  const patientOrders = orders.filter((o) => o.patientId === patient.id);
  const pendingOrders = patientOrders.filter(
    (o) => o.status === '待执行' || o.status === '执行中',
  );
  const hasException = exceptionRecords.some(
    (r) => r.patientId === patient.id && r.status === '待审核',
  );
  const hasOverdue = pendingOrders.some((o) => isOverdue(o.plannedTime));
  const hasUpcoming = pendingOrders.some((o) => isUpcoming(o.plannedTime));

  const borderColor = hasException || hasOverdue
    ? 'border-red-400'
    : hasUpcoming
    ? 'border-amber-400'
    : 'border-slate-200';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      selectPatient(isSelected ? null : patient.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-32 flex-col rounded-xl border-2 bg-white p-4 text-left transition-all hover:shadow-md',
        borderColor,
        isSelected && 'ring-2 ring-blue-500 ring-offset-2',
      )}
    >
      <div className="mb-2">
        <span className="text-2xl font-bold text-slate-800">{patient.bedNo.replace('床', '')}</span>
        <span className="ml-1 text-sm text-slate-500">床</span>
      </div>
      <div className="mb-1 text-sm font-medium text-slate-800">{patient.name}</div>
      <div className="mb-3 text-xs text-slate-500">
        {patient.gender} · {patient.age}岁
      </div>
      <div className="mt-auto flex items-center justify-between">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            pendingOrders.length > 0
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-500',
          )}
        >
          {pendingOrders.length} 条待执行
        </span>
        {hasException && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            异常
          </span>
        )}
      </div>
    </button>
  );
}
