import { create } from 'zustand';
import type {
  User,
  Patient,
  Order,
  OrderStatus,
  ExecutionRecord,
  ExceptionRecord,
  HandoverRecord,
} from '../types';
import { mockUsers } from '../data/users';
import { mockPatients } from '../data/patients';
import { mockOrders } from '../data/orders';
import { mockExecutionRecords, mockExceptionRecords } from '../data/records';
import { genId } from '../utils/id';

const STORAGE_KEY = 'inpatient-order-verify-store-v1';

interface PersistedState {
  currentUser: User | null;
  orders: Order[];
  executionRecords: ExecutionRecord[];
  exceptionRecords: ExceptionRecord[];
  handoverRecords: HandoverRecord[];
  selectedPatientId: string | null;
  selectedOrderIds: string[];
}

function loadPersistedState(): Partial<PersistedState> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load persisted state:', e);
  }
  return null;
}

function persistState(state: PersistedState) {
  try {
    const toSave: PersistedState = {
      currentUser: state.currentUser,
      orders: state.orders,
      executionRecords: state.executionRecords,
      exceptionRecords: state.exceptionRecords,
      handoverRecords: state.handoverRecords,
      selectedPatientId: state.selectedPatientId,
      selectedOrderIds: state.selectedOrderIds,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to persist state:', e);
  }
}

const persisted = loadPersistedState();

interface AppState {
  currentUser: User | null;
  patients: Patient[];
  orders: Order[];
  executionRecords: ExecutionRecord[];
  exceptionRecords: ExceptionRecord[];
  handoverRecords: HandoverRecord[];
  selectedPatientId: string | null;
  selectedOrderIds: string[];

  login: (jobNo: string) => void;
  logout: () => void;
  selectPatient: (patientId: string | null) => void;
  toggleOrderSelect: (orderId: string) => void;
  clearOrderSelect: () => void;
  selectAllOrders: (orderIds: string[]) => void;
  getOrdersByPatient: (patientId: string) => Order[];
  getPendingOrders: () => Order[];
  getOrdersByStatus: (status: OrderStatus) => Order[];
  executeOrder: (
    orderId: string,
    executorId: string,
    signature: string,
    verifyPatient?: boolean,
    verifyDrug?: boolean,
  ) => void;
  executeOrdersBatch: (
    orderIds: string[],
    executorId: string,
    signature: string,
    verifyPatient?: boolean,
    verifyDrug?: boolean,
  ) => number;
  reportException: (record: Omit<ExceptionRecord, 'id' | 'reportTime' | 'status'>) => void;
  createHandover: (record: Omit<HandoverRecord, 'id' | 'handoverTime'>) => void;
  verifyWristband: (code: string) => Patient | undefined;
  verifyDrugBarcode: (orderId: string, barcode: string) => boolean;
  reviewException: (
    id: string,
    passed: boolean,
    opinion: string,
    reviewerId: string,
    reviewerName: string,
  ) => void;
  resetToInitialData: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: persisted?.currentUser ?? mockUsers[0],
  patients: mockPatients,
  orders: persisted?.orders ?? mockOrders,
  executionRecords: persisted?.executionRecords ?? mockExecutionRecords,
  exceptionRecords: persisted?.exceptionRecords ?? mockExceptionRecords,
  handoverRecords: persisted?.handoverRecords ?? [],
  selectedPatientId: persisted?.selectedPatientId ?? null,
  selectedOrderIds: persisted?.selectedOrderIds ?? [],

  login: (jobNo: string) => {
    const user = mockUsers.find((u) => u.jobNo === jobNo);
    if (user) {
      set({ currentUser: user });
      persistState(get());
    }
  },

  logout: () => {
    set({ currentUser: null });
    persistState(get());
  },

  selectPatient: (patientId: string | null) => {
    set({ selectedPatientId: patientId, selectedOrderIds: [] });
    persistState(get());
  },

  toggleOrderSelect: (orderId: string) => {
    const { selectedOrderIds } = get();
    if (selectedOrderIds.includes(orderId)) {
      set({ selectedOrderIds: selectedOrderIds.filter((id) => id !== orderId) });
    } else {
      set({ selectedOrderIds: [...selectedOrderIds, orderId] });
    }
    persistState(get());
  },

  clearOrderSelect: () => {
    set({ selectedOrderIds: [] });
    persistState(get());
  },

  selectAllOrders: (orderIds: string[]) => {
    set({ selectedOrderIds: orderIds });
    persistState(get());
  },

  getOrdersByPatient: (patientId: string) => {
    return get().orders.filter((order) => order.patientId === patientId);
  },

  getPendingOrders: () => {
    const nonExecutedStatuses: OrderStatus[] = ['待执行', '执行中', '已暂停', '异常', '漏执行'];
    return get().orders.filter((order) => nonExecutedStatuses.includes(order.status));
  },

  getOrdersByStatus: (status: OrderStatus) => {
    return get().orders.filter((order) => order.status === status);
  },

  executeOrder: (
    orderId: string,
    executorId: string,
    signature: string,
    verifyPatient = false,
    verifyDrug = false,
  ) => {
    const { orders, executionRecords, patients } = get();
    const order = orders.find((o) => o.id === orderId);
    const user = mockUsers.find((u) => u.id === executorId);
    if (!order || !user) return;

    const patient = patients.find((p) => p.id === order.patientId);

    const updatedOrders = orders.map((o) =>
      o.id === orderId ? { ...o, status: '已执行' as OrderStatus } : o,
    );

    const newRecord: ExecutionRecord = {
      id: genId(),
      orderId,
      patientId: order.patientId,
      executorId,
      executorName: user.name,
      executeTime: new Date().toISOString(),
      status: '已执行',
      verifyPatient,
      verifyDrug,
      signature,
      operationLog: [
        {
          time: new Date().toISOString(),
          operator: user.name,
          action: '确认执行',
          detail: patient ? `${patient.bedNo} ${patient.name} - ${order.content}` : order.content,
        },
      ],
    };

    set({
      orders: updatedOrders,
      executionRecords: [...executionRecords, newRecord],
      selectedOrderIds: get().selectedOrderIds.filter((id) => id !== orderId),
    });
    persistState(get());
  },

  executeOrdersBatch: (
    orderIds: string[],
    executorId: string,
    signature: string,
    verifyPatient = false,
    verifyDrug = false,
  ) => {
    let count = 0;
    const validOrderIds = orderIds.filter((id) => {
      const order = get().orders.find((o) => o.id === id);
      return order && order.status !== '已执行';
    });
    validOrderIds.forEach((orderId) => {
      get().executeOrder(orderId, executorId, signature, verifyPatient, verifyDrug);
      count++;
    });
    return count;
  },

  reportException: (record) => {
    const { orders, exceptionRecords } = get();

    const updatedOrders = orders.map((o) =>
      o.id === record.orderId ? { ...o, status: '异常' as OrderStatus } : o,
    );

    const newException: ExceptionRecord = {
      ...record,
      id: genId(),
      reportTime: new Date().toISOString(),
      status: '待审核',
    };

    set({
      orders: updatedOrders,
      exceptionRecords: [...exceptionRecords, newException],
    });
    persistState(get());
  },

  createHandover: (record) => {
    const { handoverRecords } = get();

    const newHandover: HandoverRecord = {
      ...record,
      id: genId(),
      handoverTime: new Date().toISOString(),
    };

    set({ handoverRecords: [...handoverRecords, newHandover] });
    persistState(get());
  },

  verifyWristband: (code: string) => {
    return get().patients.find((p) => p.wristbandCode === code);
  },

  verifyDrugBarcode: (orderId: string, barcode: string) => {
    const order = get().orders.find((o) => o.id === orderId);
    return order ? order.barcode === barcode : false;
  },

  reviewException: (
    id: string,
    passed: boolean,
    opinion: string,
    reviewerId: string,
    reviewerName: string,
  ) => {
    const { exceptionRecords } = get();

    const updatedRecords = exceptionRecords.map((r) =>
      r.id === id
        ? {
            ...r,
            status: passed ? ('已通过' as const) : ('已驳回' as const),
            reviewerId,
            reviewerName,
            reviewTime: new Date().toISOString(),
            reviewOpinion: opinion,
          }
        : r,
    );

    set({ exceptionRecords: updatedRecords });
    persistState(get());
  },

  resetToInitialData: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      currentUser: mockUsers[0],
      orders: mockOrders,
      executionRecords: mockExecutionRecords,
      exceptionRecords: mockExceptionRecords,
      handoverRecords: [],
      selectedPatientId: null,
      selectedOrderIds: [],
    });
  },
}));
