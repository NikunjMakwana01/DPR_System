import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../../api/services';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/helpers';
import { LogIn, LogOut, CheckCircle, AlertCircle, ClipboardList } from 'lucide-react';

export default function EmployeeAttendance() {
  const [todayData, setTodayData] = useState(null);
  const [history, setHistory] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    const [todayRes, historyRes] = await Promise.all([
      attendanceAPI.getToday(),
      attendanceAPI.getMy({ month: new Date().getMonth() + 1, year: new Date().getFullYear() }),
    ]);
    setTodayData(todayRes.data.data);
    setHistory(historyRes.data.data);
  };

  useEffect(() => { fetch(); }, []);

  const attendance = todayData?.attendance;
  const dprStatus = todayData?.dprStatus;

  const startWork = async () => {
    setLoading(true);
    try {
      await attendanceAPI.startWork({ remarks });
      toast.success('Work started! Check-in recorded.');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start work');
    } finally {
      setLoading(false);
    }
  };

  const endWork = async () => {
    if (!dprStatus?.allSubmitted) {
      toast.error('Submit DPR for all assigned candidates before ending work');
      return;
    }
    setLoading(true);
    try {
      await attendanceAPI.endWork({ remarks });
      toast.success('Work ended! Check-out recorded.');
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end work');
    } finally {
      setLoading(false);
    }
  };

  const workCompleted = attendance?.workStatus === 'completed';
  const workStarted = !!attendance;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">My Attendance</h1><p className="text-gray-500">Start work, submit DPRs, then end work</p></div>

      <Card title="Today's Work Session">
        {!workStarted ? (
          <div className="space-y-4">
            <p className="text-gray-500">Click Start Work when you begin your day.</p>
            <Input label="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            <Button onClick={startWork} loading={loading} className="w-full sm:w-auto">
              <LogIn className="h-4 w-4" /> Start Work / Login
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div>
                <p className="text-lg font-semibold">Work Started</p>
                <p className="text-gray-500">
                  Check-in: {attendance.checkInTime}
                  {attendance.checkOutTime && ` · Check-out: ${attendance.checkOutTime}`}
                </p>
                <div className="mt-1 flex gap-2">
                  <StatusBadge status={attendance.status} />
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize dark:bg-gray-800">
                    {attendance.workStatus?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {dprStatus && dprStatus.totalAssigned > 0 && (
              <div className={`rounded-lg border p-4 ${dprStatus.allSubmitted ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'}`}>
                <div className="flex items-start gap-2">
                  {dprStatus.allSubmitted ? (
                    <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      DPR Progress: {dprStatus.totalSubmitted}/{dprStatus.totalAssigned} candidates
                    </p>
                    {!dprStatus.allSubmitted && (
                      <>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Submit DPR for all candidates before ending work:
                        </p>
                        <ul className="mt-2 space-y-1">
                          {dprStatus.pendingCandidates?.map((c) => (
                            <li key={c._id} className="text-sm text-gray-600 dark:text-gray-400">• {c.name} — {c.jobRole}</li>
                          ))}
                        </ul>
                        <Link to="/employee/dpr" className="mt-3 inline-block">
                          <Button size="sm"><ClipboardList className="h-4 w-4" /> Submit Pending DPR</Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!workCompleted && (
              <Button
                onClick={endWork}
                loading={loading}
                variant={dprStatus?.allSubmitted !== false ? 'danger' : 'secondary'}
                disabled={dprStatus?.totalAssigned > 0 && !dprStatus?.allSubmitted}
                className="w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4" /> End Work / Logout
              </Button>
            )}

            {workCompleted && (
              <p className="text-sm font-medium text-green-600">Today's work session completed.</p>
            )}
          </div>
        )}
      </Card>

      <Card title="Monthly History">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b dark:border-gray-700">
              <tr>
                <th className="py-2 text-left">Date</th>
                <th className="py-2 text-left">Check-in</th>
                <th className="py-2 text-left">Check-out</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Session</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h._id} className="border-b dark:border-gray-800">
                  <td className="py-2">{formatDate(h.date)}</td>
                  <td className="py-2">{h.checkInTime}</td>
                  <td className="py-2">{h.checkOutTime || '-'}</td>
                  <td className="py-2"><StatusBadge status={h.status} /></td>
                  <td className="py-2 capitalize">{h.workStatus?.replace('_', ' ') || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
