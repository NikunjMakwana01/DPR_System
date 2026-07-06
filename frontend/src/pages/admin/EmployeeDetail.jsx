import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeAPI } from '../../api/services';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate, formatDateTime } from '../../utils/helpers';
import { ArrowLeft } from 'lucide-react';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    employeeAPI.getOne(id).then(({ data }) => setData(data.data)).catch(() => {});
  }, [id]);

  if (!data) return <div className="animate-pulse h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />;

  const { employee, attendance, assignments, reports } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{employee.fullName}</h1>
          <p className="text-gray-500">{employee.employeeId} · {employee.department}</p>
        </div>
        <StatusBadge status={employee.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Employee Details" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{employee.email}</dd></div>
            <div><dt className="text-gray-500">Mobile</dt><dd className="font-medium">{employee.mobileNumber}</dd></div>
            <div><dt className="text-gray-500">Designation</dt><dd className="font-medium">{employee.designation}</dd></div>
            <div><dt className="text-gray-500">Profile Completion</dt><dd className="font-medium">{employee.profileCompletion}%</dd></div>
            <div><dt className="text-gray-500">Joined</dt><dd className="font-medium">{formatDate(employee.createdAt)}</dd></div>
          </dl>
        </Card>

        <Card title="Assigned Candidates" className="lg:col-span-2">
          <div className="space-y-2">
            {assignments?.length ? assignments.map((a) => (
              <div key={a._id} className="flex justify-between rounded-lg border p-3 dark:border-gray-700">
                <div>
                  <p className="font-medium">{a.candidate?.name}</p>
                  <p className="text-sm text-gray-500">{a.candidate?.jobRole}</p>
                </div>
                <StatusBadge status={a.candidate?.status} />
              </div>
            )) : <p className="text-gray-500">No candidates assigned</p>}
          </div>
        </Card>
      </div>

      <Card title="Recent Attendance">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b dark:border-gray-700"><th className="py-2 text-left">Date</th><th className="py-2 text-left">Check-in</th><th className="py-2 text-left">Status</th></tr></thead>
            <tbody>
              {attendance?.map((a) => (
                <tr key={a._id} className="border-b dark:border-gray-800">
                  <td className="py-2">{formatDate(a.date)}</td>
                  <td className="py-2">{a.checkInTime}</td>
                  <td className="py-2"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Recent Reports">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b dark:border-gray-700"><th className="py-2 text-left">Date</th><th className="py-2 text-left">Candidate</th><th className="py-2 text-left">Long Apps</th><th className="py-2 text-left">Short Apps</th><th className="py-2 text-left">Availability</th><th className="py-2 text-left">Screening</th><th className="py-2 text-left">Assessment</th></tr></thead>
            <tbody>
              {reports?.map((r) => (
                <tr key={r._id} className="border-b dark:border-gray-800">
                  <td className="py-2">{formatDate(r.date)}</td>
                  <td className="py-2">{r.candidate?.name}</td>
                  <td className="py-2">{r.longApp ?? 0}</td>
                  <td className="py-2">{r.shortApp ?? 0}</td>
                  <td className="py-2">{r.availability ?? 0}</td>
                  <td className="py-2">{r.screening ?? 0}</td>
                  <td className="py-2">{r.assessment ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
