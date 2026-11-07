import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  apiClient,
  TOKEN_STORAGE_KEY,
  ROLE_STORAGE_KEY,
  UserRole,
  extractRoleFromToken,
} from '../api/client';
import { Navbar } from '../components/Navbar';

type AuthMode = 'login' | 'register';

interface AuthResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  email?: string;
  role?: string;
  message?: string;
}

interface ApiErrorPayload {
  message?: string;
  error?: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ROLE_USER');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isLogin = mode === 'login';

  const toggleMode = (targetMode: AuthMode): void => {
    setMode(targetMode);
    setErrorMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';

    try {
      const payload =
        mode === 'register'
          ? { email: trimmedEmail, password, role: selectedRole }
          : { email: trimmedEmail, password };

      const response = await apiClient.post<AuthResponse | string>(endpoint, payload);

      const data = response.data;
      const extractedToken =
        typeof data === 'string'
          ? data
          : data.token ?? data.accessToken ?? data.jwt ?? '';

      if (!extractedToken) {
        setErrorMessage('Authentication succeeded, but no token was returned by the server.');
        return;
      }

      const responseRole =
        typeof data === 'object' && data.role
          ? data.role.startsWith('ROLE_')
            ? (data.role as UserRole)
            : (`ROLE_${data.role}` as UserRole)
          : null;

      const resolvedRole: UserRole =
        responseRole ?? extractRoleFromToken(extractedToken) ?? 'ROLE_USER';

      localStorage.setItem(TOKEN_STORAGE_KEY, extractedToken);
      localStorage.setItem(ROLE_STORAGE_KEY, resolvedRole);
      localStorage.setItem('user_email', trimmedEmail);

      if (resolvedRole === 'ROLE_ADMIN') {
        navigate('/admin-dashboard', { replace: true });
      } else {
        navigate('/member-dashboard', { replace: true });
      }
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorPayload>(error)) {
        const status = error.response?.status;
        const serverMessage =
          error.response?.data?.message || error.response?.data?.error;

        if (serverMessage) {
          setErrorMessage(serverMessage);
        } else if (status === 409) {
          setErrorMessage('Email already in use. Please sign in or use a different email.');
        } else if (status === 401 || status === 403) {
          setErrorMessage(
            isLogin
              ? 'Invalid credentials. Please check your email and password.'
              : 'Registration failed or endpoint is forbidden. Please restart the backend server.'
          );
        } else if (status === 400) {
          setErrorMessage(
            isLogin
              ? 'Invalid credentials.'
              : 'Email already in use or invalid registration details.'
          );
        } else {
          setErrorMessage(
            'Unable to reach the authentication server. Please verify the backend is running on port 8080.'
          );
        }
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="relative flex min-h-[calc(100vh-4.5rem)] flex-col items-center justify-center overflow-hidden px-4 py-12">
        {/* Ambient background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-rose-600/15 blur-3xl"
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 transition hover:text-white"
            >
              <span>← Back to Public Website</span>
            </Link>
            <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-300">
              RBAC Portal
            </span>
          </div>

          {/* Brand Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              PulseFit Portal
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              {isLogin
                ? 'Sign in to access your Member Portal or Admin Analytics'
                : 'Create your account to activate your membership or admin access'}
            </p>
          </div>

          {/* Auth Card */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            {/* Mode Toggle Tabs */}
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-950/90 p-1 ring-1 ring-slate-800">
              <button
                type="button"
                onClick={() => toggleMode('login')}
                className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                  isLogin
                    ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => toggleMode('register')}
                className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                  !isLogin
                    ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
              >
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-rose-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@pulsefit.gym"
                  className="mt-2 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Role selector when creating an account */}
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Account Role
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('ROLE_USER')}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                        selectedRole === 'ROLE_USER'
                          ? 'border-rose-500 bg-rose-500/15 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Gym Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('ROLE_ADMIN')}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                        selectedRole === 'ROLE_ADMIN'
                          ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Gym Admin
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-rose-600/25 transition hover:from-rose-500 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </form>

            {/* Footer Switch Link */}
            <div className="mt-6 border-t border-slate-800/80 pt-5 text-center text-sm text-slate-400">
              {isLogin ? (
                <>
                  Don&apos;t have a membership account?{' '}
                  <button
                    type="button"
                    onClick={() => toggleMode('register')}
                    className="font-semibold text-rose-400 transition hover:text-rose-300"
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => toggleMode('login')}
                    className="font-semibold text-rose-400 transition hover:text-rose-300"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
