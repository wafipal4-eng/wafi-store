"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import NavLinks from "@/app/components/dashboard-components/NavLinks";
import { sidebarLogo, supabase } from "@/app/lib/constants"; // <-- make sure supabase is exported here
import { cn } from "@/lib/utils";

export default function SideBar({
  onSignOut,
}: {
  onSignOut?: () => Promise<void> | void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const locale = useLocale();
  const isRTL = locale === "ar";
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Lock scroll & ESC to close when drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  async function defaultSignOut() {
    setSigningOut(true);
    try {
      // Supabase sign out (clears session)
      await supabase.auth.signOut();
      setIsOpen(false);
      // send user to localized login
      router.push(`/${locale}/login`);
      router.refresh();
    } catch (err) {
      console.error("Sign out failed:", err);
      // optional: toast here
    } finally {
      setSigningOut(false);
    }
  }

  const handleSignOut = async () => {
    if (signingOut) return;
    if (onSignOut) {
      setSigningOut(true);
      try {
        await onSignOut();
      } finally {
        setSigningOut(false);
      }
      return;
    }
    await defaultSignOut();
  };

  function Logo({ size = 50 }: { size?: number }) {
    const src = sidebarLogo || `/placeholder.svg?height=${size}&width=${size}`;
    return (
      <div className="flex flex-col items-center">
        <Link href="/dashboard" aria-label="Go to dashboard" className="inline-flex">
          <Image src={src} alt="Logo" width={160} height={50} className="object-contain h-14 w-auto" priority />
        </Link>
        <a href="/ar" className="mt-2 text-xs text-green-600 hover:text-green-700 underline">← العودة للمتجر</a>
      </div>
    );
  }

  const signOutBtnClasses =
    "w-full inline-flex items-center gap-2 justify-center rounded-lg px-4 py-2.5 text-sm font-medium " +
    "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/30 " +
    "transition disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <>
      {/* Mobile Top Bar */}
      <nav
        className="md:hidden fixed top-0 inset-x-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-gray-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between"
        aria-label="Mobile navigation"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <Logo />
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md bg-gray-50 hover:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition"
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <Menu size={20} />
        </button>
      </nav>
      {/* Push content below mobile bar */}
      <div className="md:hidden h-14" />

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <button
            aria-label="Close menu overlay"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            className={cn(
              "fixed top-0 z-50 h-screen w-full max-w-sm bg-white dark:bg-neutral-900 shadow-xl border-gray-200 dark:border-neutral-800 transition-transform duration-300 ease-out",
              isRTL ? "right-0 translate-x-0 border-l" : "left-0 translate-x-0 border-r"
            )}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-neutral-800">
              <Logo />
              <button
                ref={closeBtnRef}
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex h-[calc(100vh-60px)] flex-col">
              <div className="px-3 py-3 overflow-y-auto">
                <NavLinks onLinkClick={() => setIsOpen(false)} />
              </div>

              <div className="mt-auto p-4 border-t border-gray-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={signOutBtnClasses}
                  disabled={signingOut}
                  data-testid="signout-mobile"
                >
                  <LogOut size={18} />
                  <span className="truncate">{signingOut ? "Signing out…" : "Sign Out"}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex md:flex-col md:w-64 h-screen bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-r border-gray-200 dark:border-neutral-800"
        aria-label="Sidebar"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex items-center justify-center px-6 py-8 border-b border-gray-100 dark:border-neutral-800">
          <Logo size={120} />
        </div>

        <div className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <NavLinks />
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleSignOut}
              className={signOutBtnClasses}
              disabled={signingOut}
              data-testid="signout-desktop"
            >
              <LogOut size={18} />
              <span>{signingOut ? "Signing out…" : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
