import { Bell, Box, ShoppingCart, Star, User, LogOut } from "lucide-react";
import { main_color } from "@/app/lib/constants";

export default function NotificationsMenu() {
    return (
        <div className="bg-white rounded-3xl p-4 w-64">
            <div className="text-black flex items-center justify-between  rounded-3xl">
                <ul className="mt-3 w-full space-y-2">
                    <li
                        className={`flex items-center gap-2 p-2 hover:bg-gray-100 focus:bg-[${main_color}] focus:text-[#f2f2e6] rounded-3xl cursor-pointer`}
                        tabIndex={0}
                    >
                        <Bell className="w-5 h-5" />
                        <span>الإشعارات</span>
                    </li>
                    <li
                        className={`flex items-center gap-2 p-2 hover:bg-gray-100 focus:bg-[${main_color}] focus:text-[#f2f2e6] rounded-3xl cursor-pointer`}
                        tabIndex={0}
                    >
                        <Box className="w-5 h-5" />
                        <span>الطلبات</span>
                    </li>
                    <li
                        className={`flex items-center gap-2 p-2 hover:bg-gray-100 focus:bg-[${main_color}] focus:text-[#f2f2e6] rounded-3xl cursor-pointer`}
                        tabIndex={0}
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span>طلبات بانتظار الدفع</span>
                    </li>
                    <li
                        className={`flex items-center gap-2 p-2 hover:bg-gray-100 focus:bg-[${main_color}] focus:text-[#f2f2e6] rounded-3xl cursor-pointer`}
                        tabIndex={0}
                    >
                        <Star className="w-5 h-5" />
                        <span>الأمنيات</span>
                    </li>
                    <li
                        className={`flex items-center gap-2 p-2 hover:bg-gray-100 focus:bg-[${main_color}] focus:text-[#f2f2e6] rounded-3xl cursor-pointer`}
                        tabIndex={0}
                    >
                        <User className="w-5 h-5" />
                        <span>حسابي</span>
                    </li>
                    <li
                        className="flex items-center text-red-700 gap-2 p-2 hover:bg-gray-100 rounded-3xl cursor-pointer"
                        tabIndex={0}
                    >
                        <LogOut className="w-5 h-5" />
                        <span>تسجيل الخروج</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
