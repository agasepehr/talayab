"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

type CurrentPrice = {
  gold18_toman: number | null;
  updated_at: string | null;
  last_status: string;
  last_source: string;
  last_source_url: string;
};

type HistoryRow = {
  id: number;
  gold18_toman: number;
  gold18_rial: number;
  source: string;
  source_url: string;
  fetched_at: string;
  status: string;
  error_message: string | null;
};

type DashboardPayload = {
  current: CurrentPrice;
  history: HistoryRow[];
};

function formatToman(value: number | null | undefined) {
  if (value == null) return "—";
  return `${Math.round(value).toLocaleString("fa-IR")} تومان`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  switch (status) {
    case "success":
      return "موفق";
    case "suspicious":
      return "متوقف شد؛ تغییر غیرعادی";
    case "parse_error":
      return "خطای خواندن قیمت";
    case "http_error":
      return "خطای دریافت منبع";
    case "sanity_error":
      return "رد شد؛ عدد غیرمنطقی";
    case "unknown":
      return "نامشخص";
    default:
      return status;
  }
}

function statusClasses(status: string) {
  if (status === "success") {
    return "bg-[#E8F5EE] text-[#17633F]";
  }

  if (status === "suspicious" || status === "sanity_error") {
    return "bg-[#FFF4DD] text-[#946D12]";
  }

  return "bg-[#FCEBEC] text-[#A33C46]";
}

