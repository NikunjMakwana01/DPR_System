import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
      <h1 className="text-8xl font-bold text-primary-600">404</h1>
      <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">Page not found</p>
      <Link to="/" className="mt-6"><Button><Home className="h-4 w-4" /> Go Home</Button></Link>
    </div>
  );
}
