"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { TbShoppingBagHeart } from "react-icons/tb";
import { IoIosSearch } from "react-icons/io";
import { Link } from "@/i18n/navigation";
import SearchComponent from "@/app/components/shared-components/SearchComponent";
import { main_color } from "@/app/lib/constants";
import { useCart } from "@/app/context/CartContext";

const StickyMobileFooter = () => {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { cartCount } = useCart();

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="fixed bottom-0 z-10 w-full">
      <div
        className="flex justify-around items-center gap-6 px-6 py-3 rounded-t-3xl max-w-screen-sm mx-auto shadow-md"
        style={{ backgroundColor: main_color }}
      >
        <button
          aria-label="Search"
          onClick={toggleSearch}
          className="text-white p-2 rounded-full hover:scale-105 transition"
        >
          <IoIosSearch size={32} />
        </button>

        <Link
          href="/Cart"
          aria-label="Cart"
          className="relative text-white p-2 rounded-full hover:scale-105 transition"
        >
          <TbShoppingBagHeart size={30} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow">
              {cartCount}
            </span>
          )}

        </Link>
      </div>

      {isSearchOpen && (
        <SearchComponent
          onClose={toggleSearch}
          products={[]} // Empty array if unused
          setResults={() => { }} // No-op function if unused
        />
      )}
    </div>
  );
};

export default StickyMobileFooter;
