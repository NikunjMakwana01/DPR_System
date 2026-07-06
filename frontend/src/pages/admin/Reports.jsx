import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { dprAPI } from '../../api/services';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import PeriodFilter, { PERIOD_LABELS } from '../../components/ui/PeriodFilter';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { Download, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { formatDate, downloadBlob } from '../../utils/helpers';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('daily');
  const [expanded, setExpanded] = useState({});

  const fetch = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await dprAPI.getGrouped({ search, period, page, limit: 15 });
      setReports(data.data);
      setPagination(data.pagination);
      setExpanded({});
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [search, period]);

  const toggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const exportCSV = async () => {
    try {
      const { data } = await dprAPI.exportCSV({ period });
      downloadBlob(data, `dpr_reports_${period}.csv`);
    } catch { toast.error('Export failed'); }
  };

  const exportPDF = async () => {
    try {
      const { data } = await dprAPI.exportPDF({ period });
      downloadBlob(data, `dpr_reports_${period}.pdf`);
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">DPR Reports</h1>
          <p className="text-gray-500">{PERIOD_LABELS[period]} — grouped by employee</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="outline" onClick={exportPDF}><FileText className="h-4 w-4" /> PDF</Button>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PeriodFilter value={period} onChange={setPeriod} />
          <div className="flex-1 sm:max-w-xs">
            <SearchBar value={search} onChange={setSearch} placeholder="Search employee or candidate..." />
          </div>
        </div>

        {loading ? <TableSkeleton /> : (
          <div className="space-y-2">
            {reports.map((group) => {
              const key = `${group.employee?._id}_${formatDate(group.date)}`;
              const isOpen = expanded[key];
              return (
                <div key={key} className="rounded-lg border dark:border-gray-700">
                  <button
                    onClick={() => toggleExpand(key)}
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div>
                        <p className="font-semibold">{group.employee?.fullName} ({group.employee?.employeeId})</p>
                        <p className="text-sm text-gray-500">
                          {period === 'daily' ? formatDate(group.date) : `${group.candidates.length} report(s)`}
                          {' · '}{[...new Set(group.candidates.map((c) => c.candidate?.name))].length} candidate(s)
                        </p>
                      </div>
                    </div>
                    <div className="hidden gap-4 text-sm sm:flex">
                      <span>Long Apps: <strong>{group.totals.longApp ?? 0}</strong></span>
                      <span>Short Apps: <strong>{group.totals.shortApp ?? 0}</strong></span>
                      <span>Availability: <strong>{group.totals.availability ?? 0}</strong></span>
                      <span>Screening: <strong>{group.totals.screening ?? 0}</strong></span>
                      <span>Assessment: <strong>{group.totals.assessment ?? 0}</strong></span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t dark:border-gray-700">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            {period !== 'daily' && <th className="px-4 py-2 text-left">Date</th>}
                            <th className="px-4 py-2 text-left">Candidate</th>
                            <th className="px-4 py-2 text-left">Job Role</th>
                            <th className="px-4 py-2 text-left">Long Apps</th>
                            <th className="px-4 py-2 text-left">Short Apps</th>
                            <th className="px-4 py-2 text-left">Availability</th>
                            <th className="px-4 py-2 text-left">Screening</th>
                            <th className="px-4 py-2 text-left">Assessment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.candidates.map((c) => (
                            <tr key={c._id} className="border-t dark:border-gray-800">
                              {period !== 'daily' && <td className="px-4 py-2">{formatDate(c.date)}</td>}
                              <td className="px-4 py-2 font-medium">{c.candidate?.name}</td>
                              <td className="px-4 py-2">{c.candidate?.jobRole}</td>
                              <td className="px-4 py-2">{c.longApp ?? 0}</td>
                              <td className="px-4 py-2">{c.shortApp ?? 0}</td>
                              <td className="px-4 py-2">{c.availability ?? 0}</td>
                              <td className="px-4 py-2">{c.screening ?? 0}</td>
                              <td className="px-4 py-2">{c.assessment ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
            {reports.length === 0 && (
              <p className="py-8 text-center text-gray-500">
                No reports found for {period === 'daily' ? 'today' : period === 'weekly' ? 'this week' : 'this month'}
              </p>
            )}
          </div>
        )}
        <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetch} />
      </Card>
    </div>
  );
}
