"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { trackEvent } from "../../../lib/analytics";

type ProductData = {
  id: number;
  title: string;
  category: string;
  weight: number;
  karat: number;
  wageValue: number;
  wageType: "percent" | "fixed";
  stock: string;
  price: number;
  baseGoldPrice: number;
  stone: string;
  color: string;
  wageTypeLabel: string;
  productCode: string;
  description: string;
  shop: {
    id: number;
    name: string;
    city: string;
    address: string;
    phone: string;
    instagram: string;
    latitude: number | null;
    longitude: number | null;
  };
  images: string[];
};

type RelatedProduct = {
  id: number;
  title: string;
  category: string;
  price: string;
  image: string;
};

type RawProduct = {
  id: number;
  shop_id: number;
  category_id: number | null;
  title: string | null;
  description: string | null;
  weight: number | null;
  karat: number | null;
  wage_type: string | null;
  wage_value: number | null;
  profit_percent: number | null;
  extra_fee: number | null;
  image: string | null;
  status: string | null;
};

type RawShop = {
  id: number;
  shop_name: string | null;
  city: string | null;
  phone: string | null;
  instagram: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string | null;
};

function formatToman(value: number) {
  return `${Math.round(value).toLocaleString("fa-IR")} تومان`;
}

function calculatePrice(product: RawProduct, gold18Price: number) {
  const weight = Number(product.weight ?? 0);
  const goldValue = weight * gold18Price;
  const wage =
    product.wage_type === "percent"
      ? goldValue * (Number(product.wage_value ?? 0) / 100)
      : Number(product.wage_value ?? 0);
  const profit =
    (goldValue + wage) *
    (Number(product.profit_percent ?? 0) / 100);
  const extra = Number(product.extra_fee ?? 0);

  return {
    goldValue,
    wage,
    profit,
    extra,
    total: goldValue + wage + profit + extra,
  };
}

function createProductData(
  rawProduct: RawProduct,
  shop: RawShop,
  categoryName: string,
  gold18Price: number
): ProductData {
  const pricing = calculatePrice(rawProduct, gold18Price);

  return {
    id: rawProduct.id,
    title: rawProduct.title ?? "محصول طلا",
    category: categoryName || "سایر",
    weight: Number(rawProduct.weight ?? 0),
    karat: Number(rawProduct.karat ?? 18),
    wageValue: Number(rawProduct.wage_value ?? 0),
    wageType: rawProduct.wage_type === "percent" ? "percent" : "fixed",
    stock: rawProduct.status === "active" ? "موجود" : "ناموجود",
    price: pricing.total,
    baseGoldPrice: gold18Price,
    stone: "نامشخص",
    color: "طلای زرد",
    wageTypeLabel:
      rawProduct.wage_type === "percent" ? "درصدی" : "ثابت",
    productCode: `TY-${String(rawProduct.id).padStart(4, "0")}`,
    description:
      rawProduct.description ||
      "اطلاعات توضیحات این محصول هنوز توسط فروشگاه تکمیل نشده است.",
    shop: {
      id: shop.id,
      name: shop.shop_name ?? "فروشگاه طلا",
      city: shop.city ?? "—",
      address: shop.city ?? "موقعیت فروشگاه",
      phone: shop.phone ?? "",
      instagram: shop.instagram ?? "",
      latitude: shop.latitude,
      longitude: shop.longitude,
    },
    images: [rawProduct.image || "/hero-luxury.jpg"],
  };
}

