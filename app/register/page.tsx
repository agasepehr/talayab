"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;

      const saved = window.localStorage.getItem("thetala_register");
      const payload = saved ? JSON.parse(saved) as { fullName?: string; phone?: string } : {};
      const { data: result, error: registrationError } = await supabase.rpc(
        "complete_member_registration",
        {
          p_full_name: payload.fullName || data.session.user.user_metadata?.full_name || "عضو TheTala",
          p_phone: payload.phone || data.session.user.user_metadata?.phone || null,
        }
      );

      if (registrationError) {
        setError(registrationError.message === "full_name_required" ? "نام و نام خانوادگی الزامی است." : "تکمیل عضویت ناموفق بود.");
        return;
      }

      window.localStorage.removeItem("thetala_register");
      if (result?.role === "admin") router.replace("/admin");
      else if (result?.role === "seller") router.replace("/seller");
      else router.replace("/");
    });
  }, [router]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    const name = fullName.trim();
    const normalized = email.trim().toLowerCase();

    if (!name) {
      setError("نام و نام خانوادگی را وارد کنید.");
      setBusy(false);
      return;
    }

    if (!normalized || !normalized.includes("@")) {
      setError("ایمیل معتبر وارد کنید.");
      setBusy(false);
      return;
    }

    window.localStorage.setItem(
      "thetala_register",
      JSON.stringify({ fullName: name, phone: phone.trim() })
    );

    const { error: signUpError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: true,
        data: {
          full_name: name,
          phone: phone.trim(),
        },
        emailRedirectTo: window.location.origin + "/register",
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setBusy(false);
      return;
    }

    setMessage("لینک تکمیل عضویت به ایمیل شما ارسال شد. روی لینک بزنید تا حساب ساخته شود.");
    setBusy(false);
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F6F9F7] px-4 py-8 text-[#173C32] md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-[#DDE8E1] bg-white shadow-[0_30px_90px_rgba(23,60,50,0.12)] lg:grid-cols-2">
          <section className="bg-[#173C32] p-8 text-white md:p-10">
            <div className="text-xs font-black tracking-[0.25em] text-[#D3A85A]">THETALA</div>
            <h1 className="mt-5 text-4xl font-black leading-tight">به TheTala بپیوند</h1>
            <p className="mt-4 text-sm leading-8 text-[#DCE9E3]">
              یک حساب بساز و بعداً می‌توانی اطلاعات حسابت را تکمیل کنی و از امکانات TheTala استفاده کنی.
            </p>
          </section>

          <section className="p-8 md:p-10">
            <h2 className="text-2xl font-black">عضویت</h2>
            <p className="mt-2 text-sm leading-7 text-[#71827A]">
              نام، تلفن و ایمیل خود را وارد کنید.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="نام و نام خانوادگی"
                className="h-14 w-full rounded-2xl border border-[#DDE8E1] bg-[#FAFCFB] px-4 text-sm outline-none focus:border-[#C9A227]"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="شماره موبایل (اختیاری)"
                dir="ltr"
                className="h-14 w-full rounded-2xl border border-[#DDE8E1] bg-[#FAFCFB] px-4 text-sm outline-none focus:border-[#C9A227]"
              />
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-14 w-full rounded-2xl border border-[#DDE8E1] bg-[#FAFCFB] px-4 text-sm outline-none focus:border-[#C9A227]"
              />
              <button
                disabled={busy}
                className="h-14 w-full rounded-2xl bg-[#173C32] text-sm font-black text-white disabled:opacity-60"
              >
                {busy ? "در حال ارسال..." : "عضویت و دریافت لینک"}
              </button>
            </form>

            {message ? <div className="mt-5 rounded-2xl bg-[#E8F5EE] p-4 text-sm leading-7 text-[#17633F]">{message}</div> : null}
            {error ? <div className="mt-5 rounded-2xl bg-[#FCEBEC] p-4 text-sm leading-7 text-[#A33C46]">{error}</div> : null}

            <div className="mt-7 flex items-center justify-between text-sm">
              <Link href="/login" className="font-black text-[#A17915] hover:underline">
                قبلاً عضو شده‌ام
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
