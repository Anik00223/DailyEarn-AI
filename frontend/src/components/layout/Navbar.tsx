import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User, Sparkles } from 'lucide-react';
import api from '../../api/client';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    logout();
    navigate('/');
  };

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(5, 5, 8, 0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--accent-border)', padding: '0 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={20} /> DailyEarn AI
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} />{user?.name || user?.email}</span>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: '6px 12px' }}>
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Login</Link>
              <Link to="/register" style={{ fontSize: '0.85rem', fontFamily: 'var(--font-display)', background: 'var(--accent)', color: '#000', padding: '8px 20px', borderRadius: 50, fontWeight: 700, textDecoration: 'none' }}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
