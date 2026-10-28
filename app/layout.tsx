import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";

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
  description:
    "جستجو، مقایسه و ارتباط مستقیم با فروشگاه‌های طلا در TheTala.",
  applicationName: "TheTala",
  authors: [{ name: "TheTala" }],
  creator: "TheTala",
  publisher: "TheTala",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TheTala | THETALA",
    description:
      "جستجو، مقایسه و ارتباط مستقیم با فروشگاه‌های طلا در TheTala.",
    url: "https://thetala.ir",
    siteName: "TheTala",
    locale: "fa_IR",
    type: "website",
  },
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://thetala.ir/#organization",
      name: "TheTala",
      alternateName: "THETALA",
      url: "https://thetala.ir",
    },
    {
      "@type": "WebSite",
      "@id": "https://thetala.ir/#website",
      url: "https://thetala.ir",
      name: "TheTala",
      alternateName: "THETALA",
      inLanguage: "fa-IR",
      publisher: {
        "@id": "https://thetala.ir/#organization",
      },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={
        geistSans.variable +
        " " +
        geistMono.variable +
        " h-full antialiased"
      }
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteJsonLd),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">\n        <ChunkRecovery />\n        {children}\n      </body>
    </html>
  );
}
