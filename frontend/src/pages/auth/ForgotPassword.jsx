import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/services';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(data);
      setSent(true);
      toast.success('Request submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-900">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100">
            <KeyRound className="h-7 w-7 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-sm text-gray-500">Enter your email to request a password reset</p>
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              If an account exists, an admin has been notified to reset your password.
            </p>
            <Link to="/login" className="mt-4 inline-block text-primary-600 hover:underline">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />
            <Button type="submit" className="w-full" loading={loading}>Submit Request</Button>
            <Link to="/login" className="block text-center text-sm text-primary-600 hover:underline">Back to Login</Link>
          </form>
        )}
      </div>
    </div>
  );
}
