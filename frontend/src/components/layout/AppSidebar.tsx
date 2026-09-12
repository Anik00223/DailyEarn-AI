import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Calculator,
  CalendarCheck,
  ShieldCheck,
  BarChart3,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useDecisionStore } from '../../store/decisionStore';
import api from '../../api/client';

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { decision, setTrustCenterOpen, setSimulatorOpp, setActivePlan } = useDecisionStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    logout();
    navigate('/');
  };

  const handleSimulatorClick = () => {
    if (decision && decision.recommendations.length > 0) {
      setSimulatorOpp(decision.recommendations[0]);
    } else {
      navigate('/dashboard');
    }
  };

  const handlePlanClick = () => {
    if (decision && decision.primary7DayPlan) {
      setActivePlan(decision.primary7DayPlan);
    } else {
      navigate('/dashboard');
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: location.pathname === '/dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      id: 'opportunities',
      label: 'Opportunities',
      icon: Compass,
      active: location.hash === '#opportunities',
      onClick: () => {
        if (location.pathname !== '/dashboard') {
          navigate('/dashboard#opportunities');
        } else {
          document.getElementById('opportunities')?.scrollIntoView({ behavior: 'smooth' });
        }
      },
    },
    {
      id: 'simulator',
      label: 'Simulator',
      icon: Calculator,
      active: false,
      onClick: handleSimulatorClick,
    },
    {
      id: 'plan',
      label: '7-Day Plan',
      icon: CalendarCheck,
      active: false,
      onClick: handlePlanClick,
    },
    {
      id: 'trust',
      label: 'Trust Center',
      icon: ShieldCheck,
      active: false,
      onClick: () => setTrustCenterOpen(true),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      active: location.pathname === '/analytics',
      onClick: () => navigate('/analytics'),
    },
  ];

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      {/* DESKTOP SIDEBAR (>= 768px) */}
      <aside
        className="app-sidebar-rail desktop-sidebar"
        aria-label="Application navigation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 64,
          background: '#0E141C',
          borderRight: '1px solid #263543',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0',
          zIndex: 90,
        }}
      >
        {/* Top: Brand Glyph */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <Link
            to="/"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(0, 180, 216, 0.12)',
              border: '1px solid rgba(0, 180, 216, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00F2FE',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
            }}
            title="DailyEarn AI Home"
          >
            DE
          </Link>

          {/* Navigation Items List */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className={`app-sidebar-nav-btn ${item.active ? 'active' : ''}`}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon size={19} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: User Avatar & Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid #263543',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F1F5F9',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
            title={user?.email || 'Authenticated User'}
          >
            {userInitial}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            title="Log Out"
            aria-label="Log Out"
            onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM DOCK (< 768px) */}
      <nav
        className="mobile-bottom-dock"
        aria-label="Mobile navigation"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: 'rgba(14, 20, 28, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid #263543',
          zIndex: 100,
          padding: '0 8px',
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                color: item.active ? '#00F2FE' : 'var(--text-muted)',
                fontSize: '0.64rem',
                padding: '4px 6px',
                minWidth: 44,
              }}
              aria-label={item.label}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Responsive Visibility Styles */}
      <style>{`
        @media (max-width: 767px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-bottom-dock {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
