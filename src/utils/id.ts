/**
 * 生成唯一ID函数
 * 使用时间戳 + 随机数的方式生成唯一标识
 * @returns 唯一ID字符串
 */
export function genId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}
