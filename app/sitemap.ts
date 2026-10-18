import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://thetala.ir";

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
      priority: 0.8,
    },
    {
      url: `${baseUrl}/seller`,
      changeFrequency: "weekly",
      priority: 0.4,
    },
  ];
}
