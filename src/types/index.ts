// 患者信息接口
export interface Patient {
  id: string;
  bedNo: string;
  name: string;
  gender: '男' | '女';
  age: number;
  hospitalNo: string;
  diagnosis: string;
  allergies: string[];
  ward: string;
  wristbandCode: string;
}

// 医嘱类型
export type OrderType = '药品' | '治疗' | '检查' | '护理' | '手术';

// 医嘱状态
export type OrderStatus = '待执行' | '执行中' | '已执行' | '已退回' | '已暂停' | '异常' | '漏执行';

// 优先级
export type Priority = '普通' | '紧急' | '特级';

// 操作日志
export interface OperationLog {
  time: string;
  operator: string;
  action: string;
  detail?: string;
}

// 执行记录
export interface ExecutionRecord {
  id: string;
  orderId: string;
  patientId: string;
  executorId: string;
  executorName: string;
  executeTime: string;
  status: OrderStatus;
  verifyPatient: boolean;
  verifyDrug: boolean;
  signature: string;
  remark?: string;
  operationLog: OperationLog[];
}

// 异常记录
export interface ExceptionRecord {
  id: string;
  orderId: string;
  patientId: string;
  type: '拒绝执行' | '补录' | '暂停' | '冲突';
  reason: string;
  customReason?: string;
  description: string;
  reporterId: string;
  reporterName: string;
  reportTime: string;
  status: '待审核' | '已通过' | '已驳回';
  reviewerId?: string;
  reviewerName?: string;
  reviewTime?: string;
  reviewOpinion?: string;
}

// 交接记录
export interface HandoverRecord {
  id: string;
  shift: '早班' | '中班' | '晚班';
  handoverTime: string;
  outgoingNurseId: string;
  outgoingNurseName: string;
  outgoingSignature: string;
  incomingNurseId: string;
  incomingNurseName: string;
  incomingSignature: string;
  pendingOrders: string[];
  remarks: string;
}

// 用户信息
export interface User {
  id: string;
  name: string;
  role: '护士' | '医生' | '药师';
  jobNo: string;
  ward: string;
  signature: string;
}

// 医嘱信息
export interface Order {
  id: string;
  patientId: string;
  orderNo: string;
  type: OrderType;
  content: string;
  specification?: string;
  dosage?: string;
  usage?: string;
  barcode?: string;
  plannedTime: string;
  createTime: string;
  doctorName: string;
  pharmacistName?: string;
  priority: Priority;
  status: OrderStatus;
  isConflict: boolean;
  conflictReason?: string;
  remark?: string;
  groupId?: string;
}

// 分组后的医嘱
export interface GroupedOrders {
  overdue: Order[];
  upcoming: Order[];
  today: Order[];
  later: Order[];
}
