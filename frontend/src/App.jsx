import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Pages
import LoginPage        from './pages/LoginPage';
import RaisLayout       from './components/layout/RaisLayout';
import HokimLayout      from './components/layout/HokimLayout';
import AdminLayout      from './components/layout/AdminLayout';

// Rais pages
import RaisChatPage     from './pages/rais/ChatPage';
import RaisEmergency    from './pages/rais/EmergencyPage';

// Hokim pages
import HokimDashboard   from './pages/hokim/DashboardPage';
import HokimAllChats    from './pages/hokim/AllChatsPage';
import HokimChat        from './pages/hokim/ChatDetailPage';
import HokimEmergency   from './pages/hokim/EmergencyPage';
import HokimAnalytics   from './pages/hokim/AnalyticsPage';

// Admin pages
import AdminUsers       from './pages/admin/UsersPage';
import AdminMahallas    from './pages/admin/MahallasPage';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  const routes = {
    super_admin: '/admin/users',
    hokim:       '/hokim/dashboard',
    uyushma:     '/rais/chat',
    rais:        '/rais/chat',
  };
  return <Navigate to={routes[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/"      element={<HomeRedirect />} />

        {/* RAIS & UYUSHMA */}
        <Route path="/rais" element={
          <ProtectedRoute roles={['rais','uyushma']}>
            <RaisLayout />
          </ProtectedRoute>
        }>
          <Route path="chat"      element={<RaisChatPage />} />
          <Route path="emergency" element={<RaisEmergency />} />
          <Route index element={<Navigate to="chat" replace />} />
        </Route>

        {/* HOKIM */}
        <Route path="/hokim" element={
          <ProtectedRoute roles={['hokim']}>
            <HokimLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<HokimDashboard />} />
          <Route path="chats"     element={<HokimAllChats />} />
          <Route path="chat/:userId" element={<HokimChat />} />
          <Route path="emergency" element={<HokimEmergency />} />
          <Route path="analytics" element={<HokimAnalytics />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* SUPER ADMIN */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['super_admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="users"    element={<AdminUsers />} />
          <Route path="mahallas" element={<AdminMahallas />} />
          <Route index element={<Navigate to="users" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
