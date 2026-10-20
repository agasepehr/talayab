import type { MetadataRoute } from "next";
import {
  getActiveProductIds,
  getActiveShopIds,
} from "../lib/seo-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://thetala.ir";
  const [products, shops] = await Promise.all([
    getActiveProductIds(),
    getActiveShopIds(),
  ]);

  return [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/gold`,
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/shops`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...products.map((product) => ({
      url: `${baseUrl}/gold/${product.id}`,
      changeFrequency: "daily" as const,
      priority: 0.85,
    })),
    ...shops.map((shop) => ({
      url: `${baseUrl}/shop/${shop.id}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
