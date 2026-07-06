import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dashboardAPI, attendanceAPI } from '../../api/services';
import Card, { StatCard } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { Calendar, Briefcase, FileText, User, ClipboardList, LogIn, LogOut } from 'lucide-react';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    dashboardAPI.getEmployee()
      .then(({ data }) => setData(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStartWork = async () => {
    setActionLoading(true);
    try {
      await attendanceAPI.startWork({});
      toast.success('Work started!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start work');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndWork = async () => {
    if (!data?.dprStatus?.allSubmitted && data?.dprStatus?.totalAssigned > 0) {
      toast.error('Submit all candidate DPRs before ending work');
      navigate('/employee/dpr');
      return;
    }
    setActionLoading(true);
    try {
      await attendanceAPI.endWork({});
      toast.success('Work ended!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end work');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (!data) return <p>Failed to load dashboard</p>;

  const att = data.todayAttendance;
  const workStarted = !!att;
  const workCompleted = att?.workStatus === 'completed';
  const canEndWork = !data.dprStatus?.totalAssigned || data.dprStatus?.allSubmitted;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {data.user?.fullName}</h1>
        <p className="text-gray-500">{data.user?.designation} · {data.user?.department}</p>
      </div>

      <Card title="Today's Work">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {!workStarted ? (
              <p className="text-gray-500">You haven't started work today.</p>
            ) : (
              <div>
                <p className="font-semibold">Check-in: {att.checkInTime} {att.checkOutTime && `· Check-out: ${att.checkOutTime}`}</p>
                <div className="mt-1 flex gap-2">
                  <StatusBadge status={att.status} />
                  <span className="text-sm capitalize text-gray-500">{att.workStatus?.replace('_', ' ')}</span>
                </div>
                {data.dprStatus?.totalAssigned > 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    DPR: {data.dprStatus.totalSubmitted}/{data.dprStatus.totalAssigned} submitted
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!workStarted && (
              <Button onClick={handleStartWork} loading={actionLoading}>
                <LogIn className="h-4 w-4" /> Start Work
              </Button>
            )}
            {workStarted && !workCompleted && (
              <Button
                variant="danger"
                onClick={handleEndWork}
                loading={actionLoading}
                disabled={!canEndWork}
              >
                <LogOut className="h-4 w-4" /> End Work
              </Button>
            )}
          </div>
        </div>
        {workStarted && !workCompleted && !canEndWork && (
          <p className="mt-3 text-sm text-yellow-600 dark:text-yellow-400">
            Submit DPR for all {data.dprStatus.totalAssigned} candidates before ending work.{' '}
            <Link to="/employee/dpr" className="font-medium underline">Go to Submit DPR</Link>
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Attendance"
          value={att ? att.checkInTime : 'Not Started'}
          icon={Calendar}
          color={att ? 'green' : 'yellow'}
        />
        <StatCard title="Assigned Candidates" value={data.assignedCandidates} icon={Briefcase} color="purple" />
        <StatCard title="Today's Reports" value={data.todayReports} icon={FileText} color="blue" />
        <StatCard title="Monthly Reports" value={data.monthlyReports} icon={ClipboardList} color="primary" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Profile Completion">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${data.profileCompletion}%` }} />
              </div>
              <p className="mt-2 text-sm text-gray-500">{data.profileCompletion}% complete</p>
            </div>
            <Link to="/employee/profile"><Button variant="outline" size="sm"><User className="h-4 w-4" /> Update</Button></Link>
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            <Link to="/employee/dpr"><Button className="w-full"><ClipboardList className="h-4 w-4" /> Submit DPR</Button></Link>
            <Link to="/employee/attendance"><Button className="w-full" variant="outline"><Calendar className="h-4 w-4" /> Attendance</Button></Link>
            <Link to="/employee/reports"><Button className="w-full" variant="outline"><FileText className="h-4 w-4" /> View Reports</Button></Link>
            <Link to="/employee/candidates"><Button className="w-full" variant="outline"><Briefcase className="h-4 w-4" /> Candidates</Button></Link>
          </div>
        </Card>
      </div>

      {data.notifications?.length > 0 && (
        <Card title="Recent Notifications">
          <div className="space-y-2">
            {data.notifications.map((n) => (
              <div key={n._id} className="rounded-lg border p-3 dark:border-gray-700">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-gray-500">{n.message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
