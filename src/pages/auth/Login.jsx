import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authApi from '../../api/authApi';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const successMessage = location.state?.message;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await authApi.login(form);
      const data = response.data?.data || response.data;
      const token = data.accessToken || data.token;
      const user = data.user || data;

      if (!token || !user?.id) {
        throw new Error('Incomplete login response received from server.');
      }

      login(user, token);

      const redirectPath =
        location.state?.from?.pathname ||
        (['ADMIN', 'SUPER_ADMIN'].includes(user.role) ? '/admin/dashboard' : '/dashboard');

      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-headline font-bold text-xl shadow-sm">
              C
            </span>
            <span className="font-headline text-2xl font-semibold text-on-surface">CoWork Spot</span>
          </Link>
          <h1 className="font-headline text-2xl font-medium text-on-surface">Welcome Back</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Access your bookings and account management.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm space-y-4"
        >
          {successMessage && !error && (
            <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-green-600">check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            icon="mail"
            autoFocus
          />

          <Input
            label="Password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            icon="lock"
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" className="w-full justify-center" isLoading={submitting}>
              Sign In
            </Button>
          </div>

          <p className="text-xs text-center text-on-surface-variant pt-2">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
