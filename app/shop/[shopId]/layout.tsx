import type { Metadata } from "next";
import {
  absoluteImageUrl,
  getShopSeoData,
} from "../../../lib/seo-data";

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

export default function ShopLayout({ children }: Props) {
  return children;
}
