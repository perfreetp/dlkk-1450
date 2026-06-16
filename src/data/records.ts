import type { ExecutionRecord, ExceptionRecord } from '../types';

/**
 * 获取当前时间前后的时间点，用于生成模拟数据
 */
const now = new Date();
const getTime = (minutesOffset: number): string => {
  return new Date(now.getTime() + minutesOffset * 60 * 1000).toISOString();
};

/**
 * Mock执行记录数据（10条）
 */
export const mockExecutionRecords: ExecutionRecord[] = [
  // 05床 陈明辉 胺碘酮注射液 已执行
  {
    id: 'exec-001',
    orderId: 'order-011',
    patientId: 'patient-005',
    executorId: 'user-nurse-001',
    executorName: '王丽华',
    executeTime: getTime(-3),
    status: '已执行',
    verifyPatient: true,
    verifyDrug: true,
    signature: '王丽华签名',
    operationLog: [
      {
        time: getTime(-5),
        operator: '王丽华',
        action: '扫描患者腕带',
        detail: '腕带条码PAT000005，核对成功',
      },
      {
        time: getTime(-4),
        operator: '王丽华',
        action: '扫描药品条码',
        detail: '药品条码DRUG000006，核对成功',
      },
      {
        time: getTime(-3),
        operator: '王丽华',
        action: '确认执行',
        detail: '静脉注射完成，患者无不适',
      },
    ],
  },
  // 01床 李建国 阿司匹林肠溶片 历史执行记录
  {
    id: 'exec-002',
    orderId: 'order-001-history',
    patientId: 'patient-001',
    executorId: 'user-nurse-001',
    executorName: '王丽华',
    executeTime: getTime(-180),
    status: '已执行',
    verifyPatient: true,
    verifyDrug: true,
    signature: '王丽华签名',
    remark: '昨日晚间剂量',
    operationLog: [
      {
        time: getTime(-182),
        operator: '王丽华',
        action: '扫描患者腕带',
        detail: '腕带条码PAT000001，核对成功',
      },
      {
        time: getTime(-180),
        operator: '王丽华',
        action: '确认执行',
        detail: '口服给药完成',
      },
    ],
  },
  // 02床 王秀兰 硝苯地平控释片 历史执行记录
  {
    id: 'exec-003',
    orderId: 'order-003-history',
    patientId: 'patient-002',
    executorId: 'user-nurse-001',
    executorName: '王丽华',
    executeTime: getTime(-360),
    status: '已执行',
    verifyPatient: true,
    verifyDrug: true,
    signature: '王丽华签名',
    operationLog: [
      {
        time: getTime(-362),
        operator: '王丽华',
        action: '扫描患者腕带',
        detail: '腕带条码PAT000002，核对成功',
      },
      {
        time: getTime(-360),
        operator: '王丽华',
        action: '确认执行',
        detail: '口服给药完成，血压145/90mmHg',
      },
    ],
  },
  // 03床 张志强 执行中
  {
    id: 'exec-004',
    orderId: 'order-006',
    patientId: 'patient-003',
    executorId: 'user-nurse-001',
    executorName: '王丽华',
    executeTime: getTime(-8),
    status: '执行中',
    verifyPatient: true,
    verifyDrug: true,
    signature: '王丽华签名',
    operationLog: [
      {
        time: getTime(-10),
        operator: '王丽华',
        action: '扫描患者腕带',
        detail: '腕带条码PAT000003，核对成功',
      },
      {
        time: getTime(-9),
        operator: '王丽华',
        action: '扫描药品条码',
        detail: '药品条码DRUG000004，核对成功',
      },
      {
        time: getTime(-8),
        operator: '王丽华',
        action: '开始执行',
        detail: '给予负荷剂量300mg口服',
      },
    ],
  },
  // 04床 刘桂芳 历史执行记录
  {
    id: 'exec-005',
    orderId: 'order-008-history1',
    patientId: 'patient-004',
    executorId: 'user-nurse-001',
    executorName: '王丽华',
    executeTime: getTime(-720),
    status: '已执行',
    verifyPatient: true,
    verifyDrug: true,
    signature: '王丽华签名',
    operationLog: [
      {
        time: getTime(-722),
        operator: '王丽华',
        action: '扫描患者腕带',
        detail: '腕带条码PAT000004，核对成功',
      },
      {
        time: getTime(-720),
        operator: '王丽华',
        action: '确认执行',
        detail: '口服给药完成，尿量监测中',
      },
    ],
  },
  // 06床 赵美华 历史执行记录
  {
    id: 'exec-006',
    orderId: 'order-013-history',
    patientId: 'patient-006',
    executorId: 'user-nurse-001',
    executorName: '王丽华',
    executeTime: getTime(-1440),
    status: '已执行',
    verifyPatient: true,
    verifyDrug: true,
    signature: '王丽华签名',
    operationLog: [
      {
        time: getTime(-1442),
        operator: '王丽华',
        action: '扫描患者腕带',
        detail: '腕带条码PAT000006，核对成功',
      },
      {
        time: getTime(-1440),
        operator: '王丽华',
        action: '确认执行',
        detail: '口服给药完成',
      },
    ],
  },
  // 02床 王秀兰 血压监测历史
  {
    id: 'exec-007',
    orderId: 'order-004-history1',
    patientId: 'patient-002',
    executorId: 'user-nurse-001',
    executorName: '王丽华',
    executeTime: getTime(-120),
    status: '已执行',
    verifyPatient: true,
    verifyDrug: false,
    signature: '王丽华签名',
    remark: '血压138/85mmHg，心率78次/分',
    operationLog: [
      {
        time: getTime(-121),
        operator: '王丽华',
        action: '扫描患者腕带',
        detail: '腕带条码PAT000002，核对成功',
      },
      {
        time: getTime(-120),
        operator: '王丽华',
        action: '完成监测',
        detail: '血压138/85mmHg，心率78次/分',
      },
    ],
  },
  // 02床 王秀兰 血压监测历史
  {
    id: 'exec-008',
    orderId: 'order-004-history2',
    patientId: 'patient-002',
    executorId: 'user-nurse-001',
    executorName: '王丽华',
    executeTime: getTime(-240),
    status: '已执行',
    verifyPatient: true,
    verifyDrug: false,
    signature: '王丽华签名',
    remark: '血压142/88mmHg，心率82次/分',
    operationLog: [
      {
        time: getTime(-241),
        operator: '王丽华',
        action: '扫描患者腕带',
        detail: '腕带条码PAT000002，核对成功',
      },
      {
        time: getTime(-240),
        operator: '王丽华',
        action: '完成监测',
        detail: '血压142/88mmHg，心率82次/分',
      },
    ],
  },
  // 05床 陈明辉 心电监护历史
  {
    id: 'exec-009',
    orderId: 'order-012-history',
    patientId: 'patient-005',
    executorId: 'user-nurse-001',
    executorName: '王丽华',
    executeTime: getTime(-60),
    status: '已执行',
    verifyPatient: true,
    verifyDrug: false,
    signature: '王丽华签名',
    remark: '心率85次/分，律不齐，房颤心律',
    operationLog: [
      {
        time: getTime(-61),
        operator: '王丽华',
        action: '扫描患者腕带',
        detail: '腕带条码PAT000005，核对成功',
      },
      {
        time: getTime(-60),
        operator: '王丽华',
        action: '开始监护',
        detail: '心电监护已连接',
      },
    ],
  },
  // 04床 刘桂芳 出入量记录
  {
    id: 'exec-010',
    orderId: 'order-009-history',
    patientId: 'patient-004',
    executorId: 'user-nurse-001',
    executorName: '王丽华',
    executeTime: getTime(-480),
    status: '已执行',
    verifyPatient: true,
    verifyDrug: false,
    signature: '王丽华签名',
    remark: '入量1500ml，出量800ml',
    operationLog: [
      {
        time: getTime(-480),
        operator: '王丽华',
        action: '记录出入量',
        detail: '入量1500ml，出量800ml',
      },
    ],
  },
];

