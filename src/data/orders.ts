import type { Order } from '../types';

/**
 * 获取当前时间前后的时间点，用于生成模拟数据
 */
const now = new Date();
const getTime = (minutesOffset: number): string => {
  return new Date(now.getTime() + minutesOffset * 60 * 1000).toISOString();
};

/**
 * Mock医嘱数据（16条）
 * 覆盖不同类型、优先级、状态，部分有冲突标记
 */
export const mockOrders: Order[] = [
  // ========== 01床 李建国 ==========
  {
    id: 'order-001',
    patientId: 'patient-001',
    orderNo: 'YZ20240115001',
    type: '药品',
    content: '阿司匹林肠溶片',
    specification: '100mg',
    dosage: '100mg',
    usage: '口服 每日一次',
    barcode: 'DRUG000001',
    plannedTime: getTime(-25),
    createTime: getTime(-120),
    doctorName: '张明远',
    pharmacistName: '刘芳',
    priority: '普通',
    status: '待执行',
    isConflict: false,
  },
  {
    id: 'order-002',
    patientId: 'patient-001',
    orderNo: 'YZ20240115002',
    type: '药品',
    content: '硝酸甘油注射液',
    specification: '5mg/1ml',
    dosage: '5mg',
    usage: '静脉滴注',
    barcode: 'DRUG000002',
    plannedTime: getTime(15),
    createTime: getTime(-60),
    doctorName: '张明远',
    pharmacistName: '刘芳',
    priority: '紧急',
    status: '待执行',
    isConflict: true,
    conflictReason: '与正在使用的西地那非存在药物相互作用',
  },

  // ========== 02床 王秀兰 ==========
  {
    id: 'order-003',
    patientId: 'patient-002',
    orderNo: 'YZ20240115003',
    type: '药品',
    content: '硝苯地平控释片',
    specification: '30mg',
    dosage: '30mg',
    usage: '口服 每日一次',
    barcode: 'DRUG000003',
    plannedTime: getTime(-40),
    createTime: getTime(-180),
    doctorName: '张明远',
    pharmacistName: '刘芳',
    priority: '普通',
    status: '漏执行',
    isConflict: false,
  },
  {
    id: 'order-004',
    patientId: 'patient-002',
    orderNo: 'YZ20240115004',
    type: '护理',
    content: '血压监测',
    specification: '',
    dosage: '',
    usage: '每2小时一次',
    plannedTime: getTime(5),
    createTime: getTime(-30),
    doctorName: '张明远',
    priority: '普通',
    status: '待执行',
    isConflict: false,
  },
  {
    id: 'order-005',
    patientId: 'patient-002',
    orderNo: 'YZ20240115005',
    type: '检查',
    content: '心电图检查',
    plannedTime: getTime(120),
    createTime: getTime(-60),
    doctorName: '张明远',
    priority: '紧急',
    status: '待执行',
    isConflict: false,
  },

  // ========== 03床 张志强 ==========
  {
    id: 'order-006',
    patientId: 'patient-003',
    orderNo: 'YZ20240115006',
    type: '药品',
    content: '硫酸氢氯吡格雷片',
    specification: '75mg',
    dosage: '300mg',
    usage: '口服 负荷剂量',
    barcode: 'DRUG000004',
    plannedTime: getTime(-10),
    createTime: getTime(-45),
    doctorName: '张明远',
    pharmacistName: '刘芳',
    priority: '特级',
    status: '执行中',
    isConflict: false,
  },
  {
    id: 'order-007',
    patientId: 'patient-003',
    orderNo: 'YZ20240115007',
    type: '治疗',
    content: '经皮冠状动脉介入治疗(PCI)',
    plannedTime: getTime(60),
    createTime: getTime(-30),
    doctorName: '张明远',
    priority: '特级',
    status: '待执行',
    isConflict: false,
    remark: '术前准备中',
  },

  // ========== 04床 刘桂芳 ==========
  {
    id: 'order-008',
    patientId: 'patient-004',
    orderNo: 'YZ20240115008',
    type: '药品',
    content: '呋塞米片',
    specification: '20mg',
    dosage: '40mg',
    usage: '口服 每日一次',
    barcode: 'DRUG000005',
    plannedTime: getTime(-15),
    createTime: getTime(-90),
    doctorName: '张明远',
    pharmacistName: '刘芳',
    priority: '普通',
    status: '异常',
    isConflict: false,
  },
  {
    id: 'order-009',
    patientId: 'patient-004',
    orderNo: 'YZ20240115009',
    type: '护理',
    content: '出入量记录',
    specification: '',
    dosage: '',
    usage: '每班次记录',
    plannedTime: getTime(30),
    createTime: getTime(-60),
    doctorName: '张明远',
    priority: '普通',
    status: '待执行',
    isConflict: false,
  },
  {
    id: 'order-010',
    patientId: 'patient-004',
    orderNo: 'YZ20240115010',
    type: '检查',
    content: '心脏超声检查',
    plannedTime: getTime(240),
    createTime: getTime(-60),
    doctorName: '张明远',
    priority: '普通',
    status: '待执行',
    isConflict: false,
  },

  // ========== 05床 陈明辉 ==========
  {
    id: 'order-011',
    patientId: 'patient-005',
    orderNo: 'YZ20240115011',
    type: '药品',
    content: '胺碘酮注射液',
    specification: '150mg/3ml',
    dosage: '150mg',
    usage: '静脉注射 10分钟内推注完毕',
    barcode: 'DRUG000006',
    plannedTime: getTime(-5),
    createTime: getTime(-20),
    doctorName: '张明远',
    pharmacistName: '刘芳',
    priority: '紧急',
    status: '已执行',
    isConflict: false,
  },
  {
    id: 'order-012',
    patientId: 'patient-005',
    orderNo: 'YZ20240115012',
    type: '治疗',
    content: '心电监护',
    specification: '',
    dosage: '',
    usage: '持续监测',
    plannedTime: getTime(10),
    createTime: getTime(-15),
    doctorName: '张明远',
    priority: '紧急',
    status: '待执行',
    isConflict: false,
  },

  // ========== 06床 赵美华 ==========
  {
    id: 'order-013',
    patientId: 'patient-006',
    orderNo: 'YZ20240115013',
    type: '药品',
    content: '阿托伐他汀钙片',
    specification: '20mg',
    dosage: '20mg',
    usage: '口服 每晚一次',
    barcode: 'DRUG000007',
    plannedTime: getTime(180),
    createTime: getTime(-60),
    doctorName: '张明远',
    pharmacistName: '刘芳',
    priority: '普通',
    status: '待执行',
    isConflict: false,
  },
  {
    id: 'order-014',
    patientId: 'patient-006',
    orderNo: 'YZ20240115014',
    type: '检查',
    content: '冠状动脉CT造影',
    plannedTime: getTime(480),
    createTime: getTime(-60),
    doctorName: '张明远',
    priority: '普通',
    status: '已退回',
    isConflict: true,
    conflictReason: '患者对碘造影剂过敏，需更换检查方案',
  },
  {
    id: 'order-015',
    patientId: 'patient-006',
    orderNo: 'YZ20240115015',
    type: '护理',
    content: '术前宣教',
    plannedTime: getTime(90),
    createTime: getTime(-30),
    doctorName: '张明远',
    priority: '普通',
    status: '待执行',
    isConflict: false,
  },
  {
    id: 'order-016',
    patientId: 'patient-006',
    orderNo: 'YZ20240115016',
    type: '治疗',
    content: '雾化吸入治疗',
    specification: '',
    dosage: '',
    usage: '每日两次',
    plannedTime: getTime(45),
    createTime: getTime(-60),
    doctorName: '张明远',
    priority: '普通',
    status: '待执行',
    isConflict: false,
  },
];

/**
 * 根据ID获取医嘱
 */
export function getOrderById(id: string): Order | undefined {
  return mockOrders.find((order) => order.id === id);
}

/**
 * 根据患者ID获取医嘱列表
 */
export function getOrdersByPatientId(patientId: string): Order[] {
  return mockOrders.filter((order) => order.patientId === patientId);
}

/**
 * 根据状态获取医嘱列表
 */
export function getOrdersByStatus(status: Order['status']): Order[] {
  return mockOrders.filter((order) => order.status === status);
}

/**
 * 根据药品条码获取医嘱
 */
export function getOrderByBarcode(barcode: string): Order | undefined {
  return mockOrders.find((order) => order.barcode === barcode);
}
