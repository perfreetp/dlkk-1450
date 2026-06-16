import type { Order, OrderType, OrderStatus, Priority, GroupedOrders } from '../types';
import { getTimeGroup } from './time';

/**
 * 医嘱处理工具函数
 */

/**
 * 优先级排序权重
 */
const priorityWeight: Record<Priority, number> = {
  '特级': 3,
  '紧急': 2,
  '普通': 1,
};

/**
 * 医嘱分组排序
 * 按超时/即将/今日/后续分组，组内按优先级和时间排序
 * @param orders 医嘱列表
 * @returns 分组后的医嘱
 */
export function groupAndSortOrders(orders: Order[]): GroupedOrders {
  const result: GroupedOrders = {
    overdue: [],
    upcoming: [],
    today: [],
    later: [],
  };

  // 分组
  orders.forEach((order) => {
    const group = getTimeGroup(order.plannedTime);
    result[group].push(order);
  });

  // 组内排序：冲突医嘱置顶，然后按优先级降序，再按时间升序
  const sortFn = (a: Order, b: Order): number => {
    // 冲突医嘱置顶
    if (a.isConflict !== b.isConflict) {
      return a.isConflict ? -1 : 1;
    }
    // 优先级降序
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    // 时间升序
    return new Date(a.plannedTime).getTime() - new Date(b.plannedTime).getTime();
  };

  result.overdue.sort(sortFn);
  result.upcoming.sort(sortFn);
  result.today.sort(sortFn);
  result.later.sort(sortFn);

  return result;
}

/**
 * 获取医嘱类型对应的颜色
 * @param type 医嘱类型
 * @returns TailwindCSS 颜色类名
 */
export function getOrderTypeColor(type: OrderType): string {
  const colorMap: Record<OrderType, string> = {
    '药品': 'bg-blue-100 text-blue-700 border-blue-200',
    '治疗': 'bg-purple-100 text-purple-700 border-purple-200',
    '检查': 'bg-green-100 text-green-700 border-green-200',
    '护理': 'bg-orange-100 text-orange-700 border-orange-200',
    '手术': 'bg-red-100 text-red-700 border-red-200',
  };
  return colorMap[type];
}

/**
 * 获取医嘱状态对应的颜色
 * @param status 医嘱状态
 * @returns TailwindCSS 颜色类名
 */
export function getStatusColor(status: OrderStatus): string {
  const colorMap: Record<OrderStatus, string> = {
    '待执行': 'bg-gray-100 text-gray-700 border-gray-200',
    '执行中': 'bg-blue-100 text-blue-700 border-blue-200',
    '已执行': 'bg-green-100 text-green-700 border-green-200',
    '已退回': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    '已暂停': 'bg-gray-200 text-gray-600 border-gray-300',
    '异常': 'bg-red-100 text-red-700 border-red-200',
    '漏执行': 'bg-red-200 text-red-800 border-red-300',
  };
  return colorMap[status];
}

/**
 * 获取优先级对应的颜色
 * @param priority 优先级
 * @returns TailwindCSS 颜色类名
 */
export function getPriorityColor(priority: Priority): string {
  const colorMap: Record<Priority, string> = {
    '普通': 'bg-gray-100 text-gray-700 border-gray-200',
    '紧急': 'bg-orange-100 text-orange-700 border-orange-200',
    '特级': 'bg-red-100 text-red-700 border-red-200',
  };
  return colorMap[priority];
}
