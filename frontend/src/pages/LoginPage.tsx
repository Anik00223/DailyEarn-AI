import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import type { ApiResponse, AuthResponse } from '../types/api.types';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (formData: LoginForm) => {
    setServerError('');
    try {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', formData);
      if (data.success) {
        setAuth(data.data.user, data.data.accessToken);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setServerError(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="glass" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', textAlign: 'center', marginBottom: 8 }}>Welcome Back</h1>
        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 32 }}>Log in to generate income ideas</p>
        {serverError && <div style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.85rem', color: 'var(--danger)', marginBottom: 20 }}>{serverError}</div>}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'var(--font-label)' }}>Email</label>
            <input {...register('email')} type="email" placeholder="you@example.com" style={{ width: '100%' }} />
            {errors.email && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 4, display: 'block' }}>{errors.email.message}</span>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'var(--font-label)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" style={{ width: '100%', paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 4, display: 'block' }}>{errors.password.message}</span>}
          </div>
          <button type="submit" disabled={isSubmitting} style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: isSubmitting ? 'var(--bg-elevated)' : 'var(--accent)', color: isSubmitting ? 'var(--text-muted)' : '#000', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', marginTop: 8 }}>
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent)' }}>Sign up</Link>
        </p>
      </div>
    </main>
  );
}
