import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { assignmentAPI, employeeAPI, candidateAPI } from '../../api/services';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { Plus, Trash2, UserCheck } from 'lucide-react';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [focusedEmployeeId, setFocusedEmployeeId] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [removeId, setRemoveId] = useState(null);

  const fetch = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await assignmentAPI.getAll({ page, limit: 15 });
      setAssignments(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const getAssignedCandidateIds = (empId, assignmentList = allAssignments) => {
    if (!empId) return [];
    return assignmentList
      .filter((a) => {
        const id = a.employee?._id || a.employee;
        return id?.toString() === empId.toString();
      })
      .map((a) => (a.candidate?._id || a.candidate)?.toString())
      .filter(Boolean);
  };

  const openModal = async () => {
    const [empRes, candRes, assignRes] = await Promise.all([
      employeeAPI.getAll({ status: 'active', limit: 100 }),
      candidateAPI.getAll({ limit: 100 }),
      assignmentAPI.getAll({ limit: 500 }),
    ]);
    const empList = empRes.data.data;
    const assignList = assignRes.data.data;

    setEmployees(empList);
    setCandidates(candRes.data.data);
    setAllAssignments(assignList);

    const firstEmp = empList[0];
    if (firstEmp) {
      setFocusedEmployeeId(firstEmp._id);
      setSelectedCandidates(getAssignedCandidateIds(firstEmp._id, assignList));
    } else {
      setFocusedEmployeeId(null);
      setSelectedCandidates([]);
    }

    setShowModal(true);
  };

  const handleEmployeeClick = (empId) => {
    setFocusedEmployeeId(empId);
    setSelectedCandidates(getAssignedCandidateIds(empId));
  };

  const toggleCandidate = (candidateId) => {
    const id = candidateId.toString();
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!focusedEmployeeId) {
      toast.error('Select an employee first');
      return;
    }

    setSaving(true);
    try {
      const { data } = await assignmentAPI.sync({
        employeeId: focusedEmployeeId,
        candidateIds: selectedCandidates,
      });
      const { added, removed } = data.data;
      toast.success(
        removed > 0 && added > 0
          ? `Updated: ${added} added, ${removed} removed`
          : removed > 0
            ? `${removed} candidate(s) unassigned`
            : added > 0
              ? `${added} candidate(s) assigned`
              : 'No changes made'
      );
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const getAssignedForEmployee = (empId) => {
    if (!empId) return [];
    return allAssignments.filter((a) => {
      const id = a.employee?._id || a.employee;
      return id?.toString() === empId.toString();
    });
  };

  const focusedEmployee = employees.find((e) => e._id === focusedEmployeeId);
  const focusedAssignments = getAssignedForEmployee(focusedEmployeeId);
  const originallyAssignedIds = getAssignedCandidateIds(focusedEmployeeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-gray-500">Assign or remove candidates per employee</p>
        </div>
        <Button onClick={openModal} className="w-full sm:w-auto"><Plus className="h-4 w-4" /> Manage Assignments</Button>
      </div>

      <Card>
        {loading ? <TableSkeleton /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">Candidate</th>
                  <th className="px-4 py-3 text-left">Job Role</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a._id} className="border-b dark:border-gray-800">
                    <td className="px-4 py-3">{a.employee?.fullName} ({a.employee?.employeeId})</td>
                    <td className="px-4 py-3">{a.candidate?.name}</td>
                    <td className="px-4 py-3">{a.candidate?.jobRole}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => setRemoveId(a._id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetch} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Manage Assignments"
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Assignments</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 font-medium">Select Employee</h3>
            <p className="mb-2 text-xs text-gray-500">
              Click an employee — their assigned candidates will be checked
            </p>
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border p-2 dark:border-gray-700">
              {employees.map((e) => {
                const isFocused = focusedEmployeeId === e._id;
                const assignedCount = getAssignedForEmployee(e._id).length;
                return (
                  <button
                    key={e._id}
                    type="button"
                    className={clsx(
                      'flex w-full items-center gap-2 rounded p-2 text-left transition-colors',
                      isFocused
                        ? 'bg-primary-50 ring-1 ring-primary-500 dark:bg-primary-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                    onClick={() => handleEmployeeClick(e._id)}
                  >
                    <UserCheck className={clsx('h-4 w-4 shrink-0', isFocused ? 'text-primary-600' : 'text-gray-400')} />
                    <span className="flex-1 text-sm">
                      {e.fullName} ({e.employeeId})
                      {assignedCount > 0 && (
                        <span className="ml-1 text-xs text-gray-500">· {assignedCount} assigned</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {focusedEmployee && (
              <div className="mt-4 rounded-lg border border-primary-200 bg-primary-50/50 p-3 dark:border-primary-800 dark:bg-primary-900/10">
                <p className="mb-2 text-sm font-semibold text-primary-800 dark:text-primary-300">
                  {focusedEmployee.fullName}'s current assignments
                </p>
                {focusedAssignments.length > 0 ? (
                  <ul className="space-y-1">
                    {focusedAssignments.map((a) => (
                      <li key={a._id} className="text-sm text-gray-700 dark:text-gray-300">
                        • {a.candidate?.name} — {a.candidate?.jobRole}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No candidates assigned yet</p>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 font-medium">Candidates</h3>
            <p className="mb-2 text-xs text-gray-500">
              Checked = assigned. Uncheck to remove from this employee, then assign to another.
            </p>
            <div className="max-h-80 space-y-1 overflow-y-auto rounded-lg border p-2 dark:border-gray-700">
              {candidates.map((c) => {
                const candId = c._id.toString();
                const isChecked = selectedCandidates.includes(candId);
                const wasAssigned = originallyAssignedIds.includes(candId);
                const willRemove = wasAssigned && !isChecked;
                const willAdd = !wasAssigned && isChecked;

                return (
                  <label
                    key={c._id}
                    className={clsx(
                      'flex cursor-pointer items-center gap-2 rounded p-2',
                      willRemove && 'bg-red-50 dark:bg-red-900/10',
                      willAdd && 'bg-green-50 dark:bg-green-900/10',
                      isChecked && wasAssigned && 'bg-primary-50/50 dark:bg-primary-900/10',
                      !willRemove && !willAdd && !isChecked && 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCandidate(candId)}
                    />
                    <span className="flex-1 text-sm">
                      {c.name} — {c.jobRole}
                      {wasAssigned && isChecked && (
                        <span className="ml-1 text-xs text-primary-600 dark:text-primary-400">(assigned)</span>
                      )}
                      {willRemove && (
                        <span className="ml-1 text-xs font-medium text-red-600 dark:text-red-400">(will remove)</span>
                      )}
                      {willAdd && (
                        <span className="ml-1 text-xs font-medium text-green-600 dark:text-green-400">(will add)</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!removeId}
        onClose={() => setRemoveId(null)}
        title="Remove Assignment"
        message="Remove this assignment? The employee will no longer see this candidate."
        onConfirm={async () => {
          await assignmentAPI.remove(removeId);
          toast.success('Assignment removed');
          setRemoveId(null);
          fetch();
        }}
      />
    </div>
  );
}