export default function ProductPage() {
  const params = useParams<{ productId: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const viewTracked = useRef(false);

  useEffect(() => {
    const productId = Number(params.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      setErrorMessage("شناسه محصول نامعتبر است.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setErrorMessage("");

      const { data: rawProduct, error: productError } =
        await supabase
          .from("products")
          .select(
            "id, shop_id, category_id, title, description, weight, karat, wage_type, wage_value, profit_percent, extra_fee, image, status"
          )
          .eq("id", productId)
          .eq("status", "active")
          .maybeSingle();

      if (productError || !rawProduct) {
        if (!cancelled) {
          setErrorMessage("محصول موردنظر پیدا نشد.");
          setLoading(false);
        }
        return;
      }

      const [shopResult, categoryResult, marketResult, relatedResult] =
        await Promise.all([
          supabase
            .from("shops___")
            .select(
              "id, shop_name, city, phone, instagram, latitude, longitude, status"
            )
            .eq("id", rawProduct.shop_id)
            .eq("status", "active")
            .maybeSingle(),
          rawProduct.category_id
            ? supabase
                .from("categories")
                .select("name")
                .eq("id", rawProduct.category_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          supabase
            .from("market_prices")
            .select("gold18, updated_at")
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("products")
            .select(
              "id, title, weight, karat, wage_type, wage_value, profit_percent, extra_fee, image, category_id"
            )
            .eq("shop_id", rawProduct.shop_id)
            .eq("status", "active")
            .neq("id", rawProduct.id)
            .order("id", { ascending: false })
            .limit(3),
        ]);

      if (
        shopResult.error ||
        !shopResult.data ||
        categoryResult.error ||
        marketResult.error
      ) {
        if (!cancelled) {
          setErrorMessage("دریافت اطلاعات کامل محصول ناموفق بود.");
          setLoading(false);
        }
        return;
      }

      const gold18Price = Number(marketResult.data?.gold18 ?? 0);
      const nextProduct = createProductData(
        rawProduct as RawProduct,
        shopResult.data as RawShop,
        categoryResult.data?.name ?? "سایر",
        gold18Price
      );

      const relatedRows = relatedResult.data ?? [];
      const categoryIds = [
        ...new Set(
          relatedRows
            .map((row) => row.category_id)
            .filter((id): id is number => id !== null)
        ),
      ];

      const categoryMap = new Map<number, string>();

      if (categoryIds.length) {
        const { data: categoryRows } = await supabase
          .from("categories")
          .select("id, name")
          .in("id", categoryIds);

        (categoryRows ?? []).forEach((row) => {
          categoryMap.set(row.id, row.name);
        });
      }

      const nextRelated = relatedRows.map((row) => ({
        id: row.id,
        title: row.title ?? "محصول طلا",
        category: categoryMap.get(row.category_id) ?? "سایر",
        price: formatToman(
          calculatePrice(row as RawProduct, gold18Price).total
        ),
        image: row.image || "/hero-luxury.jpg",
      }));

      if (!cancelled) {
        setProduct(nextProduct);
        setRelatedProducts(nextRelated);
        setSelectedImage(0);
        setLoading(false);
      }
    }

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [params.productId]);

  useEffect(() => {
    if (!product || viewTracked.current) return;
    viewTracked.current = true;

    void trackEvent({
      eventType: "product_view",
      shopId: product.shop.id,
      productId: product.id,
    });
  }, [product]);

  const nextImage = () => {
    if (!product) return;
    setSelectedImage((current) =>
      current === product.images.length - 1 ? 0 : current + 1
    );
  };

  const previousImage = () => {
    if (!product) return;
    setSelectedImage((current) =>
      current === 0 ? product.images.length - 1 : current - 1
    );
  };

  if (loading) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F4F8F6] text-[#173C32]">
        <div className="rounded-3xl border border-[#DDE7E1] bg-white px-8 py-10 text-center shadow-sm">
          <div className="text-lg font-extrabold">در حال بارگذاری محصول...</div>
          <div className="mt-2 text-sm text-[#7A8B83]">
            اطلاعات محصول از فروشگاه دریافت می‌شود.
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F4F8F6] text-[#173C32]">
        <div className="rounded-3xl border border-[#DDE7E1] bg-white px-8 py-10 text-center shadow-sm">
          <div className="text-lg font-extrabold">{errorMessage || "محصول پیدا نشد."}</div>
          <Link
            href="/gold"
            className="mt-5 inline-flex rounded-xl bg-[#173C32] px-5 py-3 text-sm font-bold text-white"
          >
            بازگشت به فهرست طلاها
          </Link>
        </div>
      </main>
    );
  }

    return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-[#EDF7F2] via-[#F8FBF9] to-[#ECF5F0] text-[#173C32]"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#DDE9E2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-[92%] max-w-[1440px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A227] text-[#C9A227]">
              <span className="text-lg font-bold">ط</span>
            </div>

            <div className="leading-none">
              <div className="text-lg font-extrabold text-[#173C32]">
                طلایاب
              </div>

              <div className="mt-1 text-[9px] tracking-[0.28em] text-[#A27A17]">
                TALAYAB
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link
              href="/"
              className="text-[#426256] transition hover:text-[#B28A1E]"
            >
              خانه
            </Link>

            <Link
              href="/gold"
              className="font-bold text-[#B28A1E]"
            >
              طلاها
            </Link>

            <Link
              href="/shops"
              className="text-[#426256] transition hover:text-[#B28A1E]"
            >
              فروشگاه‌ها
            </Link>

            <Link
              href="/"
              className="text-[#426256] transition hover:text-[#B28A1E]"
            >
              مجله
            </Link>

            <Link
              href="/"
              className="text-[#426256] transition hover:text-[#B28A1E]"
            >
              درباره ما
            </Link>
          </nav>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE7E1] text-[#173C32] md:hidden"
            aria-label="منو"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto w-[92%] max-w-[1440px] py-5 md:py-7">
        {/* Breadcrumb */}
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#71837B]">
          <Link href="/" className="transition hover:text-[#B28A1E]">
            خانه
          </Link>

          <span>/</span>

          <Link
            href="/gold"
            className="transition hover:text-[#B28A1E]"
          >
            طلاها
          </Link>

          <span>/</span>

          <span className="text-[#173C32]">
            {product.title}
          </span>
        </div>

        {/* Main Product Card */}
        <div className="rounded-[30px] border border-[#D9E7DF] bg-white p-4 shadow-[0_18px_60px_rgba(23,60,50,0.08)] md:p-7">
          {/* Gallery */}
          <section>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[24px] bg-[#EEF5F1]">
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                className="absolute inset-0 z-10 cursor-zoom-in"
                aria-label="نمایش بزرگ تصویر"
              />

              <img
                src={product.images[selectedImage]}
                alt={product.title}
                className="h-full w-full object-cover"
              />

              {/* Counter */}
              <div className="absolute right-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-[#173C32] shadow-sm">
                {selectedImage + 1} / {product.images.length}
              </div>

              {/* Previous */}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  previousImage();
                }}
                aria-label="تصویر قبلی"
                className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-[#173C32] shadow-md transition hover:bg-white"
              >
                ›
              </button>

              {/* Next */}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  nextImage();
                }}
                aria-label="تصویر بعدی"
                className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-[#173C32] shadow-md transition hover:bg-white"
              >
                ‹
              </button>
            </div>

            {/* Thumbnails */}
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  aria-label={`تصویر ${index + 1}`}
                  className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition md:h-24 md:w-28 ${
                    selectedImage === index
                      ? "border-[#C9A227]"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />

                  {selectedImage === index && (
                    <div className="absolute inset-0 bg-[#173C32]/10" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Product Overview */}
          <section className="mt-10">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-[#F6F1DE] px-3 py-1 text-xs font-medium text-[#9C7617]">
                  {product.category}
                </div>

                <h1 className="text-2xl font-extrabold tracking-tight text-[#173C32] md:text-4xl">
                  {product.title}
                </h1>
              </div>

              <div className="rounded-2xl border border-[#DCE9E2] bg-[#F8FBF9] px-4 py-3 text-left">
                <div className="text-xs text-[#819189]">
                  آخرین بروزرسانی قیمت
                </div>

                <div className="mt-1 text-sm font-semibold text-[#31584D]">
                  قیمت زنده از بازار طلایاب
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-[#F7FAF8] p-4">
                <div className="text-xs text-[#84948C]">
                  وزن
                </div>

                <div className="mt-2 font-bold text-[#173C32]">
                  {product.weight.toLocaleString("fa-IR")} گرم
                </div>
              </div>

              <div className="rounded-2xl bg-[#F7FAF8] p-4">
                <div className="text-xs text-[#84948C]">
                  عیار
                </div>

                <div className="mt-2 font-bold text-[#173C32]">
                  {product.karat.toLocaleString("fa-IR")} عیار
                </div>
              </div>

              <div className="rounded-2xl bg-[#F7FAF8] p-4">
                <div className="text-xs text-[#84948C]">
                  اجرت
                </div>

                <div className="mt-2 font-bold text-[#173C32]">
                  {product.wageValue.toLocaleString("fa-IR")}{product.wageType === "percent" ? "٪" : " تومان"}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F7FAF8] p-4">
                <div className="text-xs text-[#84948C]">
                  وضعیت
                </div>

                <div className="mt-2 font-bold text-[#2E725C]">
                  {product.stock}
                </div>
              </div>
            </div>
          </section>

          {/* Price */}
          <section className="mt-8 rounded-[26px] border border-[#D9E7E0] bg-[#F8FBF9] p-5 md:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm text-[#71837B]">
                  قیمت فعلی محصول
                </div>

                <div className="mt-2 text-2xl font-extrabold text-[#173C32] md:text-4xl">
                  {formatToman(product.price)}
                </div>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3">
                <div className="text-xs text-[#82928A]">
                  قیمت هر گرم طلای ۱۸ عیار
                </div>

                <div className="mt-1 font-bold text-[#173C32]">
                  {formatToman(product.baseGoldPrice)}
                </div>
              </div>
            </div>
          </section>

          {/* Price Calculation */}
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-extrabold text-[#173C32]">
                نحوه محاسبه قیمت
              </h2>

              <p className="mt-2 text-sm leading-7 text-[#71837B]">
                قیمت فعلی محاسبه‌شده محصول بر اساس قیمت روز طلا، وزن، اجرت و سایر
                هزینه‌های مربوط به محصول محاسبه می‌شود.
              </p>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#DDE8E1]">
              <div className="flex items-center justify-between border-b border-[#E7EEE9] bg-[#FAFCFB] px-5 py-4">
                <span className="text-sm text-[#71837B]">
                  قیمت پایه طلا
                </span>

                <span className="font-bold text-[#173C32]">
                  {formatToman(product.baseGoldPrice)}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#E7EEE9] px-5 py-4">
                <span className="text-sm text-[#71837B]">
                  وزن
                </span>

                <span className="font-bold text-[#173C32]">
                  {product.weight.toLocaleString("fa-IR")} گرم
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#E7EEE9] bg-[#FAFCFB] px-5 py-4">
                <span className="text-sm text-[#71837B]">
                  اجرت ساخت
                </span>

                <span className="font-bold text-[#173C32]">
                  {product.wageValue.toLocaleString("fa-IR")}{product.wageType === "percent" ? "٪" : " تومان"}
                </span>
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <span className="font-bold text-[#173C32]">
                  قیمت نهایی
                </span>

                <span className="text-lg font-extrabold text-[#A57D18]">
                  {formatToman(product.price)}
                </span>
              </div>
            </div>
          </section>

          {/* Details */}
          <section className="mt-10">
            <h2 className="text-xl font-extrabold text-[#173C32]">
              جزئیات محصول
            </h2>

            <div className="mt-4 grid grid-cols-1 overflow-hidden rounded-[24px] border border-[#DDE8E1] md:grid-cols-2">
              <div className="flex items-center justify-between border-b border-[#E8EFEB] px-5 py-4 md:border-l">
                <span className="text-sm text-[#7A8B83]">
                  نوع محصول
                </span>

                <span className="font-semibold text-[#173C32]">
                  {product.category}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#E8EFEB] px-5 py-4">
                <span className="text-sm text-[#7A8B83]">
                  رنگ طلا
                </span>

                <span className="font-semibold text-[#173C32]">
                  {product.color}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#E8EFEB] px-5 py-4 md:border-l">
                <span className="text-sm text-[#7A8B83]">
                  سنگ
                </span>

                <span className="font-semibold text-[#173C32]">
                  {product.stone}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#E8EFEB] px-5 py-4">
                <span className="text-sm text-[#7A8B83]">
                  نوع اجرت
                </span>

                <span className="font-semibold text-[#173C32]">
                  {product.wageTypeLabel}
                </span>
              </div>

              <div className="flex items-center justify-between px-5 py-4 md:border-l">
                <span className="text-sm text-[#7A8B83]">
                  کد محصول
                </span>

                <span className="font-semibold text-[#173C32]">
                  {product.productCode}
                </span>
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-[#7A8B83]">
                  عیار
                </span>

                <span className="font-semibold text-[#173C32]">
                  {product.karat.toLocaleString("fa-IR")} عیار
                </span>
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="mt-10">
            <h2 className="text-xl font-extrabold text-[#173C32]">
              توضیحات
            </h2>

            <div className="mt-4 rounded-[24px] border border-[#DDE8E1] bg-[#FAFCFB] p-5 md:p-6">
              <p className="text-sm leading-8 text-[#64766F] md:text-base">
                {product.description}
              </p>
            </div>
          </section>

          {/* Seller */}
          <section className="mt-10">
            <h2 className="text-xl font-extrabold text-[#173C32]">
              فروشگاه عرضه‌کننده
            </h2>

            <div className="mt-4 rounded-[26px] border border-[#DDE8E1] bg-white p-5 md:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <Link
                    href={"/shop/" + product.shop.id}
                    className="block text-2xl font-extrabold text-[#173C32] hover:text-[#A57D18] hover:underline"
                  >
                    {product.shop.name}
                  </Link>

                  <div className="mt-2 text-sm text-[#71837B]">
                    {product.shop.city} · {product.shop.address}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={`tel:${product.shop.phone}`}
                    onClick={() => {
                      void trackEvent({
                        eventType: "contact_click",
                        shopId: product.shop.id,
                        productId: product.id,
                      });
                    }}
                    className="rounded-xl bg-[#173C32] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#245747]"
                  >
                    تماس با فروشگاه
                  </a>

                  <a
                    href={`https://instagram.com/${product.shop.instagram}`}
                    onClick={() => {
                      void trackEvent({
                        eventType: "instagram_click",
                        shopId: product.shop.id,
                        productId: product.id,
                      });
                    }}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-[#DDE8E1] bg-white px-5 py-3 text-sm font-bold text-[#31584D] transition hover:border-[#C9A227]"
                  >
                    اینستاگرام
                  </a>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[#E1EAE5]">
                <div className="flex min-h-48 items-center justify-center bg-[#EFF5F1] text-center">
                  <div>
                    <div className="text-lg font-bold text-[#31584D]">
                      موقعیت فروشگاه
                    </div>

                    <div className="mt-2 text-sm text-[#7B8C84]">
                      {product.shop.address}
                    </div>

                    <div className="mt-4">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          product.shop.address
                        )}`}
                        onClick={() => {
                          void trackEvent({
                            eventType: "map_click",
                            shopId: product.shop.id,
                            productId: product.id,
                          });
                        }}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-[#A57D18] hover:underline"
                      >
                        مشاهده روی نقشه
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Related Products */}
          <section className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#173C32]">
                  محصولات مرتبط
                </h2>

                <p className="mt-2 text-sm text-[#71837B]">
                  محصولات دیگری که ممکن است مورد توجه شما باشد
                </p>
              </div>

              <Link
                href="/gold"
                className="text-sm font-bold text-[#A57D18] hover:underline"
              >
                مشاهده همه
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/gold/${item.id}`}
                  className="group overflow-hidden rounded-[24px] border border-[#DDE8E1] bg-white transition hover:-translate-y-1 hover:border-[#D5BB6D] hover:shadow-[0_15px_40px_rgba(23,60,50,0.08)]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#EEF5F1]">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-5">
                    <div className="text-xs text-[#A47C19]">
                      {item.category}
                    </div>

                    <div className="mt-2 text-lg font-bold text-[#173C32]">
                      {item.title}
                    </div>

                    <div className="mt-3 font-extrabold text-[#31584D]">
                      {item.price}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#DDE8E1] bg-white/95 p-3 backdrop-blur md:hidden">
        <a
          href={`tel:${product.shop.phone}`}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#173C32] text-sm font-bold text-white"
        >
          تماس با فروشگاه
        </a>
      </div>

      {/* Fullscreen Viewer */}
      {viewerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setViewerOpen(false)}
        >
          <button
            type="button"
            onClick={() => setViewerOpen(false)}
            aria-label="بستن"
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur transition hover:bg-white/25"
          >
            ×
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              previousImage();
            }}
            aria-label="تصویر قبلی"
            className="absolute right-5 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur transition hover:bg-white/25"
          >
            ›
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              nextImage();
            }}
            aria-label="تصویر بعدی"
            className="absolute left-5 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur transition hover:bg-white/25"
          >
            ‹
          </button>

          <div
            className="relative max-h-[90vh] max-w-[95vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={product.images[selectedImage]}
              alt={product.title}
              className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur">
              {selectedImage + 1} / {product.images.length}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}