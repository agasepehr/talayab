import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "جستجو و مقایسه طلا",
  description:
    "جستجو و مقایسه محصولات طلا بر اساس قیمت، وزن، عیار و اجرت در TheTala.",
  alternates: {
    canonical: "/gold",
  },
  openGraph: {
    title: "جستجو و مقایسه طلا | TheTala",
    description:
      "محصولات طلا را جستجو و از نظر قیمت، وزن، عیار و اجرت مقایسه کنید.",
    url: "https://thetala.ir/gold",
    type: "website",
  },
};

export default function GoldLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
