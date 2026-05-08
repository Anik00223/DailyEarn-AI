import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { PageWrapper } from './components/layout/PageWrapper';
import { Navbar } from './components/layout/Navbar';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import ParticleField from './components/three/ParticleField';
import { useAuthStore } from './store/authStore';
import api from './api/client';
import type { ApiResponse, RefreshResponse } from './types/api.types';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingFallback />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function LoadingFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px' }} />
        <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { setAuth, setLoading, logout } = useAuthStore();

  // Try silent refresh on app load (cookie-based)
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const { data } = await api.post<ApiResponse<RefreshResponse>>('/auth/refresh');
        if (data.success) {
          const meResponse = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${data.data.accessToken}` },
          });
          if (meResponse.data.success) {
            setAuth(meResponse.data.data, data.data.accessToken);
            return;
          }
        }
      } catch {
        // No valid refresh token — stay logged out
      }
      setLoading(false);
    };
    tryRefresh();
  }, [setAuth, setLoading, logout]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <PageWrapper>
          <ParticleField />
          <Navbar />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </PageWrapper>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
