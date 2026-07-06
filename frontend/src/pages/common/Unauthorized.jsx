import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { ShieldX } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
      <ShieldX className="h-16 w-16 text-red-500" />
      <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
      <p className="mt-2 text-gray-500">You don't have permission to access this page.</p>
      <Link to="/" className="mt-6"><Button>Go to Dashboard</Button></Link>
    </div>
  );
}
