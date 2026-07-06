import clsx from 'clsx';

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function PeriodFilter({ value, onChange, className }) {
  return (
    <div className={clsx('flex w-full rounded-lg border dark:border-gray-700 sm:w-auto', className)}>
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={clsx(
            'flex-1 px-3 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg sm:flex-none sm:px-4',
            value === p.value
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export const PERIOD_LABELS = {
  daily: "Today's Reports",
  weekly: "This Week's Reports",
  monthly: "This Month's Reports",
};
