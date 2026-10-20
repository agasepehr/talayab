import type { Metadata } from "next";
import {
  absoluteImageUrl,
  getProductPrice,
  getProductSeoData,
} from "../../../lib/seo-data";

type Props = {
  children: React.ReactNode;
  params: Promise<{ productId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const id = Number(productId);

  if (!Number.isInteger(id) || id <= 0) {
    return {
      title: "محصول طلا پیدا نشد",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const product = await getProductSeoData(id);

  if (!product) {
    return {
      title: "محصول طلا پیدا نشد",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title = product.title?.trim() || "محصول طلا";
  const description =
    product.description?.trim() ||
    `${title}؛ مشخصات وزن، عیار و قیمت روز طلا در TheTala.`;
  const image = absoluteImageUrl(product.image);

  return {
    title,
    description,
    alternates: {
      canonical: `/gold/${id}`,
    },
    openGraph: {
      title: `${title} | TheTala`,
      description,
      url: `https://thetala.ir/gold/${id}`,
      type: "website",
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
  };
}

export default function ProductLayout({ children }: Props) {
  return children;
}
