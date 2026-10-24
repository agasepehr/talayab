"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;

      // First try to connect the authenticated email to the pre-configured admin record.
      await supabase.rpc("claim_admin_identity");

      const { data: roleData } = await supabase.rpc("get_my_role");
      const role = roleData?.role;

      if (role === "admin") router.replace("/admin");
      else if (role === "seller") router.replace("/seller");
      else router.replace("/");
    });
  }, [router]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    const normalized = email.trim().toLowerCase();

    if (!normalized || !normalized.includes("@")) {
      setError("ایمیل معتبر وارد کنید.");
      setBusy(false);
      return;
    }

    const { data: isAdminEmail } = await supabase.rpc("is_admin_email", {
      p_email: normalized,
    });

    const { error: loginError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        // Only the pre-configured site-owner email may create its first Auth
        // identity from the Login page. All other users must already exist.
        shouldCreateUser: isAdminEmail === true,
        emailRedirectTo: window.location.origin + "/login",
      },
    });

    if (loginError) {
      setError(
        isAdminEmail === true
          ? "ارسال لینک ورود مدیر انجام نشد؛ تنظیمات ایمیل Supabase را بررسی کنید."
          : "این ایمیل هنوز ثبت‌نام نشده است؛ ابتدا عضو شوید."
      );
    } else {
      setMessage("لینک ورود به ایمیل شما ارسال شد. روی لینک بزنید تا وارد حساب شوید.");
    }

    setBusy(false);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F6F9F7] px-4 py-8 text-[#173C32] md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-[#DDE8E1] bg-white shadow-[0_30px_90px_rgba(23,60,50,0.12)] lg:grid-cols-2">
          <section className="bg-[#173C32] p-8 text-white md:p-10">
            <div className="text-xs font-black tracking-[0.25em] text-[#D3A85A]">THETALA</div>
            <h1 className="mt-5 text-4xl font-black leading-tight">خوش برگشتی</h1>
            <p className="mt-4 text-sm leading-8 text-[#DCE9E3]">
              با ورود به حساب، مسیرت را ادامه بده؛ از بررسی طلاها تا مدیریت فروشگاه.
            </p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-[#DCE9E3]">
              ورود با لینک یک‌بارمصرف ایمیل انجام می‌شود؛ نیازی به حفظ رمز عبور نیست.
            </div>
          </section>

          <section className="p-8 md:p-10">
            <h2 className="text-2xl font-black">ورود به حساب</h2>
            <p className="mt-2 text-sm leading-7 text-[#71827A]">
              ایمیل حسابی که قبلاً ثبت‌نام کرده‌اید را وارد کنید.
            </p>

            <form onSubmit={submit} className="mt-8">
              <label className="text-sm font-bold">ایمیل</label>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 h-14 w-full rounded-2xl border border-[#DDE8E1] bg-[#FAFCFB] px-4 text-sm outline-none focus:border-[#C9A227]"
              />
              <button
                disabled={busy}
                className="mt-4 h-14 w-full rounded-2xl bg-[#173C32] text-sm font-black text-white disabled:opacity-60"
              >
                {busy ? "در حال ارسال..." : "ارسال لینک ورود"}
              </button>
            </form>

            {message ? <div className="mt-5 rounded-2xl bg-[#E8F5EE] p-4 text-sm leading-7 text-[#17633F]">{message}</div> : null}
            {error ? <div className="mt-5 rounded-2xl bg-[#FCEBEC] p-4 text-sm leading-7 text-[#A33C46]">{error}</div> : null}

            <div className="mt-7 flex items-center justify-between text-sm">
              <Link href="/register" className="font-black text-[#A17915] hover:underline">
                هنوز عضو نیستم
              </Link>
              <Link href="/" className="font-bold text-[#60766C]">
                بازگشت به سایت
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
