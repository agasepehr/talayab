import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "فروشگاه‌های طلا",
  description:
    "فهرست فروشگاه‌های طلا در TheTala؛ فروشگاه‌ها را ببینید و محصولات و مشخصاتشان را مقایسه کنید.",
  alternates: {
    canonical: "/shops",
  },
  openGraph: {
    title: "فروشگاه‌های طلا | TheTala",
    description:
      "فروشگاه‌های فعال TheTala را ببینید و محصولات طلا را مقایسه کنید.",
    url: "https://thetala.ir/shops",
    type: "website",
  },
};

export default function ShopsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
