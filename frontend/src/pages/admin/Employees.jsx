import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { employeeAPI } from '../../api/services';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { useForm } from 'react-hook-form';
import { Plus, Download, Eye, Check, X, Ban, Trash2, Key } from 'lucide-react';
import { DEPARTMENTS } from '../../utils/constants';
import { downloadBlob } from '../../utils/helpers';

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchEmployees = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await employeeAPI.getAll({ search, status, page, limit: 10 });
      setEmployees(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, [search, status]);

  const handleCreate = async (formData) => {
    try {
      await employeeAPI.create(formData);
      toast.success('Employee created');
      setShowCreate(false);
      reset();
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      await confirm.action();
      toast.success(confirm.successMsg);
      fetchEmployees(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await employeeAPI.export();
      downloadBlob(data, 'employees.csv');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <p className="text-gray-500">Manage employee accounts and approvals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" /> Export</Button>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add Employee</Button>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-col">
          <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Search employees..." /></div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-48">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>

        {loading ? <TableSkeleton /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Designation</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <p className="font-medium">{emp.fullName}</p>
                      <p className="text-xs text-gray-500">{emp.employeeId} · {emp.email}</p>
                    </td>
                    <td className="px-4 py-3">{emp.department}</td>
                    <td className="px-4 py-3">{emp.designation}</td>
                    <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/employees/${emp._id}`)}><Eye className="h-4 w-4" /></Button>
                        {emp.status === 'pending' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => setConfirm({ action: () => employeeAPI.approve(emp._id), successMsg: 'Approved', title: 'Approve Employee', message: `Approve ${emp.fullName}?` })}><Check className="h-4 w-4 text-green-600" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setConfirm({ action: () => employeeAPI.reject(emp._id), successMsg: 'Rejected', title: 'Reject Employee', message: `Reject ${emp.fullName}?` })}><X className="h-4 w-4 text-red-600" /></Button>
                          </>
                        )}
                        {emp.status === 'active' && (
                          <Button size="sm" variant="ghost" onClick={() => setConfirm({ action: () => employeeAPI.deactivate(emp._id), successMsg: 'Deactivated', title: 'Deactivate', message: `Deactivate ${emp.fullName}?` })}><Ban className="h-4 w-4" /></Button>
                        )}
                        {emp.status === 'inactive' && (
                          <Button size="sm" variant="ghost" onClick={() => setConfirm({ action: () => employeeAPI.activate(emp._id), successMsg: 'Activated', title: 'Activate', message: `Activate ${emp.fullName}?` })}><Check className="h-4 w-4 text-green-600" /></Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => {
                          const pwd = prompt('Enter new password (min 6 chars):');
                          if (pwd && pwd.length >= 6) employeeAPI.resetPassword(emp._id, { password: pwd }).then(() => toast.success('Password reset'));
                        }}><Key className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirm({ action: () => employeeAPI.delete(emp._id), successMsg: 'Deleted', title: 'Delete Employee', message: `Permanently delete ${emp.fullName}?` })}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchEmployees} />
      </Card>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Employee" size="lg"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={handleSubmit(handleCreate)}>Create</Button></div>}>
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full Name" {...register('fullName', { required: 'Required' })} error={errors.fullName?.message} className="sm:col-span-2" />
          <Input label="Employee ID" {...register('employeeId', { required: 'Required' })} error={errors.employeeId?.message} />
          <Input label="Email" type="email" {...register('email', { required: 'Required' })} error={errors.email?.message} />
          <Input label="Password" type="password" {...register('password', { required: 'Required', minLength: 6 })} error={errors.password?.message} />
          <Input label="Mobile" {...register('mobileNumber', { required: 'Required' })} error={errors.mobileNumber?.message} />
          <Select label="Department" {...register('department', { required: 'Required' })} error={errors.department?.message}>
            <option value="">Select</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Input label="Designation" {...register('designation', { required: 'Required' })} error={errors.designation?.message} className="sm:col-span-2" />
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!confirm} onClose={() => setConfirm(null)} onConfirm={handleAction}
        title={confirm?.title} message={confirm?.message} loading={actionLoading} />
    </div>
  );
}
