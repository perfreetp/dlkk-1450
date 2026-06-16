import type { Patient } from '../types';

/**
 * Mock患者数据（6位）
 */
export const mockPatients: Patient[] = [
  {
    id: 'patient-001',
    bedNo: '01床',
    name: '李建国',
    gender: '男',
    age: 65,
    hospitalNo: 'H202401001',
    diagnosis: '冠状动脉粥样硬化性心脏病',
    allergies: ['青霉素', '海鲜'],
    ward: '心内科',
    wristbandCode: 'PAT000001',
  },
  {
    id: 'patient-002',
    bedNo: '02床',
    name: '王秀兰',
    gender: '女',
    age: 72,
    hospitalNo: 'H202401002',
    diagnosis: '高血压3级（极高危）',
    allergies: ['磺胺类药物'],
    ward: '心内科',
    wristbandCode: 'PAT000002',
  },
  {
    id: 'patient-003',
    bedNo: '03床',
    name: '张志强',
    gender: '男',
    age: 58,
    hospitalNo: 'H202401003',
    diagnosis: '急性心肌梗死',
    allergies: [],
    ward: '心内科',
    wristbandCode: 'PAT000003',
  },
  {
    id: 'patient-004',
    bedNo: '04床',
    name: '刘桂芳',
    gender: '女',
    age: 68,
    hospitalNo: 'H202401004',
    diagnosis: '心力衰竭（NYHA III级）',
    allergies: ['阿司匹林'],
    ward: '心内科',
    wristbandCode: 'PAT000004',
  },
  {
    id: 'patient-005',
    bedNo: '05床',
    name: '陈明辉',
    gender: '男',
    age: 45,
    hospitalNo: 'H202401005',
    diagnosis: '阵发性心房颤动',
    allergies: [],
    ward: '心内科',
    wristbandCode: 'PAT000005',
  },
  {
    id: 'patient-006',
    bedNo: '06床',
    name: '赵美华',
    gender: '女',
    age: 61,
    hospitalNo: 'H202401006',
    diagnosis: '冠心病心绞痛',
    allergies: ['头孢类', '碘造影剂'],
    ward: '心内科',
    wristbandCode: 'PAT000006',
  },
];

/**
 * 根据ID获取患者
 */
export function getPatientById(id: string): Patient | undefined {
  return mockPatients.find((patient) => patient.id === id);
}

/**
 * 根据腕带条码获取患者
 */
export function getPatientByWristbandCode(code: string): Patient | undefined {
  return mockPatients.find((patient) => patient.wristbandCode === code);
}

/**
 * 根据床号获取患者
 */
export function getPatientByBedNo(bedNo: string): Patient | undefined {
  return mockPatients.find((patient) => patient.bedNo === bedNo);
}
