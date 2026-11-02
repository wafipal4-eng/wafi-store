"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const ProductLimitNotice = () => {
  const router = useRouter();
  const t = useTranslations("ProductLimit");

  return (
    <div className="flex justify-center px-4 mt-8">
      <Card className="w-full max-w-xl bg-white border border-red-200 text-red-700 shadow-md rounded-2xl px-6 py-8">
        <div className="flex flex-col items-center text-center gap-6">
          <p className="text-lg font-semibold leading-relaxed">
            {t("message")}
          </p>
          <Button
            onClick={() => router.push("/upgrade")}
            className="bg-red-600 hover:bg-red-700 cursor-pointer text-white px-6 py-2 rounded-full text-sm font-medium transition"
          >
            {t("button")}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProductLimitNotice;