/**
 * Mock异常记录数据（4条）
 */
export const mockExceptionRecords: ExceptionRecord[] = [
  // 04床 刘桂芳 呋塞米片 拒绝执行
  {
    id: 'excep-001',
    orderId: 'order-008',
    patientId: 'patient-004',
    type: '拒绝执行',
    reason: '患者拒绝服药',
    description: '患者主诉恶心、胃部不适，拒绝服用呋塞米片，已报告医生',
    reporterId: 'user-nurse-001',
    reporterName: '王丽华',
    reportTime: getTime(-10),
    status: '待审核',
  },
  // 02床 王秀兰 硝苯地平控释片 漏执行补录
  {
    id: 'excep-002',
    orderId: 'order-003',
    patientId: 'patient-002',
    type: '补录',
    reason: '遗漏执行',
    description: '因交接班繁忙，08:00硝苯地平控释片遗漏执行，现补录并已补发药物',
    reporterId: 'user-nurse-001',
    reporterName: '王丽华',
    reportTime: getTime(-35),
    status: '已通过',
    reviewerId: 'user-doctor-001',
    reviewerName: '张明远',
    reviewTime: getTime(-30),
    reviewOpinion: '情况属实，注意后续加强核对',
  },
  // 06床 赵美华 冠脉CT造影 冲突退回
  {
    id: 'excep-003',
    orderId: 'order-014',
    patientId: 'patient-006',
    type: '冲突',
    reason: '药物过敏',
    customReason: '碘造影剂过敏史',
    description: '患者有碘造影剂过敏史，冠状动脉CT造影检查存在严重过敏风险，需更换为其他检查方案',
    reporterId: 'user-nurse-001',
    reporterName: '王丽华',
    reportTime: getTime(-50),
    status: '已通过',
    reviewerId: 'user-doctor-001',
    reviewerName: '张明远',
    reviewTime: getTime(-45),
    reviewOpinion: '同意，改做心脏核磁检查',
  },
  // 01床 李建国 硝酸甘油 药物冲突
  {
    id: 'excep-004',
    orderId: 'order-002',
    patientId: 'patient-001',
    type: '冲突',
    reason: '药物相互作用',
    description: '硝酸甘油与患者正在服用的西地那非存在严重药物相互作用，可能导致严重低血压，需医生评估后执行',
    reporterId: 'user-pharmacist-001',
    reporterName: '刘芳',
    reportTime: getTime(-55),
    status: '待审核',
  },
];

