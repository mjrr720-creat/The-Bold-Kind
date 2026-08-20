'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      if (data.session) {
        router.replace('/');
        return;
      }

      setChecking(false);
    });

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (error) {
      setError(
        error.message ===
          'Invalid login credentials'
          ? 'Incorrect email or password.'
          : error.message
      );

      setLoading(false);
      return;
    }

    router.replace('/');
    router.refresh();
  };

  if (checking) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#F4F2F0]">
        <div className="flex items-center gap-3 text-sm text-[#777]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#F36A21]/30 border-t-[#F36A21]" />
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen items-center justify-center overflow-hidden bg-[#F4F2F0] p-3 sm:p-4 lg:p-6">
      <div className="flex h-[calc(100vh-24px)] w-full max-w-[1450px] overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_25px_80px_rgba(30,25,20,0.12)] sm:h-[calc(100vh-32px)] lg:h-[calc(100vh-48px)] lg:rounded-[28px]">

        {/* ================= LEFT SIDE ================= */}
        <section className="flex w-full items-center justify-center overflow-y-auto bg-[#FCFBFA] px-6 py-8 lg:w-1/2 lg:overflow-hidden lg:px-12 xl:px-20">
          <div className="w-full max-w-[400px]">

            {/* Brand */}
            <div className="mb-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F36A21] shadow-[0_8px_20px_rgba(243,106,33,0.22)]">
                  <span className="text-base font-bold text-white">
                    TB
                  </span>
                </div>

                <div>
                  <p className="text-[13px] font-bold tracking-[-0.02em] text-[#1D2433]">
                    THE BOLD KIND
                  </p>

                  <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-[#9A938D]">
                    Analytics Platform
                  </p>
                </div>
              </div>

              <h1 className="text-[34px] font-semibold tracking-[-0.04em] text-[#202632] sm:text-[38px]">
                Welcome Back
              </h1>

              <p className="mt-2 text-sm text-[#817B76]">
                Sign in to access your restaurant analytics dashboard
              </p>
            </div>

            {/* Login Form */}
            <form
              onSubmit={handleLogin}
              className="space-y-4"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[13px] font-medium text-[#55504C]"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email address"
                  disabled={loading}
                  className="h-[48px] w-full rounded-xl border border-[#E4DFDB] bg-white px-4 text-sm text-[#1D2433] outline-none transition placeholder:text-[#AAA39E] focus:border-[#F36A21] focus:ring-4 focus:ring-[#F36A21]/10 disabled:opacity-60"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-[13px] font-medium text-[#55504C]"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-[13px] font-medium text-[#7B4B9E] transition hover:text-[#F36A21]"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    disabled={loading}
                    className="h-[48px] w-full rounded-xl border border-[#E4DFDB] bg-white px-4 pr-12 text-sm text-[#1D2433] outline-none transition placeholder:text-[#AAA39E] focus:border-[#F36A21] focus:ring-4 focus:ring-[#F36A21]/10 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#89827C] transition hover:bg-[#FFF2EA] hover:text-[#F36A21]"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOffIcon />
                    ) : (
                      <EyeIcon />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-[#F3C9B7] bg-[#FFF5F0] px-4 py-3 text-sm text-[#C84F16]">
                  {error}
                </div>
              )}

              {/* Sign In */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-[48px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#DF5C3F] to-[#FF6B1A] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(222,89,49,0.22)] transition hover:scale-[1.01] hover:shadow-[0_12px_25px_rgba(222,89,49,0.30)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 py-1">
                <div className="h-px flex-1 bg-[#E8E3DF]" />

                <span className="text-[10px] text-[#99928C]">
                  OR
                </span>

                <div className="h-px flex-1 bg-[#E8E3DF]" />
              </div>

              {/* Google */}
              <button
                type="button"
                className="flex h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-[#E2DDD8] bg-white text-sm font-medium text-[#35302D] transition hover:border-[#F36A21] hover:bg-[#FFF9F5]"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-[10px] text-[#A09A95]">
              © {new Date().getFullYear()} The Bold Kind ·
              Restaurant Analytics Platform
            </p>
          </div>
        </section>

        {/* ================= RIGHT SIDE ================= */}
        <section className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-[#C94E38] via-[#E65E36] to-[#F47A26] lg:block">

          {/* Background Decorations */}
          <div className="absolute -right-40 -top-40 h-[380px] w-[380px] rounded-full bg-[#FFB56A]/10 blur-3xl" />

          <div className="absolute -bottom-40 -left-32 h-[350px] w-[350px] rounded-full bg-[#7C2548]/20 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between p-8 xl:p-12">

            {/* Heading */}
            <div className="max-w-[620px]">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-[3px] w-10 rounded-full bg-white/80" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
                  The Bold Kind
                </span>
              </div>

              <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.035em] text-white xl:text-[38px]">
                Restaurant Analytics,
                <br />
                All in One Place.
              </h2>

              <p className="mt-4 max-w-[600px] text-[13px] leading-6 text-white/80 xl:text-[15px] xl:leading-7">
                Transform your restaurant data into actionable
                insights. Monitor orders, revenue, customer
                behaviour and business performance — all from one
                powerful dashboard.
              </p>

              <div className="mt-5 h-px w-[220px] bg-white/40" />
            </div>

            {/* Dashboard Preview */}
            <div className="relative mx-auto my-3 w-full max-w-[560px]">

              <div className="rounded-[20px] border border-white/50 bg-[#F8F7F6]/95 p-4 shadow-[0_20px_55px_rgba(70,25,10,0.25)] backdrop-blur">

                {/* Dashboard Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-medium text-[#8D8883]">
                      THE BOLD KIND
                    </p>

                    <h3 className="mt-1 text-base font-semibold text-[#242933]">
                      Performance Overview
                    </h3>
                  </div>

                  <div className="rounded-lg bg-[#FFF0E8] px-3 py-2 text-[9px] font-medium text-[#E7642A]">
                    This Month
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <MiniCard
                    label="Total Orders"
                    value="12,458"
                    trend="+18.4%"
                  />

                  <MiniCard
                    label="Revenue"
                    value="AED 248K"
                    trend="+12.8%"
                  />

                  <MiniCard
                    label="Customers"
                    value="8,924"
                    trend="+9.6%"
                  />
                </div>

                {/* Chart */}
                <div className="mt-3 rounded-2xl border border-[#EAE5E0] bg-white p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-[#353B44]">
                        Revenue Performance
                      </p>

                      <p className="mt-1 text-[9px] text-[#A09A95]">
                        Last 7 days
                      </p>
                    </div>

                    <span className="rounded-md bg-[#ECF8F1] px-2 py-1 text-[8px] font-semibold text-[#2C9B66]">
                      +17.2%
                    </span>
                  </div>

                  {/* Fake Chart */}
                  <div className="mt-4 flex h-[90px] items-end justify-between gap-1.5">
                    {[35, 52, 42, 76, 58, 88, 70, 100, 82, 92].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="flex flex-1 flex-col justify-end"
                        >
                          <div
                            className="w-full rounded-t-sm bg-gradient-to-t from-[#D95C42] to-[#F28A50]"
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-2 flex justify-between text-[8px] text-[#A8A29E]">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>

                {/* Bottom Dashboard */}
                <div className="mt-3 grid grid-cols-[1.4fr_1fr] gap-3">

                  <div className="rounded-2xl border border-[#EAE5E0] bg-white p-3.5">
                    <p className="text-[11px] font-semibold text-[#353B44]">
                      Top Performing Branches
                    </p>

                    <div className="mt-3 space-y-2.5">
                      <BranchRow
                        name="Downtown"
                        value="AED 48.2K"
                        percent={88}
                      />

                      <BranchRow
                        name="Marina"
                        value="AED 41.7K"
                        percent={76}
                      />

                      <BranchRow
                        name="JLT"
                        value="AED 36.5K"
                        percent={64}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#EAE5E0] bg-white p-3.5">
                    <p className="text-[11px] font-semibold text-[#353B44]">
                      Order Status
                    </p>

                    <div className="flex h-[100px] items-center justify-center">
                      <div className="relative flex h-[70px] w-[70px] items-center justify-center rounded-full border-[11px] border-[#F36A21] border-r-[#F6D9C8] border-b-[#7FB69B]">
                        <div className="text-center">
                          <p className="text-sm font-bold text-[#30353D]">
                            94%
                          </p>

                          <p className="text-[7px] text-[#99928C]">
                            Completed
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Floating Growth Card */}
              <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 rounded-2xl border border-white/40 bg-white/95 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.15)] xl:block">
                <p className="text-[9px] text-[#8C857F]">
                  Growth Rate
                </p>

                <p className="mt-1 text-xl font-bold text-[#26313A]">
                  +24%
                </p>

                <p className="mt-1 text-[8px] font-medium text-[#32A16A]">
                  ↑ vs last month
                </p>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="flex items-center gap-6 text-xs font-medium text-white/75 xl:gap-10">
              <span>Orders</span>
              <span>Revenue</span>
              <span>Customers</span>
              <span>Insights</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ================= COMPONENTS ================= */

function MiniCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-xl border border-[#EAE5E0] bg-white p-2.5">
      <p className="text-[8px] text-[#98918B]">
        {label}
      </p>

      <p className="mt-1.5 text-sm font-bold text-[#30353D]">
        {value}
      </p>

      <p className="mt-1 text-[8px] font-medium text-[#2C9B66]">
        ↑ {trend}
      </p>
    </div>
  );
}

function BranchRow({
  name,
  value,
  percent,
}: {
  name: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[8px] text-[#6E6964]">
          {name}
        </span>

        <span className="text-[8px] font-semibold text-[#3B4148]">
          {value}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[#F0ECE8]">
        <div
          className="h-full rounded-full bg-[#F36A21]"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.7M6.2 6.9C3.8 8.5 2.5 12 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.6-.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
    >
      <path
        fill="#4285F4"
        d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.2c1.9-1.8 3.1-4.4 3.1-7.4Z"
      />

      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0 0 12 22Z"
      />

      <path
        fill="#FBBC05"
        d="M6.2 13.7a6 6 0 0 1 0-3.4V7.7H2.9a10 10 0 0 0 0 8.6l3.3-2.6Z"
      />

      <path
        fill="#EA4335"
        d="M12 6c1.7 0 3.2.6 4.4 1.7l3.3-3.2C17.9 2.8 15.2 2 12 2A10 10 0 0 0 2.9 7.7l3.3 2.6C7 7.8 9.3 6 12 6Z"
      />
    </svg>
  );
}