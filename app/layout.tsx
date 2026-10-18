import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thetala.ir"),
  title: {
    default: "TheTala | THETALA",
    template: "%s | TheTala",
  },
  description: "جستجو، مقایسه و ارتباط مستقیم با فروشگاه‌های طلا",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TheTala | THETALA",
    description: "جستجو، مقایسه و ارتباط مستقیم با فروشگاه‌های طلا",
    url: "https://thetala.ir",
    siteName: "TheTala",
    locale: "fa_IR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={geistSans.variable + " " + geistMono.variable + " h-full antialiased"}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