/**
 * 根据ID获取执行记录
 */
export function getExecutionRecordById(id: string): ExecutionRecord | undefined {
  return mockExecutionRecords.find((record) => record.id === id);
}

/**
 * 根据医嘱ID获取执行记录列表
 */
export function getExecutionRecordsByOrderId(orderId: string): ExecutionRecord[] {
  return mockExecutionRecords.filter((record) => record.orderId === orderId);
}

/**
 * 根据患者ID获取执行记录列表
 */
export function getExecutionRecordsByPatientId(patientId: string): ExecutionRecord[] {
  return mockExecutionRecords.filter((record) => record.patientId === patientId);
}

/**
 * 根据ID获取异常记录
 */
export function getExceptionRecordById(id: string): ExceptionRecord | undefined {
  return mockExceptionRecords.find((record) => record.id === id);
}

/**
 * 根据医嘱ID获取异常记录列表
 */
export function getExceptionRecordsByOrderId(orderId: string): ExceptionRecord[] {
  return mockExceptionRecords.filter((record) => record.orderId === orderId);
}

/**
 * 根据患者ID获取异常记录列表
 */
export function getExceptionRecordsByPatientId(patientId: string): ExceptionRecord[] {
  return mockExceptionRecords.filter((record) => record.patientId === patientId);
}

/**
 * 根据状态获取异常记录列表
 */
export function getExceptionRecordsByStatus(
  status: ExceptionRecord['status'],
): ExceptionRecord[] {
  return mockExceptionRecords.filter((record) => record.status === status);
}
