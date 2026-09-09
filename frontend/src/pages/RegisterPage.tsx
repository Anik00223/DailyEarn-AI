import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import type { ApiResponse, AuthResponse } from '../types/api.types';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters').regex(/[A-Z]/, 'Need one uppercase').regex(/[0-9]/, 'Need one number'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
});
type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (formData: RegisterForm) => {
    setServerError('');
    try {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', formData);
      if (data.success) {
        setAuth(data.data.user, data.data.accessToken);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      console.error('[Registration failed]', err);
      const error = err as {
        message?: string;
        response?: {
          status?: number;
          data?: {
            message?: string;
            errors?: Array<{ field?: string; message?: string }>;
            code?: string;
          };
        };
      };

      let displayMsg = error.response?.data?.message;
      if (error.response?.data?.errors?.length) {
        displayMsg = error.response.data.errors
          .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message))
          .join(', ');
      } else if (!error.response && error.message) {
        displayMsg = `Network error: ${error.message}. Please verify the backend server is reachable at ${api.defaults.baseURL}`;
      }

      setServerError(displayMsg || 'Registration failed. Please try again.');
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 24px',
        position: 'relative',
      }}
    >
      <div
        className="product-card"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '40px 32px',
          borderRadius: 'var(--radius-md)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.74rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 10,
            }}
          >
            DailyEarn
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.65rem',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              margin: '0 0 8px',
            }}
          >
            Create your account
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Calibrate your profile to unlock verified local opportunities
          </p>
        </div>

        {serverError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              fontSize: '0.82rem',
              color: 'var(--danger)',
              marginBottom: 20,
              lineHeight: 1.4,
            }}
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginBottom: 6,
                fontFamily: 'var(--font-label)',
                letterSpacing: '0.04em',
              }}
            >
              Full name
            </label>
            <input
              {...register('name')}
              placeholder="e.g., Anik Das"
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
            {errors.name && (
              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 6, display: 'block' }}>
                {errors.name.message}
              </span>
            )}
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginBottom: 6,
                fontFamily: 'var(--font-label)',
                letterSpacing: '0.04em',
              }}
            >
              Email address
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@domain.com"
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
            {errors.email && (
              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 6, display: 'block' }}>
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginBottom: 6,
                fontFamily: 'var(--font-label)',
                letterSpacing: '0.04em',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                style={{
                  width: '100%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 42px 12px 14px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 6, display: 'block' }}>
                {errors.password.message}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                  fontFamily: 'var(--font-label)',
                  letterSpacing: '0.04em',
                }}
              >
                City
              </label>
              <input
                {...register('city')}
                placeholder="e.g., Silchar"
                style={{
                  width: '100%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              {errors.city && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 6, display: 'block' }}>
                  {errors.city.message}
                </span>
              )}
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                  fontFamily: 'var(--font-label)',
                  letterSpacing: '0.04em',
                }}
              >
                State
              </label>
              <input
                {...register('state')}
                placeholder="e.g., Assam"
                style={{
                  width: '100%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              {errors.state && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 6, display: 'block' }}>
                  {errors.state.message}
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: 6,
              padding: '12px',
              fontSize: '0.88rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--accent)',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Sign in →
          </Link>
        </div>
      </div>
    </main>
  );
}
