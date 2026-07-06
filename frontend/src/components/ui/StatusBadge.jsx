import clsx from 'clsx';
import { STATUS_COLORS } from '../../utils/constants';

export default function StatusBadge({ status }) {
  return (
    <span className={clsx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_COLORS[status] || STATUS_COLORS.inactive)}>
      {status}
    </span>
  );
}
