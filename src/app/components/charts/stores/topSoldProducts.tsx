"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchTopSoldProducts } from "@/app/lib/productService";
import { cdn } from "@/lib/cdn";

interface Product {
  id: number;
  name: string;
  main_image: string;
  totalSold: number;
}

export default function TopSoldProducts({ storeId }: { storeId: number }) {
  const t = useTranslations("dashboard");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchTopSoldProducts();
      const sorted = data.sort((a, b) => b.totalSold - a.totalSold); // ✅ sort descending
      setProducts(sorted);
    };
    load();
  }, [storeId]);

  if (!products.length) {
    return <p className="text-gray-500 text-sm italic">{t("noTopProducts")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-4 bg-white/70 border border-gray-200 rounded-3xl p-4 shadow-sm backdrop-blur-md hover:shadow-md transition"
        >
          <img
            src={cdn(product.main_image) || "/placeholder.svg"}
            alt={product.name}
            className="w-16 h-16 object-cover rounded-xl border border-gray-200"
          />
          <div className="flex flex-col flex-1">
            <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
            <p className="text-xs text-gray-500">
              {t("sold")}: <span className="font-semibold text-gray-700">{product.totalSold}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
