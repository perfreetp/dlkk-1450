/**
 * 时间格式化工具函数
 */

/**
 * 格式化时间为 HH:mm 格式
 * @param date 日期对象或时间字符串
 * @returns 格式化后的时间字符串 HH:mm
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param date 日期对象或时间字符串
 * @returns 格式化后的日期字符串 YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取时间分组类型
 * @param plannedTime 计划执行时间
 * @returns 时间分组：overdue-超时 | upcoming-即将 | today-今日 | later-后续
 */
export function getTimeGroup(plannedTime: Date | string): 'overdue' | 'upcoming' | 'today' | 'later' {
  const now = new Date();
  const planned = typeof plannedTime === 'string' ? new Date(plannedTime) : plannedTime;
  const diffMs = planned.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  // 超时：计划时间小于当前时间
  if (diffMinutes < 0) {
    return 'overdue';
  }

  // 即将执行：30分钟内
  if (diffMinutes <= 30) {
    return 'upcoming';
  }

  // 今日待执行：当天内
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (planned <= today) {
    return 'today';
  }

  // 后续待执行
  return 'later';
}

/**
 * 判断是否已超时
 * @param plannedTime 计划执行时间
 * @returns 是否超时
 */
export function isOverdue(plannedTime: Date | string): boolean {
  const planned = typeof plannedTime === 'string' ? new Date(plannedTime) : plannedTime;
  return planned.getTime() < Date.now();
}

/**
 * 判断是否即将执行（30分钟内）
 * @param plannedTime 计划执行时间
 * @returns 是否即将执行
 */
export function isUpcoming(plannedTime: Date | string): boolean {
  const planned = typeof plannedTime === 'string' ? new Date(plannedTime) : plannedTime;
  const diffMinutes = (planned.getTime() - Date.now()) / (1000 * 60);
  return diffMinutes >= 0 && diffMinutes <= 30;
}
