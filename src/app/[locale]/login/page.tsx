"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import "@/app/globals.css";
import { admin_email } from "@/app/lib/constants";

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            const user = data.user;

            if (user?.email !== admin_email) {
                await supabase.auth.signOut();
                setError("You are not authorized to access this application.");
                return;
            }

            if (data.session) {
                router.push("/dashboard");
            }
        } catch {
            setError("An error occurred during login");
        }
    }


    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#f3f3e7] rtl">
            {/* Right Half – Logo */}
            <div className="hidden md:flex items-center justify-center p-4">
                <img
                    src="/logo.svg"
                    alt="شعار المتجر"
                    className="h-100 w-auto object-contain"
                />
            </div>

            {/* Left Half – Login Form */}
            <div className="flex items-center justify-center px-16 py-32">
                <form
                    dir="rtl"
                    onSubmit={handleSubmit}
                    className="bg-[#f3f3e7] shadow-sm border border-gray-200 p-8 rounded-2xl w-full max-w-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-10"
                >
                    <h2 className="text-2xl font-extrabold text-[#064e3b] mb-6 text-center tracking-tight">
                        أهلاً بعودتك إلى لوحة التحكم
                    </h2>

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            البريد الإلكتروني
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            placeholder="you@example.com"
                            required
                            className="w-full px-4 py-2 text-sm bg-[#f3f3e7] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#064e3b] focus:border-transparent transition"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            كلمة المرور
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-2 text-sm bg-[#f3f3e7] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#064e3b] focus:border-transparent transition"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm mb-3 text-right">{error}</div>
                    )}

                    <button
                        type="submit"
                        className="mt-2 w-full cursor-pointer bg-[#ffd600] text-[#064e3b] py-2.5 rounded-md hover:bg-yellow-400 transition text-sm font-bold"
                    >
                        تسجيل الدخول
                    </button>
                </form>
            </div>
        </div>
    );



}
