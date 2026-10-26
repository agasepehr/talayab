"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type RegisterPayload = {
  fullName?: string;
  phone?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"details" | "code">("details");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const completeRegistration = async () => {
    let payload: RegisterPayload = {};

    try {
      const saved = window.localStorage.getItem("thetala_register");
      payload = saved ? (JSON.parse(saved) as RegisterPayload) : {};
    } catch {
      window.localStorage.removeItem("thetala_register");
    }

    const { data, error: registrationError } = await supabase.rpc(
      "complete_member_registration",
      {
        p_full_name: payload.fullName || fullName.trim(),
        p_phone: payload.phone || phone.trim() || null,
      }
    );

    if (registrationError) {
      setError(
        registrationError.message === "full_name_required"
          ? "نام و نام خانوادگی الزامی است."
          : "تکمیل عضویت ناموفق بود."
      );
      return;
    }

    window.localStorage.removeItem("thetala_register");

    if (data?.role === "admin") router.replace("/admin");
    else if (data?.role === "seller") router.replace("/seller");
    else router.replace("/");
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      await completeRegistration();
    });
  }, []);

  const sendCode = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
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
      },
    });

    if (signUpError) {
      setError("ارسال کد عضویت انجام نشد. دوباره تلاش کنید.");
      setBusy(false);
      return;
    }

    setStep("code");
    setMessage("کد ۶ رقمی به ایمیل شما ارسال شد.");
    setBusy(false);
  };

  const verifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    const normalized = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (!/^\d{8}$/.test(normalizedCode)) {
      setError("کد تأیید باید ۶ رقمی باشد.");
      setBusy(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: normalized,
      token: normalizedCode,
      type: "email",
    });

    if (verifyError) {
      setError("کد تأیید نادرست یا منقضی شده است. دوباره کد بگیرید.");
      setBusy(false);
      return;
    }

    await completeRegistration();
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F6F9F7] px-4 py-8 text-[#173C32] md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-[#DDE8E1] bg-white shadow-[0_30px_90px_rgba(23,60,50,0.12)] lg:grid-cols-2">
          <section className="bg-[#173C32] p-8 text-white md:p-10">
            <div className="text-xs font-black tracking-[0.25em] text-[#D3A85A]">THETALA</div>
            <h1 className="mt-5 text-4xl font-black leading-tight">به TheTala بپیوند</h1>
            <p className="mt-4 text-sm leading-8 text-[#DCE9E3]">
              حساب خودت را با ایمیل بساز و با یک کد ۶ رقمی وارد TheTala شو.
            </p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-[#DCE9E3]">
              رمز عبور لازم نیست؛ کد تأیید مستقیم به ایمیلت ارسال می‌شود.
            </div>
          </section>

          <section className="p-8 md:p-10">
            <h2 className="text-2xl font-black">عضویت</h2>

            {step === "details" ? (
              <>
                <p className="mt-2 text-sm leading-7 text-[#71827A]">
                  نام، تلفن و ایمیل خود را وارد کنید.
                </p>

                <form onSubmit={sendCode} className="mt-8 space-y-4">
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
                    {busy ? "در حال ارسال..." : "عضویت و دریافت کد"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm leading-7 text-[#71827A]">
                  کد ۶ رقمی ارسال‌شده به <span dir="ltr" className="font-bold text-[#173C32]">{email}</span> را وارد کنید.
                </p>

                <form onSubmit={verifyCode} className="mt-8">
                  <label className="text-sm font-bold">کد تأیید</label>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    dir="ltr"
                    className="mt-2 h-14 w-full rounded-2xl border border-[#DDE8E1] bg-[#FAFCFB] px-4 text-center text-xl font-black tracking-[0.28em] outline-none focus:border-[#C9A227]"
                  />
                  <button
                    disabled={busy}
                    className="mt-4 h-14 w-full rounded-2xl bg-[#173C32] text-sm font-black text-white disabled:opacity-60"
                  >
                    {busy ? "در حال بررسی..." : "تأیید کد و تکمیل عضویت"}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setStep("details");
                    setCode("");
                    setMessage("");
                    setError("");
                  }}
                  className="mt-4 w-full text-sm font-bold text-[#A17915] hover:underline"
                >
                  تغییر اطلاعات
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void sendCode()}
                  className="mt-2 w-full text-sm font-bold text-[#60766C] hover:underline disabled:opacity-50"
                >
                  ارسال دوباره کد
                </button>
              </>
            )}

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
