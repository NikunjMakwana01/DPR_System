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

const METRIC_LABELS = [
  { key: 'longApp', label: 'Long Apps' },
  { key: 'shortApp', label: 'Short Apps' },
  { key: 'availability', label: 'Availability' },
  { key: 'screening', label: 'Screening' },
  { key: 'assessment', label: 'Assessment' },
];

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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">DPR Reports</h1>
          <p className="text-sm text-gray-500 sm:text-base">{PERIOD_LABELS[period]} — grouped by employee</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={exportCSV}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={exportPDF}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PeriodFilter value={period} onChange={setPeriod} />
          <div className="w-full sm:max-w-xs sm:flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search employee or candidate..." />
          </div>
        </div>

        {loading ? <TableSkeleton /> : (
          <div className="space-y-3">
            {reports.map((group) => {
              const key = `${group.employee?._id}_${formatDate(group.date)}`;
              const isOpen = expanded[key];
              return (
                <div key={key} className="overflow-hidden rounded-lg border dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => toggleExpand(key)}
                    className="flex w-full flex-col gap-2 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                  >
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {group.employee?.fullName} ({group.employee?.employeeId})
                        </p>
                        <p className="text-xs text-gray-500 sm:text-sm">
                          {period === 'daily' ? formatDate(group.date) : `${group.candidates.length} report(s)`}
                          {' · '}{[...new Set(group.candidates.map((c) => c.candidate?.name))].length} candidate(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 pl-6 text-xs sm:pl-0 sm:gap-4 sm:text-sm">
                      {METRIC_LABELS.map(({ key: metricKey, label }) => (
                        <span key={metricKey}>
                          {label}: <strong>{group.totals[metricKey] ?? 0}</strong>
                        </span>
                      ))}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t dark:border-gray-700">
                      {/* Mobile: card list */}
                      <div className="space-y-2 p-3 sm:hidden">
                        {group.candidates.map((c) => (
                          <div key={c._id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                            {period !== 'daily' && (
                              <p className="text-xs text-gray-500">{formatDate(c.date)}</p>
                            )}
                            <p className="font-medium">{c.candidate?.name}</p>
                            <p className="text-xs text-gray-500">{c.candidate?.jobRole}</p>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                              {METRIC_LABELS.map(({ key: metricKey, label }) => (
                                <div key={metricKey}>
                                  <span className="text-gray-500">{label}</span>
                                  <p className="font-semibold">{c[metricKey] ?? 0}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop: table */}
                      <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              {period !== 'daily' && <th className="px-4 py-2 text-left">Date</th>}
                              <th className="px-4 py-2 text-left">Candidate</th>
                              <th className="px-4 py-2 text-left">Job Role</th>
                              {METRIC_LABELS.map(({ key: metricKey, label }) => (
                                <th key={metricKey} className="px-4 py-2 text-left">{label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {group.candidates.map((c) => (
                              <tr key={c._id} className="border-t dark:border-gray-800">
                                {period !== 'daily' && <td className="px-4 py-2">{formatDate(c.date)}</td>}
                                <td className="px-4 py-2 font-medium">{c.candidate?.name}</td>
                                <td className="px-4 py-2">{c.candidate?.jobRole}</td>
                                {METRIC_LABELS.map(({ key: metricKey }) => (
                                  <td key={metricKey} className="px-4 py-2">{c[metricKey] ?? 0}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {reports.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500 sm:text-base">
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
