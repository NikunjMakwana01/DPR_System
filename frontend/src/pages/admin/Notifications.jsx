import { useEffect, useState } from 'react';
import { notificationAPI } from '../../api/services';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatDateTime } from '../../utils/helpers';
import { Bell } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    notificationAPI.getAll({ limit: 50 }).then(({ data }) => setNotifications(data.data)).catch(() => {});
  }, []);

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div><h1 className="text-2xl font-bold">Notifications</h1><p className="text-gray-500">System notifications and alerts</p></div>
        <Button variant="outline" onClick={markAllRead}>Mark All Read</Button>
      </div>

      <Card>
        <div className="space-y-3">
          {notifications.length ? notifications.map((n) => (
            <div key={n._id} className={`flex items-start gap-4 rounded-lg border p-4 dark:border-gray-700 ${!n.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
              <Bell className={`mt-0.5 h-5 w-5 ${!n.isRead ? 'text-primary-600' : 'text-gray-400'}`} />
              <div className="flex-1">
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-gray-500">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary-600" />}
            </div>
          )) : <p className="text-center text-gray-500 py-8">No notifications</p>}
        </div>
      </Card>
    </div>
  );
}
