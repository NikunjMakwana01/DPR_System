import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard, Users, UserCheck, ClipboardList, Calendar,
  FileText, Bell, Settings, LogOut, X, Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/employees', icon: Users, label: 'Employees' },
  { to: '/admin/candidates', icon: Briefcase, label: 'Candidates' },
  { to: '/admin/assignments', icon: UserCheck, label: 'Assignments' },
  { to: '/admin/attendance', icon: Calendar, label: 'Attendance' },
  { to: '/admin/reports', icon: FileText, label: 'Reports' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const employeeLinks = [
  { to: '/employee/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employee/candidates', icon: Briefcase, label: 'My Candidates' },
  { to: '/employee/attendance', icon: Calendar, label: 'Attendance' },
  { to: '/employee/dpr', icon: ClipboardList, label: 'Submit DPR' },
  { to: '/employee/reports', icon: FileText, label: 'My Reports' },
  { to: '/employee/notifications', icon: Bell, label: 'Notifications' },
  { to: '/employee/profile', icon: Users, label: 'Profile' },
];

export default function Sidebar({ open, onClose }) {
  const { isAdmin, logout } = useAuth();
  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform dark:border-gray-700 dark:bg-gray-900 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-700">
          <div>
            <h1 className="text-lg font-bold text-primary-600">DPR System</h1>
            <p className="text-xs text-gray-500">{isAdmin ? 'Admin Portal' : 'Employee Portal'}</p>
          </div>
          <button onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
