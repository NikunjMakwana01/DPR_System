import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { dprAPI, attendanceAPI } from '../../api/services';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function SubmitDPR() {
  const [candidates, setCandidates] = useState([]);
  const [dprStatus, setDprStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = async () => {
    const { data } = await attendanceAPI.getToday();
    const status = data.data?.dprStatus;
    setDprStatus(status);
    setCandidates(status?.assignedCandidates || []);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      await dprAPI.submit({
        candidate: formData.candidate,
        longApp: Number(formData.longApp) || 0,
        shortApp: Number(formData.shortApp) || 0,
        availability: Number(formData.availability) || 0,
        screening: Number(formData.screening) || 0,
        assessment: Number(formData.assessment) || 0,
        remarks: formData.remarks || '',
      });
      toast.success('DPR submitted successfully!');
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const submittedIds =
    dprStatus?.submittedReports?.map((r) => (r.candidate?._id || r.candidate)?.toString()) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Submit Daily Progress Report</h1>
        <p className="text-gray-500">Submit DPR for all assigned candidates before ending work</p>
      </div>

      {dprStatus && dprStatus.totalAssigned > 0 && (
        <Card>
          <div className={`flex items-center gap-3 ${dprStatus.allSubmitted ? 'text-green-600' : 'text-yellow-600'}`}>
            {dprStatus.allSubmitted ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <p className="font-medium">
              Progress: {dprStatus.totalSubmitted}/{dprStatus.totalAssigned} candidates submitted today
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {candidates.map((c) => {
              const done = submittedIds.includes(c._id?.toString());
              return (
                <span
                  key={c._id}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${done ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}
                >
                  {c.name} {done ? '✓' : '(pending)'}
                </span>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        {candidates.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No candidates assigned. Contact your admin.</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg space-y-4">
            <Select label="Candidate" {...register('candidate', { required: 'Select a candidate' })} error={errors.candidate?.message}>
              <option value="">Select candidate</option>
              {candidates.map((c) => {
                const done = submittedIds.includes(c._id?.toString());
                return (
                  <option key={c._id} value={c._id} disabled={done}>
                    {c.name} — {c.jobRole} {done ? '(submitted)' : ''}
                  </option>
                );
              })}
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Long App." type="number" min="0" {...register('longApp')} />
              <Input label="Short App." type="number" min="0" {...register('shortApp')} />
              <Input label="Availability" type="number" min="0" {...register('availability')} />
              <Input label="Screening" type="number" min="0" {...register('screening')} />
              <Input label="Assessment" type="number" min="0" {...register('assessment')} className="col-span-2" />
            </div>
            <Input label="Remarks" {...register('remarks')} />
            <Button type="submit" loading={loading} className="w-full">Submit Report</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
