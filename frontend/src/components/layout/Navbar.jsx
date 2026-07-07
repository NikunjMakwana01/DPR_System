import { Menu, Moon, Sun, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getInitials, getProfilePhotoUrl } from '../../utils/helpers';

export default function Navbar({ onMenuClick, notificationCount = 0 }) {
  const { user, isAdmin } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900 lg:px-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm text-gray-500">Welcome back,</p>
          <p className="font-semibold text-gray-900 dark:text-white">{user?.fullName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button
          onClick={() => navigate(isAdmin ? '/admin/notifications' : '/employee/notifications')}
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        <div className="ml-2 flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{user?.fullName}</p>
            <p className="text-xs capitalize text-gray-500">{user?.role}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-medium text-white">
            {user?.profilePhoto ? (
              <img src={getProfilePhotoUrl(user.profilePhoto)} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              getInitials(user?.fullName)
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
