import type { OrderStatus, Priority, OrderType } from '../types';
import { cn } from '@/lib/utils';

type StatusBadgeVariant = 'status' | 'priority' | 'type';

interface StatusBadgeProps {
  status: OrderStatus | Priority | OrderType;
  variant: StatusBadgeVariant;
}

const statusStyles: Record<OrderStatus, string> = {
  '待执行': 'bg-blue-100 text-blue-700',
  '执行中': 'bg-cyan-100 text-cyan-700',
  '已执行': 'bg-green-100 text-green-700',
  '已退回': 'bg-slate-100 text-slate-600',
  '已暂停': 'bg-amber-100 text-amber-700',
  '异常': 'bg-red-100 text-red-700',
  '漏执行': 'bg-orange-100 text-orange-700',
};

const priorityStyles: Record<Priority, string> = {
  '普通': 'bg-slate-100 text-slate-600',
  '紧急': 'bg-amber-100 text-amber-700',
  '特级': 'bg-red-100 text-red-700',
};

const typeStyles: Record<OrderType, string> = {
  '药品': 'bg-blue-100 text-blue-700',
  '治疗': 'bg-purple-100 text-purple-700',
  '检查': 'bg-green-100 text-green-700',
  '护理': 'bg-teal-100 text-teal-700',
  '手术': 'bg-rose-100 text-rose-700',
};

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  let className = '';

  if (variant === 'status') {
    className = statusStyles[status as OrderStatus];
  } else if (variant === 'priority') {
    className = priorityStyles[status as Priority];
  } else if (variant === 'type') {
    className = typeStyles[status as OrderType];
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
    >
      {status}
    </span>
  );
}
