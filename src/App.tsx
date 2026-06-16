import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PendingOrders from "@/pages/PendingOrders";
import ScanVerify from "@/pages/ScanVerify";
import ExecutionRecords from "@/pages/ExecutionRecords";
import ExceptionHandling from "@/pages/ExceptionHandling";
import HandoverConfirm from "@/pages/HandoverConfirm";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/orders/pending" replace />} />
          <Route path="orders/pending" element={<PendingOrders />} />
          <Route path="scan" element={<ScanVerify />} />
          <Route path="records" element={<ExecutionRecords />} />
          <Route path="exceptions" element={<ExceptionHandling />} />
          <Route path="handover" element={<HandoverConfirm />} />
        </Route>
        <Route path="*" element={<Navigate to="/orders/pending" replace />} />
      </Routes>
    </Router>
  );
}
