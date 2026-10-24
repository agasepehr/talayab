import type { Metadata } from "next";
import Link from "next/link";

type Shop = {
  id: number;
  shop_name: string | null;
  city: string | null;
  description: string | null;
};

type Product = {
  id: number;
  shop_id: number;
  title: string | null;
  description: string | null;
  weight: number | null;
  karat: number | null;
  image: string | null;
};

const city = "ارومیه";
const baseUrl = "https://thetala.ir";
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://dzfiqtnaiecfmiiyrjrh.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_upt0vLgM6Ei-BD8mG0sCjg_IvO7_Dwl";

export const metadata: Metadata = {
  title: "خرید و مقایسه طلا در ارومیه",
  description:
    "فروشگاه‌ها و محصولات طلا در ارومیه را در TheTala ببین، وزن، عیار و اجرت را مقایسه کن و مستقیم با فروشگاه ارتباط بگیر.",
  alternates: {
    canonical: "/gold/urmia",
  },
  openGraph: {
    title: "خرید و مقایسه طلا در ارومیه | TheTala",
    description:
      "فروشگاه‌ها و محصولات طلا در ارومیه را در TheTala ببین و مقایسه کن.",
    url: baseUrl + "/gold/urmia",
    siteName: "TheTala",
    locale: "fa_IR",
    type: "website",
  },
};

async function getData() {
  const headers = {
    apikey: supabaseKey,
    Authorization: "Bearer " + supabaseKey,
  };

  const shopsResponse = await fetch(
    supabaseUrl +
      "/rest/v1/shops___?select=id,shop_name,city,description&status=eq.active&city=eq." +
      encodeURIComponent(city) +
      "&order=id.asc",
    { headers, next: { revalidate: 300 } }
  );

  if (!shopsResponse.ok) {
    return { shops: [] as Shop[], products: [] as Product[] };
  }

  const shops = (await shopsResponse.json()) as Shop[];
  const shopIds = shops.map((shop) => shop.id);

  if (!shopIds.length) {
    return { shops, products: [] as Product[] };
  }

  const productsResponse = await fetch(
    supabaseUrl +
      "/rest/v1/products?select=id,shop_id,title,description,weight,karat,image&status=eq.active&shop_id=in.(" +
      shopIds.join(",") +
      ")&order=id.desc",
    { headers, next: { revalidate: 300 } }
  );

  const products = productsResponse.ok
    ? ((await productsResponse.json()) as Product[])
    : [];

  return { shops, products };
}

export default async function UrmiaGoldPage() {
  const { shops, products } = await getData();
  const shopMap = new Map(shops.map((shop) => [shop.id, shop.shop_name || "فروشگاه طلا"]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": baseUrl + "/gold/urmia#page",
        url: baseUrl + "/gold/urmia",
        name: "خرید و مقایسه طلا در ارومیه",
        inLanguage: "fa-IR",
        description:
          "فروشگاه‌ها و محصولات طلا در ارومیه برای مقایسه وزن، عیار و اجرت.",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: baseUrl + "/" },
          { "@type": "ListItem", position: 2, name: "طلاها", item: baseUrl + "/gold" },
          { "@type": "ListItem", position: 3, name: "طلا در ارومیه", item: baseUrl + "/gold/urmia" },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: products.slice(0, 20).map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: baseUrl + "/gold/" + product.id,
          name: product.title || "محصول طلا",
        })),
      },
    ],
  };

  return (
    <main dir="rtl" className="min-h-screen bg-white text-[#173C32]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-[#E8EEE9] bg-white">
        <div className="mx-auto flex h-20 w-[92%] max-w-[1200px] items-center justify-between">
          <Link href="/" className="text-lg font-extrabold">TheTala</Link>
          <nav className="flex items-center gap-5 text-sm text-[#426256]">
            <Link href="/gold">همه طلاها</Link>
            <Link href="/shops">فروشگاه‌ها</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-[92%] max-w-[1200px] py-12 md:py-16">
        <div className="max-w-3xl">
          <div className="text-sm font-bold text-[#B28A1E]">THETALA / ارومیه</div>
          <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">خرید و مقایسه طلا در ارومیه</h1>
          <p className="mt-5 text-base leading-8 text-[#64766F] md:text-lg">
            محصولات طلا و فروشگاه‌های فعال در ارومیه را پیدا کن، وزن و عیار را بررسی کن و قبل از تماس با فروشگاه، گزینه‌ها را با هم مقایسه کن.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#DDE8E1] bg-[#F7FAF8] p-5">
            <div className="text-xs text-[#7A8B83]">فروشگاه فعال</div>
            <div className="mt-2 text-2xl font-extrabold">{shops.length.toLocaleString("fa-IR")}</div>
          </div>
          <div className="rounded-2xl border border-[#DDE8E1] bg-[#F7FAF8] p-5">
            <div className="text-xs text-[#7A8B83]">محصول فعال</div>
            <div className="mt-2 text-2xl font-extrabold">{products.length.toLocaleString("fa-IR")}</div>
          </div>
          <Link href="/shops/urmia" className="rounded-2xl border border-[#DDE8E1] bg-white p-5 hover:border-[#C9A227]">
            <div className="text-xs text-[#7A8B83]">دنبال فروشگاه هستی؟</div>
            <div className="mt-2 font-extrabold text-[#31584D]">طلافروشی‌های ارومیه ←</div>
          </Link>
        </div>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold">محصولات طلا در ارومیه</h2>
              <p className="mt-2 text-sm text-[#71837B]">مشخصات هر محصول را باز کن و در صفحه آن جزئیات کامل را ببین.</p>
            </div>
            <Link href="/gold" className="text-sm font-bold text-[#A27A17] hover:underline">همه طلاها</Link>
          </div>

          {products.length ? (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={"/gold/" + product.id}
                  className="overflow-hidden rounded-3xl border border-[#DDE8E1] bg-white transition hover:-translate-y-1 hover:border-[#C9A227] hover:shadow-[0_16px_45px_rgba(23,60,50,0.08)]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#F3F7F4]">
                    <img src={product.image || "/hero-luxury.jpg"} alt={product.title || "محصول طلا"} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold">{product.title || "محصول طلا"}</h3>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#71837B]">
                      <div className="rounded-xl bg-[#F7FAF8] p-2.5">وزن: {Number(product.weight || 0).toLocaleString("fa-IR")} گرم</div>
                      <div className="rounded-xl bg-[#F7FAF8] p-2.5">عیار: {Number(product.karat || 18).toLocaleString("fa-IR")}</div>
                    </div>
                    <div className="mt-4 text-sm font-semibold text-[#31584D]">{shopMap.get(product.shop_id)}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-[#DDE8E1] bg-[#FAFCFB] px-6 py-16 text-center text-sm text-[#71837B]">
              هنوز محصول فعالی از فروشگاه‌های ارومیه ثبت نشده است.
            </div>
          )}
        </section>

        <section className="mt-14 rounded-3xl border border-[#DDE8E1] bg-[#F7FAF8] p-7 md:p-10">
          <h2 className="text-2xl font-extrabold">راهنمای انتخاب طلا در ارومیه</h2>
          <p className="mt-4 text-sm leading-8 text-[#667971] md:text-base">
            در TheTala می‌توانی قبل از تماس با فروشگاه، وزن، عیار و اجرت محصولات را بررسی کنی. این صفحه برای پیدا کردن گزینه‌های طلا در ارومیه ساخته شده و با اضافه‌شدن فروشگاه‌ها و محصولات جدید، اطلاعات آن به‌روزرسانی می‌شود.
          </p>
        </section>
      </section>
    </main>
  );
}