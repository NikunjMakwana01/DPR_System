import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../../api/services';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { Download } from 'lucide-react';
import { formatDate, downloadBlob } from '../../utils/helpers';

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState('daily');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const fetchDaily = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.getAll({ status, month, year, page, limit: 15 });
      setRecords(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const { data } = await attendanceAPI.getMonthlySummary({ month, year });
      setMonthlySummary(data.data);
    } catch { toast.error('Failed to load summary'); }
    finally { setSummaryLoading(false); }
  };

  useEffect(() => {
    if (tab === 'daily') fetchDaily();
    else fetchSummary();
  }, [status, tab, month, year]);

  const handleExport = async () => {
    try {
      const { data } = await attendanceAPI.export({ month, year });
      downloadBlob(data, 'attendance.csv');
    } catch { toast.error('Export failed'); }
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div><h1 className="text-2xl font-bold">Attendance</h1><p className="text-gray-500">View daily records and monthly summaries</p></div>
        <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg border dark:border-gray-700">
          <button
            onClick={() => setTab('daily')}
            className={`px-4 py-2 text-sm font-medium ${tab === 'daily' ? 'bg-primary-600 text-white rounded-lg' : 'text-gray-600'}`}
          >
            Daily Records
          </button>
          <button
            onClick={() => setTab('monthly')}
            className={`px-4 py-2 text-sm font-medium ${tab === 'monthly' ? 'bg-primary-600 text-white rounded-lg' : 'text-gray-600'}`}
          >
            Monthly Summary
          </button>
        </div>
        <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-36">
          {months.map((m) => <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('en', { month: 'long' })}</option>)}
        </Select>
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
      </div>

      {tab === 'daily' ? (
        <Card>
          <div className="mb-4 w-48">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </Select>
          </div>
          {loading ? <TableSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Employee</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Check-in</th>
                    <th className="px-4 py-3 text-left">Check-out</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Work</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id} className="border-b dark:border-gray-800">
                      <td className="px-4 py-3">{r.employee?.fullName} ({r.employee?.employeeId})</td>
                      <td className="px-4 py-3">{formatDate(r.date)}</td>
                      <td className="px-4 py-3">{r.checkInTime}</td>
                      <td className="px-4 py-3">{r.checkOutTime || '-'}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 capitalize">{r.workStatus?.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchDaily} />
        </Card>
      ) : (
        <Card title={`Monthly Attendance — ${new Date(year, month - 1).toLocaleString('en', { month: 'long', year: 'numeric' })}`}>
          {summaryLoading ? <TableSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Employee</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-left">Present</th>
                    <th className="px-4 py-3 text-left">Absent</th>
                    <th className="px-4 py-3 text-left">Days in Month</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.map((row) => (
                    <tr key={row.employee._id} className="border-b dark:border-gray-800">
                      <td className="px-4 py-3 font-medium">{row.employee.fullName} ({row.employee.employeeId})</td>
                      <td className="px-4 py-3">{row.employee.department}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {row.summary}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          {row.absent}/{row.totalDays}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{row.totalDays} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
