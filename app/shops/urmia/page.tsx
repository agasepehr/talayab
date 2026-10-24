import type { Metadata } from "next";
import Link from "next/link";

type Shop = {
  id: number;
  shop_name: string | null;
  city: string | null;
  description: string | null;
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
  title: "طلافروشی‌های ارومیه",
  description:
    "فهرست فروشگاه‌ها و طلافروشی‌های فعال ارومیه در TheTala؛ فروشگاه را ببین، محصولاتش را بررسی کن و مستقیم ارتباط بگیر.",
  alternates: { canonical: "/shops/urmia" },
  openGraph: {
    title: "طلافروشی‌های ارومیه | TheTala",
    description:
      "فهرست فروشگاه‌ها و طلافروشی‌های فعال ارومیه در TheTala.",
    url: baseUrl + "/shops/urmia",
    siteName: "TheTala",
    locale: "fa_IR",
    type: "website",
  },
};

async function getShops() {
  const response = await fetch(
    supabaseUrl +
      "/rest/v1/shops___?select=id,shop_name,city,description&status=eq.active&city=eq." +
      encodeURIComponent(city) +
      "&order=id.asc",
    {
      headers: {
        apikey: supabaseKey,
        Authorization: "Bearer " + supabaseKey,
      },
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) return [] as Shop[];
  return (await response.json()) as Shop[];
}

export default async function UrmiaShopsPage() {
  const shops = await getShops();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": baseUrl + "/shops/urmia#page",
        url: baseUrl + "/shops/urmia",
        name: "طلافروشی‌های ارومیه",
        inLanguage: "fa-IR",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: baseUrl + "/" },
          { "@type": "ListItem", position: 2, name: "فروشگاه‌ها", item: baseUrl + "/shops" },
          { "@type": "ListItem", position: 3, name: "طلافروشی‌های ارومیه", item: baseUrl + "/shops/urmia" },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: shops.slice(0, 20).map((shop, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: baseUrl + "/shop/" + shop.id,
          name: shop.shop_name || "فروشگاه طلا",
        })),
      },
    ],
  };

  return (
    <main dir="rtl" className="min-h-screen bg-white text-[#173C32]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="border-b border-[#E8EEE9] bg-white">
        <div className="mx-auto flex h-20 w-[92%] max-w-[1200px] items-center justify-between">
          <Link href="/" className="text-lg font-extrabold">TheTala</Link>
          <nav className="flex items-center gap-5 text-sm text-[#426256]">
            <Link href="/gold">طلاها</Link>
            <Link href="/shops">همه فروشگاه‌ها</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-[92%] max-w-[1200px] py-12 md:py-16">
        <div className="max-w-3xl">
          <div className="text-sm font-bold text-[#B28A1E]">THETALA / ارومیه</div>
          <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">طلافروشی‌های ارومیه</h1>
          <p className="mt-5 text-base leading-8 text-[#64766F] md:text-lg">
            فروشگاه‌های فعال ارومیه را در TheTala ببین، محصولات هر فروشگاه را بررسی کن و قبل از تماس، گزینه‌های مختلف را مقایسه کن.
          </p>
        </div>

        {shops.length ? (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={"/shop/" + shop.id}
                className="rounded-3xl border border-[#DDE8E1] bg-white p-6 transition hover:-translate-y-1 hover:border-[#C9A227] hover:shadow-[0_16px_45px_rgba(23,60,50,0.08)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#173C32] text-xl font-extrabold text-white">
                  {(shop.shop_name || "ف").charAt(0)}
                </div>
                <h2 className="mt-5 text-xl font-extrabold">{shop.shop_name || "فروشگاه طلا"}</h2>
                <div className="mt-2 text-sm text-[#71837B]">{shop.city || city}</div>
                <p className="mt-4 min-h-14 text-sm leading-7 text-[#6F8179]">
                  {shop.description || "اطلاعات و محصولات این فروشگاه را در TheTala ببینید."}
                </p>
                <div className="mt-5 border-t border-[#EEF2EF] pt-4 text-sm font-bold text-[#31584D]">مشاهده فروشگاه ←</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-[#DDE8E1] bg-[#FAFCFB] px-6 py-16 text-center">
            <div className="text-lg font-extrabold">هنوز فروشگاه فعالی در ارومیه ثبت نشده است.</div>
            <Link href="/shops" className="mt-5 inline-flex rounded-xl bg-[#173C32] px-5 py-3 text-sm font-bold text-white">مشاهده همه فروشگاه‌ها</Link>
          </div>
        )}

        <section className="mt-14 rounded-3xl border border-[#DDE8E1] bg-[#F7FAF8] p-7 md:p-10">
          <h2 className="text-2xl font-extrabold">خرید طلا از فروشگاه‌های ارومیه</h2>
          <p className="mt-4 text-sm leading-8 text-[#667971] md:text-base">
            TheTala به‌عنوان پلتفرم مقایسه، اطلاعات فروشگاه‌ها و محصولات طلا در ارومیه را کنار هم قرار می‌دهد تا بتوانی قبل از تماس یا مراجعه، انتخاب دقیق‌تری داشته باشی.
          </p>
          <Link href="/gold/urmia" className="mt-5 inline-flex font-bold text-[#A27A17] hover:underline">مشاهده طلاهای ارومیه ←</Link>
        </section>
      </section>
    </main>
  );
}