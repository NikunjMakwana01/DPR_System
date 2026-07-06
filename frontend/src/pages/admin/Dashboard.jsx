import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../api/services';
import Card, { StatCard } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import AttendanceChart from '../../components/charts/AttendanceChart';
import ReportChart from '../../components/charts/ReportChart';
import PerformanceChart from '../../components/charts/PerformanceChart';
import CandidateChart from '../../components/charts/CandidateChart';
import { formatDateTime } from '../../utils/helpers';
import {
  Users, UserCheck, Clock, UserX, Briefcase, FileText, Calendar, Activity,
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getAdmin()
      .then(({ data }) => setData(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <p className="text-gray-500">Failed to load dashboard</p>;

  const { cards, charts, recentActivities, recentLogins } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500">Overview of your organization's DPR system</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Employees" value={cards.totalEmployees} icon={Users} color="primary" />
        <StatCard title="Active Employees" value={cards.activeEmployees} icon={UserCheck} color="green" />
        <StatCard title="Pending Approval" value={cards.pendingEmployees} icon={Clock} color="yellow" />
        <StatCard title="Present Today" value={cards.presentToday} icon={UserCheck} color="green" />
        <StatCard title="Absent Today" value={cards.absentToday} icon={UserX} color="red" />
        <StatCard title="Total Candidates" value={cards.totalCandidates} icon={Briefcase} color="purple" />
        <StatCard title="Today's Reports" value={cards.todayReports} icon={FileText} color="blue" />
        <StatCard title="Monthly Reports" value={cards.monthlyReports} icon={Calendar} color="primary" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Attendance (Last 7 Days)">
          <AttendanceChart data={charts.attendance} />
        </Card>
        <Card title="Daily Reports (Last 7 Days)">
          <ReportChart data={charts.reports} />
        </Card>
        <Card title="Employee Performance">
          <PerformanceChart data={charts.performance} />
        </Card>
        <Card title="Candidate Applications">
          <CandidateChart data={charts.candidates} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Latest Activities" action={<Activity className="h-5 w-5 text-gray-400" />}>
          <div className="space-y-3">
            {recentActivities?.map((a) => (
              <div key={a._id} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500">{a.user?.fullName} — {a.details}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent Logins">
          <div className="space-y-3">
            {recentLogins?.map((u) => (
              <div key={u._id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium">{u.fullName}</p>
                  <p className="text-xs text-gray-500">{u.employeeId} · {u.role}</p>
                </div>
                <p className="text-xs text-gray-400">{formatDateTime(u.lastLogin)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
