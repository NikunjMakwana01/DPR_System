import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/services';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { UserPlus } from 'lucide-react';
import { DEPARTMENTS } from '../../utils/constants';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authAPI.register(data);
      setSuccess(true);
      toast.success('Registration submitted! Await admin approval.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <UserPlus className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Registration Submitted</h2>
          <p className="mt-2 text-gray-500">Your account is pending admin approval. You'll be notified once approved.</p>
          <Link to="/login" className="mt-6 inline-block text-primary-600 hover:underline">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-900">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Employee Registration</h1>
          <p className="text-sm text-gray-500">Create your account to get started</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full Name" {...register('fullName', { required: 'Required' })} error={errors.fullName?.message} className="sm:col-span-2" />
          <Input label="Employee ID" {...register('employeeId', { required: 'Required' })} error={errors.employeeId?.message} />
          <Input label="Email" type="email" {...register('email', { required: 'Required' })} error={errors.email?.message} />
          <Input label="Password" type="password" {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} error={errors.password?.message} />
          <Input label="Mobile Number" {...register('mobileNumber', { required: 'Required' })} error={errors.mobileNumber?.message} />
          <Select label="Department" {...register('department', { required: 'Required' })} error={errors.department?.message}>
            <option value="">Select department</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Input label="Designation" {...register('designation', { required: 'Required' })} error={errors.designation?.message} className="sm:col-span-2" />
          <Button type="submit" className="sm:col-span-2" loading={loading}>Register</Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-primary-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
