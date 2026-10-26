"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const routeUser = async () => {
    await supabase.rpc("claim_admin_identity");

    const { data: roleData } = await supabase.rpc("get_my_role");
    const role = roleData?.role;

    if (role === "admin") router.replace("/admin");
    else if (role === "seller") router.replace("/seller");
    else router.replace("/");
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      await routeUser();
    });
  }, []);

  const sendCode = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    const normalized = email.trim().toLowerCase();

    if (!normalized || !normalized.includes("@")) {
      setError("ایمیل معتبر وارد کنید.");
      setBusy(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: window.location.origin + "/login",
      },
    });

    if (loginError) {
      setError(
        "ارسال کد ورود انجام نشد. اگر این ایمیل قبلاً ثبت‌نام نشده است، ابتدا عضو شوید."
      );
      setBusy(false);
      return;
    }

    setStep("code");
    setMessage("کد ۸ رقمی به ایمیل شما ارسال شد. آن را در کادر پایین وارد کنید.");
    setBusy(false);
  };

  const verifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    const normalized = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      setError("کد تأیید باید ۸ رقمی باشد.");
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

    await routeUser();
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#F6F9F7] px-4 py-8 text-[#173C32] md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-[#DDE8E1] bg-white shadow-[0_30px_90px_rgba(23,60,50,0.12)] lg:grid-cols-2">
          <section className="bg-[#173C32] p-8 text-white md:p-10">
            <div className="text-xs font-black tracking-[0.25em] text-[#D3A85A]">THETALA</div>
            <h1 className="mt-5 text-4xl font-black leading-tight">خوش برگشتی</h1>
            <p className="mt-4 text-sm leading-8 text-[#DCE9E3]">
              وارد حساب خودت شو و از امکانات TheTala استفاده کن؛ بدون نیاز به رمز عبور.
            </p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-[#DCE9E3]">
              کد ورود ۶ رقمی به ایمیل شما ارسال می‌شود و همان کد برای ورود استفاده می‌شود.
            </div>
          </section>

          <section className="p-8 md:p-10">
            <h2 className="text-2xl font-black">ورود به حساب</h2>

            {step === "email" ? (
              <>
                <p className="mt-2 text-sm leading-7 text-[#71827A]">
                  ایمیل حسابی که قبلاً ثبت‌نام کرده‌اید را وارد کنید.
                </p>

                <form onSubmit={sendCode} className="mt-8">
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
                    {busy ? "در حال ارسال..." : "دریافت کد ورود"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm leading-7 text-[#71827A]">
                  کد ۸ رقمی ارسال‌شده به <span dir="ltr" className="font-bold text-[#173C32]">{email}</span> را وارد کنید.
                </p>

                <form onSubmit={verifyCode} className="mt-8">
                  <label className="text-sm font-bold">کد تأیید</label>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="12345678"
                    dir="ltr"
                    className="mt-2 h-14 w-full rounded-2xl border border-[#DDE8E1] bg-[#FAFCFB] px-4 text-center text-xl font-black tracking-[0.28em] outline-none focus:border-[#C9A227]"
                  />
                  <button
                    disabled={busy}
                    className="mt-4 h-14 w-full rounded-2xl bg-[#173C32] text-sm font-black text-white disabled:opacity-60"
                  >
                    {busy ? "در حال بررسی..." : "تأیید کد و ورود"}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setMessage("");
                    setError("");
                  }}
                  className="mt-4 w-full text-sm font-bold text-[#A17915] hover:underline"
                >
                  تغییر ایمیل
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
