const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://dzfiqtnaiecfmiiyrjrh.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_upt0vLgM6Ei-BD8mG0sCjg_IvO7_Dwl";

const baseUrl = "https://thetala.ir";

type ProductSeoRow = {
  id: number;
  shop_id: number;
  category_id: number | null;
  title: string | null;
  description: string | null;
  weight: number | null;
  karat: number | null;
  image: string | null;
  status: string | null;
};

type ShopSeoRow = {
  id: number;
  shop_name: string | null;
  city: string | null;
  description: string | null;
  logo: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string | null;
};

type MarketPriceRow = {
  gold18: number | null;
};

async function supabaseRest<T>(path: string): Promise<T[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    next: {
      revalidate: 300,
    },
  });

  if (!response.ok) {
    return [];
  }

  return (await response.json()) as T[];
}

export function absoluteImageUrl(image: string | null | undefined) {
  if (!image) {
    return undefined;
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return new URL(image.startsWith("/") ? image : `/${image}`, baseUrl).toString();
}

export async function getProductSeoData(productId: number) {
  const rows = await supabaseRest<ProductSeoRow>(
    `products?select=id,shop_id,category_id,title,description,weight,karat,image,status&id=eq.${productId}&status=eq.active&limit=1`
  );

  return rows[0] ?? null;
}

export async function getShopSeoData(shopId: number) {
  const rows = await supabaseRest<ShopSeoRow>(
    `shops___?select=id,shop_name,city,description,logo,phone,latitude,longitude,status&id=eq.${shopId}&status=eq.active&limit=1`
  );

  return rows[0] ?? null;
}

export async function getActiveProductIds() {
  return supabaseRest<Pick<ProductSeoRow, "id">>(
    "products?select=id&status=eq.active&order=id.asc"
  );
}

export async function getActiveShopIds() {
  return supabaseRest<Pick<ShopSeoRow, "id">>(
    "shops___?select=id&status=eq.active&order=id.asc"
  );
}

export async function getProductPrice(productId: number) {
  const productRows = await supabaseRest<
    ProductSeoRow & {
      wage_type: string | null;
      wage_value: number | null;
      profit_percent: number | null;
      extra_fee: number | null;
    }
  >(
    `products?select=id,shop_id,category_id,title,description,weight,karat,image,status,wage_type,wage_value,profit_percent,extra_fee&id=eq.${productId}&status=eq.active&limit=1`
  );

  const product = productRows[0];
  if (!product) return null;

  const marketRows = await supabaseRest<MarketPriceRow>(
    "market_prices?select=gold18&order=id.desc&limit=1"
  );

  const gold18Price = Number(marketRows[0]?.gold18 ?? 0);
  const weight = Number(product.weight ?? 0);
  const karat = Number(product.karat ?? 18);
  const goldValue = weight * gold18Price * (karat / 18);

  const wage =
    product.wage_type === "percent"
      ? goldValue * (Number(product.wage_value ?? 0) / 100)
      : Number(product.wage_value ?? 0);

  const profit =
    (goldValue + wage) *
    (Number(product.profit_percent ?? 0) / 100);

  return Math.round(goldValue + wage + profit + Number(product.extra_fee ?? 0));
}
