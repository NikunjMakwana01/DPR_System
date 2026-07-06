import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { settingsAPI } from '../../api/services';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useTheme } from '../../context/ThemeContext';
import { Clock, Wifi } from 'lucide-react';

export default function Settings() {
  const { setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [detectedIP, setDetectedIP] = useState('');
  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const workStartTime = watch('workStartTime');
  const lateMinutes = watch('lateMinutes');

  useEffect(() => {
    settingsAPI.get().then(({ data }) => reset(data.data)).catch(() => {});
    settingsAPI.getClientIP()
      .then(({ data }) => setDetectedIP(data.data?.clientIP || ''))
      .catch(() => {});
  }, [reset]);

  const getLateAfterTime = () => {
    if (!workStartTime) return '--:--';
    const [h, m] = workStartTime.split(':').map(Number);
    const total = h * 60 + m + (Number(lateMinutes) || 10);
    const lh = Math.floor(total / 60) % 24;
    const lm = total % 60;
    return `${String(lh).padStart(2, '0')}:${String(lm).padStart(2, '0')}`;
  };

  const useCurrentIP = () => {
    if (detectedIP) {
      setValue('officeIP', detectedIP);
      toast.success('Current IP filled in. Click Save to apply.');
    }
  };

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      await settingsAPI.update({
        ...formData,
        lateMinutes: Number(formData.lateMinutes),
      });
      setTheme(formData.theme);
      toast.success('Settings saved. Office IP updated immediately.');
    } catch { toast.error('Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-500">Configure system settings</p></div>

      <Card title="Company Settings">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
          <Input label="Company Name" {...register('companyName')} />

          <div>
            <Input
              label="Office WiFi IP Address"
              {...register('officeIP', { required: 'Office WiFi IP is required' })}
              placeholder="103.45.67.89 or 192.168.1.0/24"
            />
            <p className="mt-1 text-xs text-gray-500">
              Employees can only use the app on office WiFi. Admin can access from anywhere.
              Set your office public IP, or a subnet (e.g. 192.168.1.0/24) if the server runs on the local network.
            </p>
            {detectedIP && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                <Wifi className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800 dark:text-blue-300">
                  Your current IP: <strong>{detectedIP}</strong>
                </span>
                <Button type="button" size="sm" variant="outline" onClick={useCurrentIP}>
                  Use This IP
                </Button>
              </div>
            )}
          </div>

          <Select label="Default Theme" {...register('theme')}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
          <Button type="submit" loading={loading}>Save Company Settings</Button>
        </form>
      </Card>

      <Card title="Office Timing">
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Configure office hours and late attendance rules</span>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Work Start Time" type="time" {...register('workStartTime')} />
            <Input label="Work End Time" type="time" {...register('workEndTime')} />
          </div>
          <Input
            label="Late Grace Period (minutes)"
            type="number"
            min="0"
            {...register('lateMinutes')}
            placeholder="10"
          />
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Late Attendance Rule</p>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
              Employees checking in after <strong>{getLateAfterTime()}</strong> will be marked as <strong>Late</strong>.
            </p>
          </div>
          <Button type="submit" loading={loading}>Save Office Timing</Button>
        </form>
      </Card>
    </div>
  );
}
