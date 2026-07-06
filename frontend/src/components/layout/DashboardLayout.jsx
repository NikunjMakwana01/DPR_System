import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import OfficeNetworkNotice from '../common/OfficeNetworkNotice';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../api/services';

export default function DashboardLayout() {
  const { user, onOfficeNetwork } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const showOfficeNotice = user?.role === 'employee' && onOfficeNetwork === false;

  useEffect(() => {
    if (showOfficeNotice) return;

    notificationAPI.getAll({ limit: 1 })
      .then(({ data }) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, [showOfficeNotice]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} notificationCount={unreadCount} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {showOfficeNotice ? <OfficeNetworkNotice /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
