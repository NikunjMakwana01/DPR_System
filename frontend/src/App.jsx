import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdminLayout, EmployeeLayout } from './routes/layouts';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import NotFound from './pages/common/NotFound';
import Unauthorized from './pages/common/Unauthorized';

import AdminDashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import EmployeeDetail from './pages/admin/EmployeeDetail';
import Candidates from './pages/admin/Candidates';
import Assignments from './pages/admin/Assignments';
import AdminAttendance from './pages/admin/Attendance';
import AdminReports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import Notifications from './pages/admin/Notifications';

import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeCandidates from './pages/employee/Candidates';
import EmployeeAttendance from './pages/employee/Attendance';
import SubmitDPR from './pages/employee/SubmitDPR';
import EmployeeReports from './pages/employee/Reports';
import EmployeeNotifications from './pages/employee/Notifications';
import Profile from './pages/employee/Profile';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/employees" element={<Employees />} />
              <Route path="/admin/employees/:id" element={<EmployeeDetail />} />
              <Route path="/admin/candidates" element={<Candidates />} />
              <Route path="/admin/assignments" element={<Assignments />} />
              <Route path="/admin/attendance" element={<AdminAttendance />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/notifications" element={<Notifications />} />
            </Route>

            <Route element={<EmployeeLayout />}>
              <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
              <Route path="/employee/candidates" element={<EmployeeCandidates />} />
              <Route path="/employee/attendance" element={<EmployeeAttendance />} />
              <Route path="/employee/dpr" element={<SubmitDPR />} />
              <Route path="/employee/reports" element={<EmployeeReports />} />
              <Route path="/employee/notifications" element={<EmployeeNotifications />} />
              <Route path="/employee/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
