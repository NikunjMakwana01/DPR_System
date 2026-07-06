import { useEffect, useState } from 'react';
import { assignmentAPI } from '../../api/services';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';

export default function EmployeeCandidates() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assignmentAPI.getMy()
      .then(({ data }) => setAssignments(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">My Candidates</h1><p className="text-gray-500">Candidates assigned to you</p></div>

      <Card>
        {loading ? <TableSkeleton /> : assignments.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignments.map((a) => (
              <div key={a._id} className="rounded-xl border p-4 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{a.candidate?.name}</h3>
                    <p className="text-sm text-gray-500">{a.candidate?.jobRole}</p>
                  </div>
                  <StatusBadge status={a.candidate?.status} />
                </div>
                {a.candidate?.remarks && <p className="mt-2 text-xs text-gray-400">{a.candidate.remarks}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-gray-500">No candidates assigned yet</p>
        )}
      </Card>
    </div>
  );
}
