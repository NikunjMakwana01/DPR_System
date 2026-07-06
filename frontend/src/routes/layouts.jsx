import ProtectedRoute from '../routes/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

export function AdminLayout() {
  return (
    <ProtectedRoute roles={['admin']}>
      <DashboardLayout />
    </ProtectedRoute>
  );
}

export function EmployeeLayout() {
  return (
    <ProtectedRoute roles={['employee']}>
      <DashboardLayout />
    </ProtectedRoute>
  );
}
