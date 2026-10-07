"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";


type Product = {
  id: number;
  name: string;
  category: string;
  weight: string;
  price: string;
  status: "فعال" | "غیرفعال";
  views: number;
  uniqueViews: number;
  contactClicks: number;
  mapClicks: number;
  instagramClicks: number;
  listImpressions: number;
  storePageViews: number;
  karat: number;
  wageValue: number;
  extraFee: number;
  description: string;
};

type AnalyticsProduct = {
  id: number;
  name: string;
  category: string;
  views: number;
  uniqueViews: number;
  contactClicks: number;
  mapClicks: number;
  instagramClicks: number;
  listImpressions: number;
};

type AnalyticsSummary = {
  views: number;
  uniqueViews: number;
  contactClicks: number;
  mapClicks: number;
  instagramClicks: number;
  listImpressions: number;
  storePageViews: number;
};

type TimeRange = "امروز" | "۷ روز" | "۳۰ روز" | "۳ ماه";

const rangeDays: Record<TimeRange, number> = {
  امروز: 1,
  "۷ روز": 7,
  "۳۰ روز": 30,
  "۳ ماه": 90,
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatToman(value: number) {
  return Math.round(value).toLocaleString("fa-IR") + " تومان";
}

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function toNumber(value: string) {
  const number = Number(
    normalizeDigits(value).replace(/[,٬،]/g, "").replace(/٪/g, "").trim()
  );
  return Number.isFinite(number) ? number : 0;
}

function calculateRate(clicks: number, views: number) {
  if (!views) return "۰٪";
  return ((clicks / views) * 100).toFixed(1).replace(".", "٫") + "٪";
}

export default function SellerPanelPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [authSending, setAuthSending] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [profile, setProfile] = useState<{ id: number; full_name: string | null; email: string | null } | null>(null);
  const [shop, setShop] = useState<{ id: number; shop_name: string | null; city: string | null; phone: string | null; instagram: string | null } | null>(null);
  const [onboarding, setOnboarding] = useState({
    shopName: "",
    city: "",
    phone: "",
    instagram: "",
  });
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

  const [activeSection, setActiveSection] = useState<
    "add-product" | "analytics"
  >("add-product");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productError, setProductError] = useState("");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [timeRange, setTimeRange] = useState<TimeRange>("۳۰ روز");
  const [analyticsProducts, setAnalyticsProducts] = useState<AnalyticsProduct[]>(
    []
  );
  const [analyticsSummary, setAnalyticsSummary] =
    useState<AnalyticsSummary>({
      views: 0,
      uniqueViews: 0,
      contactClicks: 0,
      mapClicks: 0,
      instagramClicks: 0,
      listImpressions: 0,
      storePageViews: 0,
    });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "انگشتر",
    weight: "",
    karat: "18",
    wage: "8",
    price: "",
    stock: "موجود",
    description: "",
  });

  const loadProducts = async (
    shopId: number,
    categoryRows: { id: number; name: string }[]
  ) => {
    setProductsLoading(true);
    setProductError("");

    const [productsResult, marketResult] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id,title,category_id,weight,karat,wage_value,extra_fee,description,status"
        )
        .eq("shop_id", shopId)
        .order("id", { ascending: false }),
      supabase
        .from("market_prices")
        .select("gold18")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (productsResult.error || marketResult.error) {
      setProductError("دریافت محصولات فروشگاه ناموفق بود.");
      setProductsLoading(false);
      return;
    }

    const categoryMap = new Map(
      categoryRows.map((item) => [item.id, item.name])
    );
    const gold18 = Number(marketResult.data?.gold18 ?? 0);

    const mapped = (productsResult.data ?? []).map((row) => {
      const weight = Number(row.weight ?? 0);
      const wageValue = Number(row.wage_value ?? 0);
      const extraFee = Number(row.extra_fee ?? 0);
      const goldValue = weight * gold18;
      const price =
        goldValue + goldValue * (wageValue / 100) + extraFee;

      return {
        id: row.id,
        name: row.title ?? "محصول طلا",
        category: categoryMap.get(row.category_id ?? 0) ?? "سایر",
        weight: String(weight),
        price: formatToman(price),
        status: row.status === "active" ? "فعال" : "غیرفعال",
        views: 0,
        uniqueViews: 0,
        contactClicks: 0,
        mapClicks: 0,
        instagramClicks: 0,
        listImpressions: 0,
        storePageViews: 0,
        karat: Number(row.karat ?? 18),
        wageValue,
        extraFee,
        description: row.description ?? "",
      } as Product;
    });

    setProducts(mapped);
    setSelectedProductId((current) => current ?? mapped[0]?.id ?? null);
    setProductsLoading(false);
  };

  const loadAnalytics = async () => {
    if (!session || !shop) return;

    setAnalyticsLoading(true);
    setAnalyticsError("");

    const { data, error } = await supabase.rpc(
      "get_seller_analytics",
      { p_days: rangeDays[timeRange] }
    );

    if (error) {
      setAnalyticsError("دریافت آمار واقعی ناموفق بود.");
      setAnalyticsProducts([]);
      setAnalyticsLoading(false);
      return;
    }

    const summary = (data?.summary ?? {}) as Record<string, unknown>;

    setAnalyticsSummary({
      views: Number(summary.views ?? 0),
      uniqueViews: Number(summary.unique_views ?? 0),
      contactClicks: Number(summary.contact_clicks ?? 0),
      mapClicks: Number(summary.map_clicks ?? 0),
      instagramClicks: Number(summary.instagram_clicks ?? 0),
      listImpressions: Number(summary.list_impressions ?? 0),
      storePageViews: Number(summary.store_page_views ?? 0),
    });

    const rows = Array.isArray(data?.products)
      ? data.products
      : [];

    const mapped = rows.map((row: Record<string, unknown>) => ({
      id: Number(row.id),
      name: String(row.name ?? "محصول طلا"),
      category: String(row.category ?? "سایر"),
      views: Number(row.views ?? 0),
      uniqueViews: Number(row.unique_views ?? 0),
      contactClicks: Number(row.contact_clicks ?? 0),
      mapClicks: Number(row.map_clicks ?? 0),
      instagramClicks: Number(row.instagram_clicks ?? 0),
      listImpressions: Number(row.list_impressions ?? 0),
    }));

    setAnalyticsProducts(mapped);
    setSelectedProductId((current) => current ?? mapped[0]?.id ?? null);
    setAnalyticsLoading(false);
  };

  const loadSeller = async (currentSession: Session) => {
    setAuthChecking(true);
    setAuthError("");

    const currentEmail =
      currentSession.user.email?.trim().toLowerCase();

    if (!currentEmail) {
      setAuthError("ایمیل حساب فروشنده در دسترس نیست.");
      setAuthChecking(false);
      return;
    }

    const { data: foundUser, error: userError } = await supabase
      .from("users")
      .select("id,full_name,email,auth_user_id")
      .eq("email", currentEmail)
      .maybeSingle();

    if (userError) {
      setAuthError("دریافت حساب فروشنده ناموفق بود.");
      setAuthChecking(false);
      return;
    }

    let nextProfile = foundUser;

    if (!nextProfile) {
      const { data: createdUser, error: createError } = await supabase
        .from("users")
        .insert({
          full_name:
            currentSession.user.user_metadata?.full_name ??
            currentEmail.split("@")[0],
          email: currentEmail,
          role: "seller",
          auth_user_id: currentSession.user.id,
        })
        .select("id,full_name,email")
        .single();

      if (createError || !createdUser) {
        setAuthError("ساخت حساب فروشنده ناموفق بود.");
        setAuthChecking(false);
        return;
      }

      nextProfile = createdUser;
    } else {
      const authId = (
        nextProfile as { auth_user_id?: string | null }
      ).auth_user_id;

      if (authId !== currentSession.user.id) {
        const { error: linkError } = await supabase
          .from("users")
          .update({ auth_user_id: currentSession.user.id })
          .eq("id", nextProfile.id);

        if (linkError) {
          setAuthError("اتصال حساب فروشنده ناموفق بود.");
          setAuthChecking(false);
          return;
        }
      }
    }

    setProfile(nextProfile);

    const [
      { data: shopRow, error: shopError },
      { data: categoryRows, error: categoryError },
    ] = await Promise.all([
      supabase
        .from("shops___")
        .select("id,shop_name,city,phone,instagram")
        .eq("owner_id", nextProfile.id)
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("categories")
        .select("id,name")
        .order("id", { ascending: true }),
    ]);

    if (shopError || categoryError) {
      setAuthError("دریافت اطلاعات فروشگاه ناموفق بود.");
      setAuthChecking(false);
      return;
    }

    setCategories(categoryRows ?? []);
    setShop(shopRow);

    if (shopRow) {
      await loadProducts(shopRow.id, categoryRows ?? []);
    } else {
      setProducts([]);
    }

    setAuthChecking(false);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      setSession(data.session);

      if (data.session) {
        void loadSeller(data.session);
      } else {
        setAuthChecking(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (nextSession) {
        void loadSeller(nextSession);
      } else {
        setProfile(null);
        setShop(null);
        setProducts([]);
        setAnalyticsProducts([]);
        setAuthChecking(false);
      }
    });

  
  return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session && shop) {
      void loadAnalytics();
    }
  }, [session, shop, timeRange]);

  const handleMagicLink = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setAuthError("یک ایمیل معتبر وارد کنید.");
      return;
    }

    setAuthSending(true);
    setAuthError("");

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo:
          window.location.origin + "/seller",
      },
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthMessage(
        "لینک ورود به ایمیل شما ارسال شد. بعد از کلیک روی لینک به پنل برمی‌گردید."
      );
    }

    setAuthSending(false);
  };

  const handleCreateShop = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!profile || !onboarding.shopName.trim()) {
      setOnboardingError("نام فروشگاه را وارد کنید.");
      return;
    }

    setOnboardingSaving(true);
    setOnboardingError("");

    const { data, error } = await supabase
      .from("shops___")
      .insert({
        owner_id: profile.id,
        shop_name: onboarding.shopName.trim(),
        city: onboarding.city.trim() || null,
        phone: onboarding.phone.trim() || null,
        instagram: onboarding.instagram.trim() || null,
        status: "active",
      })
      .select("id,shop_name,city,phone,instagram")
      .single();

    if (error || !data) {
      setOnboardingError("ثبت فروشگاه ناموفق بود.");
    } else {
      setShop(data);
    }

    setOnboardingSaving(false);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!shop) return;

    if (!form.name.trim()) {
      setProductError("نام محصول را وارد کنید.");
      return;
    }

    const category = categories.find(
      (item) => item.name === form.category
    );

    const extraFee = toNumber(form.price);

    const payload = {
      shop_id: shop.id,
      category_id: category?.id ?? null,
      title: form.name.trim(),
      description: form.description.trim() || null,
      weight: toNumber(form.weight),
      karat: toNumber(form.karat) || 18,
      wage_type: "percent",
      wage_value: toNumber(form.wage),
      profit_percent: 0,
      extra_fee: extraFee,
      image: "/hero-luxury.jpg",
      status:
        form.stock === "موجود"
          ? "active"
          : "inactive",
    };

    setProductsLoading(true);
    setProductError("");

    const result = editingProductId
      ? await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProductId)
          .eq("shop_id", shop.id)
          .select("id")
          .single()
      : await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();

    if (result.error) {
      setProductError("ذخیره محصول ناموفق بود.");
      setProductsLoading(false);
      return;
    }

    setEditingProductId(null);
    setForm({
      name: "",
      category: categories[0]?.name ?? "انگشتر",
      weight: "",
      karat: "18",
      wage: "8",
      price: "",
      stock: "موجود",
      description: "",
    });

    await loadProducts(shop.id, categories);
    await loadAnalytics();

    setProductsLoading(false);
    setShowSuccess(true);

    window.setTimeout(
      () => setShowSuccess(false),
      2500
    );
  };

  const toggleProductStatus = async (id: number) => {
    if (!shop) return;

    const product = products.find(
      (item) => item.id === id
    );

    if (!product) return;

    const { error } = await supabase
      .from("products")
      .update({
        status:
          product.status === "فعال"
            ? "inactive"
            : "active",
      })
      .eq("id", product.id)
      .eq("shop_id", shop.id);

    if (error) {
      setProductError(
        "تغییر وضعیت محصول ناموفق بود."
      );
      return;
    }

    await loadProducts(shop.id, categories);
    await loadAnalytics();
  };

  const startEdit = (product: Product) => {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      weight: product.weight,
      karat: String(product.karat),
      wage: String(product.wageValue),
      price: String(product.extraFee),
      stock:
        product.status === "فعال"
          ? "موجود"
          : "ناموجود",
      description: product.description,
    });
    setActiveSection("add-product");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const filteredProducts = analyticsProducts;
  const analyticsTotals = analyticsSummary;
  const selectedAnalytics = filteredProducts.find(
    (product) => product.id === selectedProductId
  );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F4F8F6] text-[#173C32]"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#DDE7E1] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-[94%] max-w-[1500px] items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A227] text-[#C9A227]">
              <span className="text-lg font-bold">
                ط
              </span>
            </div>

            <div className="leading-none">
              <div className="text-lg font-extrabold">
                طلایاب
              </div>

              <div className="mt-1 text-[9px] tracking-[0.3em] text-[#A27A17]">
                TALAYAB
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/gold"
              className="hidden rounded-xl border border-[#DDE7E1] px-4 py-2.5 text-sm font-bold text-[#416055] transition hover:border-[#C9A227] sm:block"
            >
              مشاهده سایت
            </Link>

            <div className="flex items-center gap-3 rounded-full border border-[#DDE7E1] bg-white px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173C32] text-sm font-bold text-white">
                آ
              </div>

              <div className="hidden sm:block">
                <div className="text-sm font-bold">
                  {shop.shop_name ?? "فروشگاه شما"}
                </div>

                <div className="text-[11px] text-[#86948E]">
                  پنل فروشنده
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-[94%] max-w-[1500px] py-7">
        {/* Top title */}
        <div className="mb-6">
          <div className="text-xs font-medium text-[#9A7518]">
            پنل فروشندگان
          </div>

          <h1 className="mt-2 text-2xl font-extrabold md:text-3xl">
            مدیریت فروشگاه
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#71837B]">
            همه‌چیز ساده و متمرکز: محصول اضافه کنید و عملکرد
            محصولاتتان را دقیق ببینید.
          </p>
        </div>

        {/* Main Navigation */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveSection("add-product")}
            className={`rounded-2xl border p-4 text-right transition md:p-5 ${
              activeSection === "add-product"
                ? "border-[#173C32] bg-[#173C32] text-white shadow-[0_10px_30px_rgba(23,60,50,0.12)]"
                : "border-[#DDE7E1] bg-white text-[#31584D] hover:border-[#C9A227]"
            }`}
          >
            <div className="text-xl">
              ＋
            </div>

            <div className="mt-2 text-base font-extrabold md:text-lg">
              افزودن محصول
            </div>

            <div
              className={`mt-1 text-xs leading-6 ${
                activeSection === "add-product"
                  ? "text-[#D5E4DD]"
                  : "text-[#84938D]"
              }`}
            >
              ثبت و مدیریت محصولات فروشگاه
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("analytics")}
            className={`rounded-2xl border p-4 text-right transition md:p-5 ${
              activeSection === "analytics"
                ? "border-[#173C32] bg-[#173C32] text-white shadow-[0_10px_30px_rgba(23,60,50,0.12)]"
                : "border-[#DDE7E1] bg-white text-[#31584D] hover:border-[#C9A227]"
            }`}
          >
            <div className="text-xl">
              ▥
            </div>

            <div className="mt-2 text-base font-extrabold md:text-lg">
              آمارگیری
            </div>

            <div
              className={`mt-1 text-xs leading-6 ${
                activeSection === "analytics"
                  ? "text-[#D5E4DD]"
                  : "text-[#84938D]"
              }`}
            >
              مشاهده دقیق عملکرد محصولات
            </div>
          </button>
        </div>

        {/* Success */}
        {showSuccess && (
          <div className="mb-6 rounded-2xl border border-[#CDE3D7] bg-[#EEF8F2] px-5 py-4 text-sm font-bold text-[#2E725C]">
            محصول با موفقیت به لیست محصولات اضافه شد.
          </div>
        )}

        {/* Add Product */}
        {activeSection === "add-product" && (
          <section className="space-y-6">
            <div className="rounded-3xl border border-[#DDE7E1] bg-white p-5 md:p-7">
              <div className="mb-6">
                <h2 className="text-xl font-extrabold md:text-2xl">
                  افزودن محصول جدید
                </h2>

                <p className="mt-2 text-sm leading-7 text-[#71837B]">
                  اطلاعات اصلی محصول را وارد کنید. در نسخه واقعی،
                  این اطلاعات مستقیماً در پروفایل فروشگاه ثبت می‌شود.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-5 md:grid-cols-2"
              >
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    نام محصول
                  </label>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    placeholder="مثلاً انگشتر طلای ظریف"
                    className="h-12 w-full rounded-xl border border-[#DDE7E1] bg-[#FAFCFB] px-4 text-sm outline-none transition focus:border-[#C9A227] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    دسته‌بندی
                  </label>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category: event.target.value,
                      })
                    }
                    className="h-12 w-full rounded-xl border border-[#DDE7E1] bg-[#FAFCFB] px-4 text-sm outline-none transition focus:border-[#C9A227] focus:bg-white"
                  >
                    <option>انگشتر</option>
                    <option>گردنبند</option>
                    <option>دستبند</option>
                    <option>گوشواره</option>
                    <option>النگو</option>
                    <option>نیم‌ست</option>
                    <option>سایر</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    وزن
                  </label>

                  <input
                    value={form.weight}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        weight: event.target.value,
                      })
                    }
                    placeholder="مثلاً ۳.۲ گرم"
                    className="h-12 w-full rounded-xl border border-[#DDE7E1] bg-[#FAFCFB] px-4 text-sm outline-none transition focus:border-[#C9A227] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    عیار
                  </label>

                  <select
                    value={form.karat}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        karat: event.target.value,
                      })
                    }
                    className="h-12 w-full rounded-xl border border-[#DDE7E1] bg-[#FAFCFB] px-4 text-sm outline-none transition focus:border-[#C9A227] focus:bg-white"
                  >
                    <option>۱۸ عیار</option>
                    <option>۲۴ عیار</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    اجرت
                  </label>

                  <input
                    value={form.wage}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        wage: event.target.value,
                      })
                    }
                    placeholder="مثلاً ۸٪"
                    className="h-12 w-full rounded-xl border border-[#DDE7E1] bg-[#FAFCFB] px-4 text-sm outline-none transition focus:border-[#C9A227] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    هزینه اضافه (تومان)
                  </label>

                  <input
                    value={form.price}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        price: event.target.value,
                      })
                    }
                    placeholder="مثلاً ۰"
                    className="h-12 w-full rounded-xl border border-[#DDE7E1] bg-[#FAFCFB] px-4 text-sm outline-none transition focus:border-[#C9A227] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    وضعیت موجودی
                  </label>

                  <select
                    value={form.stock}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        stock: event.target.value,
                      })
                    }
                    className="h-12 w-full rounded-xl border border-[#DDE7E1] bg-[#FAFCFB] px-4 text-sm outline-none transition focus:border-[#C9A227] focus:bg-white"
                  >
                    <option>موجود</option>
                    <option>ناموجود</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold">
                    توضیحات کوتاه
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                    placeholder="توضیح کوتاه درباره محصول..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-[#DDE7E1] bg-[#FAFCFB] px-4 py-3 text-sm leading-7 outline-none transition focus:border-[#C9A227] focus:bg-white"
                  />
                </div>

                <div className="md:col-span-2 rounded-2xl border border-dashed border-[#D9E5DE] bg-[#FAFCFB] p-5">
                  <div className="text-sm font-bold">
                    تصاویر محصول
                  </div>

                  <div className="mt-2 text-xs leading-6 text-[#87968F]">
                    در نسخه واقعی، از همین قسمت چند تصویر برای محصول
                    بارگذاری می‌شود.
                  </div>

                  <button
                    type="button"
                    className="mt-4 rounded-xl border border-[#DDE7E1] bg-white px-4 py-2.5 text-sm font-bold text-[#426256] transition hover:border-[#C9A227]"
                  >
                    انتخاب تصاویر
                  </button>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#173C32] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#245747] md:w-auto"
                  >
                    ثبت محصول
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Products */}
            <div className="rounded-3xl border border-[#DDE7E1] bg-white">
              <div className="border-b border-[#EDF1EE] p-5 md:p-6">
                <h2 className="text-xl font-extrabold">
                  محصولات فروشگاه
                </h2>

                <p className="mt-1 text-sm text-[#71837B]">
                  برای جلوگیری از شلوغی، مدیریت محصولات را همین‌جا
                  نگه می‌داریم.
                </p>
              </div>

              <div className="divide-y divide-[#EDF1EE]">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6"
                  >
                    <div>
                      <div className="font-bold">
                        {product.name}
                      </div>

                      <div className="mt-1 text-xs text-[#83918B]">
                        {product.category} · {product.weight} ·{" "}
                        {product.price}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          product.status === "فعال"
                            ? "bg-[#EAF5EF] text-[#2E725C]"
                            : "bg-[#F3F4F4] text-[#7C8682]"
                        }`}
                      >
                        {product.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="rounded-lg border border-[#DDE7E1] px-3 py-2 text-xs font-bold text-[#426256] transition hover:border-[#C9A227]"
                      >
                        ویرایش
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleProductStatus(product.id)
                        }
                        className="rounded-lg border border-[#DDE7E1] px-3 py-2 text-xs font-bold text-[#426256] transition hover:border-[#C9A227]"
                      >
                        {product.status === "فعال"
                          ? "غیرفعال کردن"
                          : "فعال کردن"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Analytics */}
        {activeSection === "analytics" && (
          <section className="space-y-6">
            {/* Analytics Header */}
            <div className="rounded-3xl border border-[#DDE7E1] bg-white p-5 md:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold md:text-2xl">
                    آمارگیری
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-[#71837B]">
                    آمار واقعی بازدید و تعامل کاربران با محصولات و فروشگاه
                    شما.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "امروز",
                      "۷ روز",
                      "۳۰ روز",
                      "۳ ماه",
                    ] as TimeRange[]
                  ).map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setTimeRange(range)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                        timeRange === range
                          ? "bg-[#173C32] text-white"
                          : "border border-[#DDE7E1] bg-white text-[#50695F] hover:border-[#C9A227]"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {analyticsLoading && (
              <div className="rounded-2xl border border-[#DDE7E1] bg-white px-4 py-3 text-sm font-bold text-[#4C685E]">
                در حال دریافت آمار واقعی...
              </div>
            )}

            {analyticsError && (
              <div className="rounded-2xl border border-[#E6D8C8] bg-[#FFF9F2] px-4 py-3 text-sm font-bold text-[#8A6425]">
                {analyticsError}
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <div className="rounded-3xl border border-[#DDE7E1] bg-white p-5">
                <div className="text-xs text-[#82918A]">
                  بازدید کل محصولات
                </div>

                <div className="mt-3 text-2xl font-extrabold md:text-3xl">
                  {formatNumber(analyticsTotals.views)}
                </div>

                <div className="mt-2 text-xs text-[#8A9892]">
                  مشاهده صفحه محصول
                </div>
              </div>

              <div className="rounded-3xl border border-[#DDE7E1] bg-white p-5">
                <div className="text-xs text-[#82918A]">
                  بازدید یکتا
                </div>

                <div className="mt-3 text-2xl font-extrabold md:text-3xl">
                  {formatNumber(
                    analyticsTotals.uniqueViews
                  )}
                </div>

                <div className="mt-2 text-xs text-[#8A9892]">
                  کاربران/دستگاه‌های متمایز
                </div>
              </div>

              <div className="rounded-3xl border border-[#DDE7E1] bg-white p-5">
                <div className="text-xs text-[#82918A]">
                  کلیک تماس
                </div>

                <div className="mt-3 text-2xl font-extrabold text-[#173C32] md:text-3xl">
                  {formatNumber(
                    analyticsTotals.contactClicks
                  )}
                </div>

                <div className="mt-2 text-xs text-[#8A9892]">
                  کلیک روی شماره تماس
                </div>
              </div>

              <div className="rounded-3xl border border-[#DDE7E1] bg-white p-5">
                <div className="text-xs text-[#82918A]">
                  بازدید صفحه فروشگاه
                </div>

                <div className="mt-3 text-2xl font-extrabold text-[#173C32] md:text-3xl">
                  {formatNumber(
                    analyticsTotals.storePageViews
                  )}
                </div>

                <div className="mt-2 text-xs text-[#8A9892]">
                  ورود به صفحه فروشگاه
                </div>
              </div>
            </div>

            {/* Other Events */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-[#DDE7E1] bg-white p-5">
                <div className="text-sm text-[#7D8D86]">
                  کلیک نقشه
                </div>

                <div className="mt-3 text-2xl font-extrabold">
                  {formatNumber(
                    analyticsTotals.mapClicks
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-[#DDE7E1] bg-white p-5">
                <div className="text-sm text-[#7D8D86]">
                  کلیک اینستاگرام
                </div>

                <div className="mt-3 text-2xl font-extrabold">
                  {formatNumber(
                    analyticsTotals.instagramClicks
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-[#DDE7E1] bg-white p-5">
                <div className="text-sm text-[#7D8D86]">
                  نمایش محصولات در لیست
                </div>

                <div className="mt-3 text-2xl font-extrabold">
                  {formatNumber(
                    analyticsTotals.listImpressions
                  )}
                </div>
              </div>
            </div>

            {/* Product Analytics Table */}
            <div className="rounded-3xl border border-[#DDE7E1] bg-white">
              <div className="border-b border-[#EDF1EE] p-5 md:p-6">
                <h3 className="text-xl font-extrabold">
                  آمار هر محصول
                </h3>

                <p className="mt-2 text-sm text-[#71837B]">
                  برای دیدن جزئیات یک محصول، روی ردیف آن کلیک کنید.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1050px] w-full">
                  <thead>
                    <tr className="border-b border-[#EDF1EE] bg-[#FAFCFB] text-right text-xs text-[#87948E]">
                      <th className="px-5 py-4 font-medium">
                        محصول
                      </th>

                      <th className="px-5 py-4 font-medium">
                        بازدید
                      </th>

                      <th className="px-5 py-4 font-medium">
                        یکتا
                      </th>

                      <th className="px-5 py-4 font-medium">
                        تماس
                      </th>

                      <th className="px-5 py-4 font-medium">
                        نقشه
                      </th>

                      <th className="px-5 py-4 font-medium">
                        اینستاگرام
                      </th>

                      <th className="px-5 py-4 font-medium">
                        نرخ تماس
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product) => {
                      const isSelected =
                        selectedProductId === product.id;

                      if (authChecking) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#F4F8F6] text-[#173C32]"
      >
        <div className="rounded-3xl border border-[#DDE7E1] bg-white px-8 py-10 text-center shadow-sm">
          <div className="text-lg font-extrabold">
            در حال بررسی حساب فروشنده...
          </div>
          <div className="mt-2 text-sm text-[#7A8B83]">
            لطفاً چند لحظه صبر کنید.
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#F4F8F6] px-4 py-10 text-[#173C32]"
      >
        <div className="w-full max-w-md rounded-[30px] border border-[#DDE7E1] bg-white p-6 shadow-[0_20px_70px_rgba(23,60,50,0.08)] md:p-8">
          <div className="text-xs font-medium text-[#9A7518]">
            پنل فروشندگان طلایاب
          </div>
          <h1 className="mt-2 text-2xl font-extrabold">
            ورود به پنل فروشگاه
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#71837B]">
            ایمیل خود را وارد کنید تا لینک ورود امن برایتان ارسال شود.
          </p>

          <form
            onSubmit={handleMagicLink}
            className="mt-7 space-y-4"
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@example.com"
              dir="ltr"
              className="h-12 w-full rounded-2xl border border-[#DDE7E1] bg-[#FAFCFB] px-4 text-sm outline-none focus:border-[#C9A227] focus:bg-white"
            />

            {authError && (
              <div className="rounded-2xl border border-[#E6D8C8] bg-[#FFF9F2] px-4 py-3 text-xs leading-6 text-[#8A6425]">
                {authError}
              </div>
            )}

            {authMessage && (
              <div className="rounded-2xl border border-[#CDE3D7] bg-[#EEF8F2] px-4 py-3 text-xs leading-6 text-[#2E725C]">
                {authMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={authSending}
              className="h-12 w-full rounded-2xl bg-[#173C32] px-5 text-sm font-bold text-white disabled:opacity-60"
            >
              {authSending
                ? "در حال ارسال..."
                : "ارسال لینک ورود"}
            </button>
          </form>

          <Link
            href="/gold"
            className="mt-5 flex justify-center text-sm font-bold text-[#A27A17] hover:underline"
          >
            بازگشت به سایت
          </Link>
        </div>
      </main>
    );
  }

  if (!shop) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#F4F8F6] px-4 py-10 text-[#173C32]"
      >
        <div className="mx-auto max-w-2xl rounded-[30px] border border-[#DDE7E1] bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[#9A7518]">
                راه‌اندازی فروشگاه
              </div>
              <h1 className="mt-2 text-2xl font-extrabold">
                فروشگاهت را ثبت کن
              </h1>
              <p className="mt-2 text-sm leading-7 text-[#71837B]">
                برای شروع، اطلاعات پایه فروشگاه را ثبت کن.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className="rounded-xl border border-[#DDE7E1] px-4 py-2 text-xs font-bold text-[#50695F]"
            >
              خروج
            </button>
          </div>

          <form
            onSubmit={handleCreateShop}
            className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold">
                نام فروشگاه
              </label>
              <input
                value={onboarding.shopName}
                onChange={(event) =>
                  setOnboarding({
                    ...onboarding,
                    shopName: event.target.value,
                  })
                }
                placeholder="مثلاً گالری طلای آریا"
                className="h-12 w-full rounded-xl border border-[#DDE7E1] bg-[#FAFCFB] px-4 text-sm outline-none focus:border-[#C9A227] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                شهر
              </label>
              <input
                value={onboarding.city}
                onChange={(event) =>
                  setOnboarding({
                    ...onboarding,
                    city: event.target.value,
                  })
                }
                placeholder="مثلاً ارومیه"
                className="h-12 w-full rounded-xl border border-[#DDE7E1] bg-[#FAFCFB] px-4 text-sm outline-none focus:border-[#C9A227] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                تلفن
              </label>
              <input
                value={onboarding.phone}
                onChange={(event) =>
                  setOnboarding({
                    ...onboarding,
                    phone: event.target.value,
                  })
                }
                placeholder="044..."
                dir="ltr"
                className="h-12 w-full rounded-xl border border-[#DDE7E1] bg-[#FAFCFB] px-4 text-sm outline-none focus:border-[#C9A227] focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold">
                اینستاگرام
              </label>
              <input
                value={onboarding.instagram}
                onChange={(event) =>
                  setOnboarding({
                    ...onboarding,
                    instagram: event.target.value.replace(/^@/, ""),
                  })
                }
                placeholder="example_gold"
                dir="ltr"
                className="h-12 w-full rounded-xl border border-[#DDE7E1] bg-[#FAFCFB] px-4 text-sm outline-none focus:border-[#C9A227] focus:bg-white"
              />
            </div>

            {onboardingError && (
              <div className="md:col-span-2 rounded-2xl border border-[#E6D8C8] bg-[#FFF9F2] px-4 py-3 text-sm text-[#8A6425]">
                {onboardingError}
              </div>
            )}

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={onboardingSaving}
                className="rounded-xl bg-[#173C32] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {onboardingSaving
                  ? "در حال ثبت..."
                  : "ساخت فروشگاه"}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
                        <tr
                          key={product.id}
                          onClick={() =>
                            setSelectedProductId(product.id)
                          }
                          className={`cursor-pointer border-b border-[#F0F3F1] transition last:border-b-0 ${
                            isSelected
                              ? "bg-[#F4F9F6]"
                              : "hover:bg-[#FAFCFB]"
                          }`}
                        >
                          <td className="px-5 py-5">
                            <div className="font-bold">
                              {product.name}
                            </div>

                            <div className="mt-1 text-xs text-[#8A9892]">
                              {product.category}
                            </div>
                          </td>

                          <td className="px-5 py-5 text-sm font-bold">
                            {formatNumber(product.views)}
                          </td>

                          <td className="px-5 py-5 text-sm">
                            {formatNumber(
                              product.uniqueViews
                            )}
                          </td>

                          <td className="px-5 py-5 text-sm font-bold text-[#173C32]">
                            {formatNumber(
                              product.contactClicks
                            )}
                          </td>

                          <td className="px-5 py-5 text-sm">
                            {formatNumber(product.mapClicks)}
                          </td>

                          <td className="px-5 py-5 text-sm">
                            {formatNumber(
                              product.instagramClicks
                            )}
                          </td>

                          <td className="px-5 py-5 text-sm font-bold text-[#A17915]">
                            {calculateRate(
                              product.contactClicks,
                              product.views
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Product Detail */}
            {selectedAnalytics && (
              <div className="rounded-3xl border border-[#DDE7E1] bg-white p-5 md:p-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xs text-[#A17B1A]">
                      جزئیات آمار محصول
                    </div>

                    <h3 className="mt-2 text-xl font-extrabold">
                      {selectedAnalytics.name}
                    </h3>

                    <div className="mt-1 text-sm text-[#7B8B84]">
                      {timeRange}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#F6F9F7] px-4 py-3 text-right">
                    <div className="text-xs text-[#87958F]">
                      نرخ تماس
                    </div>

                    <div className="mt-1 text-xl font-extrabold text-[#173C32]">
                      {calculateRate(
                        selectedAnalytics.contactClicks,
                        selectedAnalytics.views
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-[#F7FAF8] p-4">
                    <div className="text-xs text-[#84928C]">
                      بازدید صفحه
                    </div>

                    <div className="mt-2 text-xl font-extrabold">
                      {formatNumber(
                        selectedAnalytics.views
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#F7FAF8] p-4">
                    <div className="text-xs text-[#84928C]">
                      بازدید یکتا
                    </div>

                    <div className="mt-2 text-xl font-extrabold">
                      {formatNumber(
                        selectedAnalytics.uniqueViews
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#F7FAF8] p-4">
                    <div className="text-xs text-[#84928C]">
                      کلیک تماس
                    </div>

                    <div className="mt-2 text-xl font-extrabold">
                      {formatNumber(
                        selectedAnalytics.contactClicks
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#F7FAF8] p-4">
                    <div className="text-xs text-[#84928C]">
                      کلیک نقشه
                    </div>

                    <div className="mt-2 text-xl font-extrabold">
                      {formatNumber(
                        selectedAnalytics.mapClicks
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-[#E3ECE7] p-4">
                    <div className="text-xs text-[#84928C]">
                      نمایش در لیست
                    </div>

                    <div className="mt-2 text-lg font-extrabold">
                      {formatNumber(
                        selectedAnalytics.listImpressions
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E3ECE7] p-4">
                    <div className="text-xs text-[#84928C]">
                      کلیک اینستاگرام
                    </div>

                    <div className="mt-2 text-lg font-extrabold">
                      {formatNumber(
                        selectedAnalytics.instagramClicks
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E3ECE7] p-4">
                    <div className="text-xs text-[#84928C]">
                      بازدید صفحه فروشگاه
                    </div>

                    <div className="mt-2 text-lg font-extrabold">
                      {formatNumber(
                        selectedAnalytics.storePageViews
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Important note */}
            <div className="rounded-2xl border border-[#E4E7E5] bg-white p-4 text-xs leading-7 text-[#7A8882]">
              نکته: «کلیک تماس» به معنی کلیک کاربر روی شماره تماس است و لزوماً به معنی برقراری تماس واقعی نیست. این رویدادها همین حالا در سیستم ثبت می‌شوند.
            </div>
          </section>
        )}
      </div>
    </main>
  );
}