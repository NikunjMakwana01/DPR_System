import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { candidateAPI } from '../../api/services';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { CANDIDATE_STATUSES } from '../../utils/constants';

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetch = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await candidateAPI.getAll({ search, page, limit: 10 });
      setCandidates(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [search]);

  const openCreate = () => { reset({ status: 'active' }); setModal('create'); };
  const openEdit = (c) => {
    Object.keys(c).forEach((k) => setValue(k, c[k]));
    setValue('_id', c._id);
    setModal('edit');
  };

  const onSubmit = async (formData) => {
    try {
      if (modal === 'edit') {
        const { _id, ...rest } = formData;
        await candidateAPI.update(_id, rest);
        toast.success('Updated');
      } else {
        const { _id, ...rest } = formData;
        await candidateAPI.create(rest);
        toast.success('Created');
      }
      setModal(null);
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div><h1 className="text-2xl font-bold">Candidates</h1><p className="text-gray-500">Manage recruitment candidates</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Candidate</Button>
      </div>

      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search candidates..." /></div>
        {loading ? <TableSkeleton /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Job Role</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Actions</th></tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c._id} className="border-b dark:border-gray-800">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.jobRole}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteId(c._id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetch} />
      </Card>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'edit' ? 'Edit Candidate' : 'Add Candidate'}
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button onClick={handleSubmit(onSubmit)}>Save</Button></div>}>
        <form className="space-y-4">
          <input type="hidden" {...register('_id')} />
          <Input label="Candidate Name" {...register('name', { required: 'Required' })} error={errors.name?.message} />
          <Input label="Job Role" {...register('jobRole', { required: 'Required' })} error={errors.jobRole?.message} />
          <Select label="Status" {...register('status')}>
            {CANDIDATE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input label="Remarks" {...register('remarks')} />
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        title="Delete Candidate" message="Are you sure? This will remove all assignments."
        onConfirm={async () => { await candidateAPI.delete(deleteId); toast.success('Deleted'); setDeleteId(null); fetch(); }} />
    </div>
  );
}
