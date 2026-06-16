import type { User } from '../types';

/**
 * Mock用户数据
 */
export const mockUsers: User[] = [
  {
    id: 'user-nurse-001',
    name: '王丽华',
    role: '护士',
    jobNo: 'N2024001',
    ward: '心内科',
    signature: '王丽华签名',
  },
  {
    id: 'user-doctor-001',
    name: '张明远',
    role: '医生',
    jobNo: 'D2024001',
    ward: '心内科',
    signature: '张明远签名',
  },
  {
    id: 'user-pharmacist-001',
    name: '刘芳',
    role: '药师',
    jobNo: 'P2024001',
    ward: '心内科',
    signature: '刘芳签名',
  },
];

/**
 * 根据ID获取用户
 */
export function getUserById(id: string): User | undefined {
  return mockUsers.find((user) => user.id === id);
}

/**
 * 根据工号获取用户
 */
export function getUserByJobNo(jobNo: string): User | undefined {
  return mockUsers.find((user) => user.jobNo === jobNo);
}
