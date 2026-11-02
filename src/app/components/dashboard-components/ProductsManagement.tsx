// app/dashboard/products/page.tsx (ProductsManagement)
"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { AdminTable } from "@/app/components/dashboard-components/AdminProductsTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const ProductsManagement = () => {
  const t = useTranslations("AdminTable");
  const locale = useLocale();
  const isRTL = locale === "ar" || locale === "he";

  return (
    <>
      {/* Top Section */}
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="p-6 bg-white rounded-xl shadow-md mb-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {t("productManagement")}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t("manageProducts")}
            </p>
          </div>
          <Link href="/dashboard/add-product">
            <Button>{t("addNewProduct")}</Button>
          </Link>
        </div>
      </div>

      <AdminTable />

     
    </>
  );
};

export default ProductsManagement;
