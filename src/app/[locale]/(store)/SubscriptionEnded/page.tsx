'use client';

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase, store_id } from "@/app/lib/constants";
import { useRouter } from "next/navigation";

export default function SubscriptionEnded() {
  const router = useRouter();

  useEffect(() => {
    const checkSubscription = async () => {
      const { data: store, error } = await supabase
        .from("store")
        .select("due")
        .eq("id", store_id)
        .single();

      if (error || !store?.due) {
        console.error("فشل التحقق من الاشتراك:", error);
        return;
      }

      const due = new Date(store.due);
      const now = new Date();

      if (due > now) {
        router.replace("/");
      }
    };

    checkSubscription();
  }, [router]);

  return (
    <div dir="rtl" className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-md ring-1 ring-slate-200 shadow-xl rounded-2xl p-8 text-center">
        <Link href="/">
          <img
            src="/logo.svg"
            alt="شعار المتجر"
            className="mx-auto mb-4 w-24 h-auto cursor-pointer"
          />
        </Link>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-4">
          انتهت صلاحية الاشتراك
        </h1>
        <p className="text-slate-600 leading-relaxed mb-8">
          انتهت صلاحية اشتراكك. لمتابعة الاستمتاع بجميع الميزات، يرجى تجديد خطتك.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto cursor-pointer">
              عرض الخطط
            </Button>
          </Link>
          <Link href="#">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto cursor-pointer"
            >
              التواصل مع الدعم
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
