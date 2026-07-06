import { useEffect, useState } from 'react';
import { dprAPI } from '../../api/services';
import Card from '../../components/ui/Card';
import PeriodFilter, { PERIOD_LABELS } from '../../components/ui/PeriodFilter';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { formatDate } from '../../utils/helpers';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function EmployeeReports() {
  const [reports, setReports] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    setLoading(true);
    setExpanded({});
    dprAPI.getMy({ period })
      .then(({ data }) => setReports(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const grouped = reports.reduce((acc, r) => {
    const dateKey = formatDate(r.date);
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: r.date,
        candidates: [],
        totals: { longApp: 0, shortApp: 0, availability: 0, screening: 0, assessment: 0 },
      };
    }
    acc[dateKey].candidates.push(r);
    acc[dateKey].totals.longApp += r.longApp ?? 0;
    acc[dateKey].totals.shortApp += r.shortApp ?? 0;
    acc[dateKey].totals.availability += r.availability ?? 0;
    acc[dateKey].totals.screening += r.screening ?? 0;
    acc[dateKey].totals.assessment += r.assessment ?? 0;
    return acc;
  }, {});

  const groups = Object.values(grouped);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">My Reports</h1>
          <p className="text-sm text-gray-500 sm:text-base">{PERIOD_LABELS[period]}</p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <Card>
        {loading ? <TableSkeleton /> : groups.length ? (
            <div className="space-y-3">
              {groups.map((group) => {
                const key = formatDate(group.date);
                const isOpen = expanded[key] ?? period === 'daily';
                return (
                  <div key={key} className="overflow-hidden rounded-lg border dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setExpanded((p) => ({ ...p, [key]: !isOpen }))}
                      className="flex w-full flex-col gap-2 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                    >
                      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{period === 'daily' ? 'Today' : key}</p>
                          <p className="text-xs text-gray-500 sm:text-sm">{group.candidates.length} candidate(s)</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 pl-6 text-xs sm:pl-0 sm:text-sm">
                        <span>Long Apps: <strong>{group.totals.longApp}</strong></span>
                        <span>Short Apps: <strong>{group.totals.shortApp}</strong></span>
                        <span>Availability: <strong>{group.totals.availability}</strong></span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t dark:border-gray-700">
                        {/* Mobile: card list */}
                        <div className="space-y-2 p-3 sm:hidden">
                          {group.candidates.map((r) => (
                            <div key={r._id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                              <p className="font-medium">{r.candidate?.name}</p>
                              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                                <div><span className="text-gray-500">Long Apps</span><p className="font-semibold">{r.longApp ?? 0}</p></div>
                                <div><span className="text-gray-500">Short Apps</span><p className="font-semibold">{r.shortApp ?? 0}</p></div>
                                <div><span className="text-gray-500">Availability</span><p className="font-semibold">{r.availability ?? 0}</p></div>
                                <div><span className="text-gray-500">Screening</span><p className="font-semibold">{r.screening ?? 0}</p></div>
                                <div><span className="text-gray-500">Assessment</span><p className="font-semibold">{r.assessment ?? 0}</p></div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop: table */}
                        <div className="hidden overflow-x-auto sm:block">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th className="px-4 py-2 text-left">Candidate</th>
                                <th className="px-4 py-2 text-left">Long Applications</th>
                                <th className="px-4 py-2 text-left">Short Applications</th>
                                <th className="px-4 py-2 text-left">Availability</th>
                                <th className="px-4 py-2 text-left">Screening</th>
                                <th className="px-4 py-2 text-left">Assessment</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.candidates.map((r) => (
                                <tr key={r._id} className="border-t dark:border-gray-800">
                                  <td className="px-4 py-2 font-medium">{r.candidate?.name}</td>
                                  <td className="px-4 py-2">{r.longApp ?? 0}</td>
                                  <td className="px-4 py-2">{r.shortApp ?? 0}</td>
                                  <td className="px-4 py-2">{r.availability ?? 0}</td>
                                  <td className="px-4 py-2">{r.screening ?? 0}</td>
                                  <td className="px-4 py-2">{r.assessment ?? 0}</td>
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
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500 sm:text-base">
              No reports found for {period === 'daily' ? 'today' : period === 'weekly' ? 'this week' : 'this month'}
            </p>
          )}
      </Card>
    </div>
  );
}