export default function AdminMarketPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [dashboardError, setDashboardError] = useState("");

  const loadDashboard = async () => {
    setDashboardError("");

    const { error: claimError } = await supabase.rpc(
      "claim_admin_identity"
    );

    if (claimError) {
      setDashboardError(
        claimError.message === "admin_account_not_configured"
          ? "حساب مدیریت اصلی در سامانه تنظیم نشده است."
          : "احراز هویت مدیر ناموفق بود."
      );
      setDashboard(null);
      return;
    }

    const { data, error } = await supabase.rpc("get_admin_market_dashboard");

    if (error) {
      setDashboardError(
        error.message === "not_authorized"
          ? "این حساب دسترسی مدیریت قیمت‌ها را ندارد."
          : "دریافت اطلاعات قیمت ناموفق بود."
      );
      setDashboard(null);
      return;
    }

    setDashboard(data as DashboardPayload);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      setSession(data.session);
      setLoading(false);

      if (data.session) {
        void loadDashboard();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthMessage("");
      setAuthError("");
      setDashboard(null);

      if (nextSession) {
        void loadDashboard();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setAuthError("یک ایمیل معتبر وارد کنید.");
      return;
    }

    setSending(true);
    setAuthError("");
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: window.location.origin + "/admin/market",
      },
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthMessage(
        "لینک ورود مدیریت به ایمیل شما ارسال شد."
      );
    }

    setSending(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setDashboardError("");

    const { data, error } = await supabase.rpc("admin_refresh_gold18_price");

    if (error) {
      setDashboardError(
        error.message === "not_authorized"
          ? "این حساب دسترسی مدیریت قیمت‌ها را ندارد."
          : "ارسال درخواست به‌روزرسانی ناموفق بود."
      );
      setRefreshing(false);
      return;
    }

    if (data?.status === "queued") {
      setAuthMessage("درخواست دریافت قیمت ارسال شد. چند لحظه بعد دوباره بررسی می‌کنیم.");
    }

    window.setTimeout(async () => {
      await loadDashboard();
      setRefreshing(false);
    }, 5000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const history = useMemo(
    () => dashboard?.history ?? [],
    [dashboard]
  );

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#F7FAF8] px-6 py-16 text-[#173C32]">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[#DDE8E1] bg-white px-6 py-16 text-center shadow-sm">
          در حال بررسی حساب مدیریت...
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#F7FAF8] px-6 py-10 text-[#173C32]">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="font-extrabold text-[#173C32]"
            >
              ویترین‌یاب
            </Link>

            <Link
              href="/gold"
              className="rounded-xl border border-[#DDE8E1] bg-white px-4 py-2.5 text-sm font-bold text-[#416055] transition hover:border-[#C9A227]"
            >
              بازگشت به سایت
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
            <section className="rounded-3xl bg-[#173C32] p-8 text-white shadow-[0_24px_70px_rgba(23,60,50,0.16)]">
              <div className="text-sm font-bold text-[#D3A85A]">
                VITRINYAB ADMIN
              </div>

              <h1 className="mt-4 text-3xl font-extrabold leading-tight">
                مدیریت قیمت بازار
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#DCE9E3]">
                آخرین نرخ طلای ۱۸ عیار، منبع دریافت قیمت و تاریخچه
                به‌روزرسانی‌ها را از یکجا بررسی کنید.
              </p>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-[#D8E8E0]">
                ورود فقط برای حساب‌هایی فعال است که نقش آن‌ها در
                سامانه «admin» تعریف شده باشد.
              </div>
            </section>

            <section className="rounded-3xl border border-[#DDE8E1] bg-white p-8 shadow-sm">
              <div className="text-xl font-extrabold text-[#173C32]">
                ورود مدیر
              </div>

              <p className="mt-2 text-sm leading-7 text-[#6E7F77]">
                لینک ورود یک‌بارمصرف به ایمیل مدیر ارسال می‌شود.
              </p>

              <form onSubmit={handleLogin} className="mt-7">
                <label className="text-sm font-bold text-[#35584D]">
                  ایمیل
                </label>

                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  dir="ltr"
                  placeholder="admin@example.com"
                  className="mt-2 h-13 w-full rounded-2xl border border-[#DDE8E1] bg-[#FAFCFB] px-4 text-sm text-[#173C32] outline-none transition focus:border-[#C9A227] focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={sending}
                  className="mt-4 w-full rounded-2xl bg-[#173C32] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#0E4A3C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "در حال ارسال..." : "ارسال لینک ورود"}
                </button>
              </form>

              {authMessage ? (
                <div className="mt-5 rounded-2xl bg-[#E8F5EE] px-4 py-3 text-sm leading-6 text-[#17633F]">
                  {authMessage}
                </div>
              ) : null}

              {authError ? (
                <div className="mt-5 rounded-2xl bg-[#FCEBEC] px-4 py-3 text-sm leading-6 text-[#A33C46]">
                  {authError}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F7FAF8] text-[#173C32]">
      <header className="sticky top-0 z-40 border-b border-[#E4ECE7] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-[92%] max-w-[1440px] items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-[0.2em] text-[#A27B17]">
              VITRINYAB ADMIN
            </div>
            <div className="mt-1 text-lg font-extrabold text-[#173C32]">
              مدیریت قیمت بازار
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-xl border border-[#DDE8E1] bg-white px-4 py-2.5 text-sm font-bold text-[#416055] transition hover:border-[#C9A227] sm:block"
            >
              سایت
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-[#DDE8E1] bg-white px-4 py-2.5 text-sm font-bold text-[#A1444E] transition hover:border-[#E9BFC3]"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-[92%] max-w-[1440px] py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-bold text-[#A27B17]">
              MARKET PRICES
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              وضعیت قیمت طلای ۱۸ عیار
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6E7F77]">
              قیمت محصولات ویترین‌یاب از این نرخ پایه محاسبه می‌شود.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-2xl bg-[#173C32] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#0E4A3C] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? "در حال دریافت..." : "دریافت قیمت جدید"}
          </button>
        </div>

        {dashboardError ? (
          <div className="mb-6 rounded-2xl bg-[#FCEBEC] px-5 py-4 text-sm leading-7 text-[#A33C46]">
            {dashboardError}
          </div>
        ) : null}

        {dashboard ? (
          <>
            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-3xl bg-[#173C32] p-6 text-white shadow-[0_18px_50px_rgba(23,60,50,0.13)]">
                <div className="text-sm text-[#CFE0D8]">
                  نرخ فعلی
                </div>
                <div className="mt-4 text-3xl font-extrabold">
                  {formatToman(dashboard.current.gold18_toman)}
                </div>
                <div className="mt-3 text-xs text-[#CFE0D8]">
                  هر گرم طلای ۱۸ عیار
                </div>
              </div>

              <div className="rounded-3xl border border-[#DDE8E1] bg-white p-6 shadow-sm">
                <div className="text-sm text-[#71827A]">
                  آخرین بروزرسانی
                </div>
                <div className="mt-4 text-xl font-extrabold text-[#173C32]">
                  {formatDate(dashboard.current.updated_at)}
                </div>
                <div className="mt-3 text-xs text-[#87968F]">
                  منبع: {dashboard.current.last_source}
                </div>
              </div>

              <div className="rounded-3xl border border-[#DDE8E1] bg-white p-6 shadow-sm">
                <div className="text-sm text-[#71827A]">
                  وضعیت آخرین دریافت
                </div>
                <div className="mt-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${statusClasses(
                      dashboard.current.last_status
                    )}`}
                  >
                    {statusLabel(dashboard.current.last_status)}
                  </span>
                </div>
                <div className="mt-3 text-xs text-[#87968F]">
                  تاریخچه: {history.length.toLocaleString("fa-IR")} رکورد اخیر
                </div>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-3xl border border-[#DDE8E1] bg-white shadow-sm">
              <div className="border-b border-[#E8EEE9] px-6 py-5">
                <div className="text-lg font-extrabold">
                  تاریخچه دریافت قیمت
                </div>
                <div className="mt-1 text-sm text-[#7A8A83]">
                  فقط آخرین ۵۰ دریافت نگهداری و نمایش داده می‌شود.
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-right text-sm">
                  <thead className="bg-[#FAFCFB] text-[#66776F]">
                    <tr>
                      <th className="px-6 py-4 font-bold">زمان</th>
                      <th className="px-6 py-4 font-bold">قیمت</th>
                      <th className="px-6 py-4 font-bold">منبع</th>
                      <th className="px-6 py-4 font-bold">وضعیت</th>
                      <th className="px-6 py-4 font-bold">جزئیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.id} className="border-t border-[#EEF3EF]">
                        <td className="whitespace-nowrap px-6 py-4 text-[#50645B]">
                          {formatDate(row.fetched_at)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-extrabold text-[#173C32]">
                          {formatToman(row.gold18_toman)}
                        </td>
                        <td className="px-6 py-4 text-[#50645B]">
                          {row.source}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${statusClasses(
                              row.status
                            )}`}
                          >
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td className="max-w-sm px-6 py-4 text-xs leading-6 text-[#7B8B84]">
                          {row.error_message ?? "دریافت و ثبت با موفقیت انجام شد."}
                        </td>
                      </tr>
                    ))}

                    {history.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-14 text-center text-sm text-[#7B8B84]"
                        >
                          هنوز سابقه‌ای ثبت نشده است.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-[#DDE8E1] bg-white px-6 py-16 text-center shadow-sm">
            <div className="text-lg font-extrabold">
              اطلاعات مدیریت قابل نمایش نیست.
            </div>
            <p className="mt-2 text-sm text-[#75867E]">
              نقش این حساب باید admin باشد.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
