import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../../api/authApi';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      };
      await authApi.register(payload);
      navigate('/login', { replace: true, state: { message: 'Account created successfully! Please sign in.' } });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to create your account.');
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
          <h1 className="font-headline text-2xl font-medium text-on-surface">Create Your Account</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Join our community to book desks, private suites, and meeting rooms.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm space-y-4"
        >
          {error && (
            <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Full Name"
            name="name"
            type="text"
            required
            placeholder="Jane Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            icon="person"
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="jane@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            icon="mail"
          />

          <Input
            label="Phone Number (Optional)"
            name="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            icon="phone"
          />

          <Input
            label="Password (min. 6 characters)"
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
              Create Account
            </Button>
          </div>

          <p className="text-xs text-center text-on-surface-variant pt-2">
            Already registered?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
