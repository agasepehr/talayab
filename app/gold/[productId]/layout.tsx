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

export default async function ProductLayout({ children, params }: Props) {
  const { productId } = await params;
  const id = Number(productId);

  if (!Number.isInteger(id) || id <= 0) {
    return children;
  }

  const [product, price] = await Promise.all([
    getProductSeoData(id),
    getProductPrice(id),
  ]);

  if (!product) {
    return children;
  }

  const title = product.title?.trim() || "محصول طلا";
  const description =
    product.description?.trim() ||
    `${title}؛ مشخصات وزن، عیار و قیمت روز طلا در TheTala.`;
  const image = absoluteImageUrl(product.image);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `https://thetala.ir/gold/${id}#product`,
        name: title,
        description,
        ...(image ? { image: [image] } : {}),
        sku: `TY-${String(id).padStart(4, "0")}`,
        brand: {
          "@type": "Brand",
          name: "TheTala",
        },
        ...(price && price > 0
          ? {
              offers: {
                "@type": "Offer",
                url: `https://thetala.ir/gold/${id}`,
                price: price * 10,
                priceCurrency: "IRR",
                availability: "https://schema.org/InStock",
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
            name: "طلاها",
            item: "https://thetala.ir/gold",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: title,
            item: `https://thetala.ir/gold/${id}`,
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
