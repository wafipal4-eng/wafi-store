'use client';
import React from 'react';
import NotificationsInfo from '@/app/components/shared-components/NotificationsInfo';
import OrderSummary from '@/app/components/shared-components/OrderSummery';
import { usePathname } from "next/navigation";

const Page = () => {
    const pathname = usePathname();
    const lastSegment = pathname.split("/").filter(Boolean).pop();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
            
            <div className="span-1">
                <div className="flex gap-4 w-full m-4 justify-center">
                    <NotificationsInfo />
                </div>
            </div>

            <div className="span-1">
                <div className="sticky top-20">
                    {lastSegment === "AccountInfo" && <OrderSummary />}
                </div>
            </div>

            <div className="span-1">
                <div className="sticky top-20">
                    {lastSegment === "AccountInfo" && <OrderSummary />}
                </div>
            </div>

            <div className="span-1">
                <div className="sticky top-20">
                    {lastSegment === "AccountInfo" && <OrderSummary />}
                </div>
            </div>

            <div className="span-1">
                <div className="sticky top-20">
                    {lastSegment === "AccountInfo" && <OrderSummary />}
                </div>
            </div>
            
        </div>
    );
};

export default Page;
