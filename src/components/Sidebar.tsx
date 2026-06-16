import { NavLink, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  ScanLine,
  FileText,
  AlertTriangle,
  Handshake,
  LogOut,
  User,
  Hospital,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

const navItems = [
  { to: '/orders/pending', icon: ClipboardList, label: '待执行医嘱' },
  { to: '/scan', icon: ScanLine, label: '扫码核对' },
  { to: '/records', icon: FileText, label: '执行记录' },
  { to: '/exceptions', icon: AlertTriangle, label: '异常处理' },
  { to: '/handover', icon: Handshake, label: '交接确认' },
];

export default function Sidebar() {
  const currentUser = useAppStore((state) => state.currentUser);
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="flex w-64 flex-col bg-slate-900 text-white">
      <div className="flex items-center gap-3 border-b border-slate-700 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
          <Hospital className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">住院医嘱</span>
          <span className="text-xs text-slate-400">闭环核对系统</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-700 p-4">
        {currentUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700">
                <User className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{currentUser.name}</span>
                <span className="text-xs text-slate-400">{currentUser.role} · {currentUser.jobNo}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>退出登录</span>
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-400">未登录</div>
        )}
      </div>
    </aside>
  );
}
