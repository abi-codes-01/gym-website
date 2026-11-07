import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { apiClient, TOKEN_STORAGE_KEY } from '../api/client';

interface MembershipStatusResponse {
  status: string | null;
  endDate: string | null;
}

interface CreateOrderResponse {
  id?: string;
  order_id?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  key?: string;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

// Replace with your Razorpay Test Key ID or set VITE_RAZORPAY_KEY_ID in .env
const RAZORPAY_TEST_KEY_ID =
  import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';

const MemberDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [userEmail, setUserEmail] = useState<string>('member@pulsefit.gym');
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  const handleLogout = useCallback((): void => {
    localStorage.clear();
    navigate('/member-login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      navigate('/member-login', { replace: true });
      return;
    }

    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail) {
      setUserEmail(savedEmail);
    }
  }, [token, navigate]);

  const {
    data: membershipData,
    isLoading: isStatusLoading,
    refetch: refetchStatus,
  } = useQuery<MembershipStatusResponse>({
    queryKey: ['memberStatus'],
    queryFn: async () => {
      const response = await apiClient.get<MembershipStatusResponse>(
        '/member/status'
      );
      return response.data;
    },
    enabled: Boolean(token),
  });

  const currentStatus = membershipData?.status || 'Inactive';
  const isActive = currentStatus.toUpperCase() === 'ACTIVE';
  const formattedEndDate = membershipData?.endDate
    ? new Date(membershipData.endDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const handleSubscribeClick = async (): Promise<void> => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsCreatingOrder(true);

    try {
      // 1. Explicitly await backend order creation before constructing Razorpay options
      const response = await apiClient.post<CreateOrderResponse>(
        '/payment/create-order',
        { amount: 1999 }
      );
      console.log('Backend Order Response:', response);

      // 2. Extract the Razorpay-generated order_id from the response
      const orderId =
        response.data?.order_id ||
        response.data?.id ||
        response.data?.orderId;

      if (!orderId) {
        console.error('Missing order_id in Backend Order Response:', response.data);
        setErrorMessage(
          'Backend did not return a valid Razorpay order_id. Check backend logs.'
        );
        return;
      }

      if (!window.Razorpay) {
        setErrorMessage(
          'Razorpay SDK is not loaded. Ensure checkout.js is reachable.'
        );
        return;
      }

      const activeKey =
        response.data?.key && !response.data.key.includes('placeholder')
          ? response.data.key
          : RAZORPAY_TEST_KEY_ID;

      // 3. Construct Razorpay options with the real order_id and Test Key ID
      const options: RazorpayOptions = {
        key: activeKey,
        order_id: orderId,
        name: 'PulseFit Studio',
        description: 'Pro Transformation Membership (₹1,999/month)',
        amount: response.data?.amount ?? 199900,
        currency: response.data?.currency ?? 'INR',
        prefill: {
          email: userEmail,
          contact: '9876543210',
        },
        theme: {
          color: '#e11d48',
        },
        handler: async function (paymentResponse: RazorpayPaymentResponse) {
          console.log('Razorpay Payment Success:', paymentResponse);
          await apiClient.post('/payment/verify', {
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_order_id: paymentResponse.razorpay_order_id || orderId,
            planName: 'Pro Transformation',
          });
          setSuccessMessage(
            `Payment Successful! ID: ${paymentResponse.razorpay_payment_id}`
          );
          await refetchStatus();
        },
      };

      console.log('Launching Razorpay with options:', options);

      // 4. Open Razorpay Checkout Modal
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failureResponse: unknown) => {
        console.error('Razorpay Payment Failed:', failureResponse);
      });
      rzp.open();
    } catch (error: unknown) {
      console.error('Error creating Razorpay order:', error);
      if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
        const backendError =
          error.response?.data?.message || error.response?.data?.error;
        setErrorMessage(
          backendError ||
            'Failed to create Razorpay order. Verify your Razorpay Test Key ID and Secret in application.yml.'
        );
      } else {
        setErrorMessage('An unexpected error occurred while creating your order.');
      }
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-orange-500 text-white">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">
                Pulse<span className="text-rose-500">Fit</span>
              </span>
              <span className="ml-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-bold uppercase text-rose-300">
                ROLE_USER • Member Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-xs font-bold uppercase tracking-wider text-slate-400 transition hover:text-white"
            >
              ← Public Website
            </Link>
            <span className="hidden text-sm text-slate-400 md:inline-block">
              {userEmail}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            Member Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Access your training blueprint, digital turnstile QR pass, and Razorpay billing.
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            role="status"
            className="mb-6 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          >
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="ml-4 text-xs font-semibold uppercase tracking-wider opacity-75 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="ml-4 text-xs font-semibold uppercase tracking-wider opacity-75 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Current Membership Status & QR Entry Card */}
          <section className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-xl lg:col-span-2">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Current Membership Status
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-sm font-semibold ${
                      isActive
                        ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                        : 'border border-amber-500/30 bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isActive ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                      }`}
                    />
                    {isStatusLoading ? 'Checking...' : currentStatus}
                  </span>
                  <span className="text-lg font-bold text-white">
                    {isActive ? 'Pro Transformation' : 'Free Tier'}
                  </span>
                </div>
              </div>

              {formattedEndDate && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-left sm:text-right">
                  <p className="text-xs text-slate-400">Valid Until</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {formattedEndDate}
                  </p>
                </div>
              )}
            </div>

            {/* Training Plan & QR Code Pass */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/50 p-4">
                <p className="text-xs text-slate-400">Training Plan</p>
                <p className="mt-1 text-sm font-bold text-white">
                  {isActive ? '5-Day Hypertrophy + HIIT' : 'Starter Assessment'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/50 p-4">
                <p className="text-xs text-slate-400">Gym Floor Access</p>
                <p className="mt-1 text-sm font-bold text-white">
                  {isActive ? '24/7 Biometric + QR' : 'Locked'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/50 p-4">
                <p className="text-xs text-slate-400">Turnstile QR Pass</p>
                <p className="mt-1 font-mono text-xs font-semibold text-rose-400">
                  PF-{userEmail.slice(0, 6).toUpperCase()}-24X7
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-sm text-slate-400">
              {isActive ? (
                <p>
                  Your <span className="font-medium text-white">Pro Transformation</span>{' '}
                  membership is active. Scan your digital QR pass at the PulseFit turnstile.
                </p>
              ) : (
                <p>
                  Your membership status is{' '}
                  <span className="font-medium text-amber-300">{currentStatus}</span>.
                  Activate your plan via Razorpay to unlock 24/7 gym floor access, custom
                  training plans, and turnstile QR entry.
                </p>
              )}
            </div>
          </section>

          {/* Upgrade / Subscribe CTA Card */}
          <section className="flex flex-col justify-between rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-950/30 via-slate-900 to-slate-900 p-6 shadow-xl">
            <div>
              <div className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold uppercase text-rose-300">
                Most Popular
              </div>
              <h2 className="mt-4 text-xl font-black uppercase text-white">
                Pro Transformation
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Full access to all equipment, HIIT turf classes, and coaching sessions.
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tight text-white">
                  ₹1,999
                </span>
                <span className="text-sm font-medium text-slate-400">/month</span>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2.5">
                  <span className="text-rose-500">✓</span>
                  <span>Unlimited 24/7 gym floor &amp; sprint turf access</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-rose-500">✓</span>
                  <span>Digital QR code turnstile pass</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-rose-500">✓</span>
                  <span>Instant Razorpay activation</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={handleSubscribeClick}
                disabled={isCreatingOrder}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-rose-600/30 transition hover:from-rose-500 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingOrder
                  ? 'Loading...'
                  : 'Subscribe via Razorpay - ₹1,999/month'}
              </button>
              <p className="mt-2.5 text-center text-xs text-slate-500">
                Secured by Razorpay Checkout
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default MemberDashboard;
