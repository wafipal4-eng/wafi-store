"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { store_id } from "@/app/lib/constants";

export default function TopBanner() {
  const [bannerText, setBannerText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data, error } = await supabase
          .from("store")
          .select("banner")
          .eq("id", store_id)
          .single();

        if (error) throw error;
        setBannerText(data?.banner || null);
      } catch (err) {
        console.error("Failed to fetch banner:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, []);

  if (loading || !bannerText) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="relative overflow-hidden bg-[#1a1a1a] text-white z-[60]"
      >
        <div className="container mx-auto flex items-center justify-center px-4 py-2 md:px-6">
          <div className="flex items-center gap-2 text-center text-[13px] md:text-sm font-semibold tracking-wide">
            <Sparkles className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />
            <span className="uppercase tracking-widest opacity-90 italic mr-1">Special:</span>
            <span>{bannerText}</span>
          </div>
        </div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
      </motion.div>
    </AnimatePresence>
  );
}
