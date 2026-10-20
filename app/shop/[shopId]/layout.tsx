import type { Metadata } from "next";
import { absoluteImageUrl, getShopSeoData } from "../../../lib/seo-data";

type Props = {
  children: React.ReactNode;
  params: Promise<{ shopId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopId } = await params;
  const id = Number(shopId);

  if (!Number.isInteger(id) || id <= 0) {
    return {
      title: "فروشگاه طلا پیدا نشد",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const shop = await getShopSeoData(id);

  if (!shop) {
    return {
      title: "فروشگاه طلا پیدا نشد",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const name = shop.shop_name?.trim() || "فروشگاه طلا";
  const city = shop.city?.trim();
  const description =
    shop.description?.trim() ||
    `${name}${city ? ` در ${city}` : ""}؛ محصولات و اطلاعات فروشگاه در TheTala.`;
  const image = absoluteImageUrl(shop.logo);

  return {
    title: name,
    description,
    alternates: {
      canonical: `/shop/${id}`,
    },
    openGraph: {
      title: `${name} | TheTala`,
      description,
      url: `https://thetala.ir/shop/${id}`,
      type: "website",
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
  };
}

export default async function ShopLayout({ children, params }: Props) {
  const { shopId } = await params;
  const id = Number(shopId);

  if (!Number.isInteger(id) || id <= 0) {
    return children;
  }

  const shop = await getShopSeoData(id);

  if (!shop) {
    return children;
  }

  const name = shop.shop_name?.trim() || "فروشگاه طلا";
  const city = shop.city?.trim();
  const description =
    shop.description?.trim() ||
    `${name}${city ? ` در ${city}` : ""}؛ محصولات و اطلاعات فروشگاه در TheTala.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "JewelryStore",
        "@id": `https://thetala.ir/shop/${id}#business`,
        name,
        url: `https://thetala.ir/shop/${id}`,
        description,
        ...(shop.phone ? { telephone: shop.phone } : {}),
        address: {
          "@type": "PostalAddress",
          ...(city ? { addressLocality: city } : {}),
          addressCountry: "IR",
        },
        ...(shop.latitude !== null && shop.longitude !== null
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude: Number(shop.latitude),
                longitude: Number(shop.longitude),
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "خانه",
            item: "https://thetala.ir/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "فروشگاه‌های طلا",
            item: "https://thetala.ir/shops",
          },
          {
            "@type": "ListItem",
            position: 3,
            name,
            item: `https://thetala.ir/shop/${id}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
