"use client"

import { supabase, main_color, nis, store_id } from "@/app/lib/constants"
import type React from "react"
import { useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Phone, Package, Calendar, MapPin, CheckCircle2, Circle, XCircle } from "lucide-react"
import { cdn } from "@/lib/cdn"

// Order status timeline component
const OrderStatusTimeline = ({
    status,
    statusLabels
}: {
    status: string;
    statusLabels: { pending: string; shipped: string; delivered: string; cancelled: string }
}) => {
    const normalizedStatus = status?.toLowerCase() || "pending"

    // Define status progression
    const statuses = [
        { key: "pending", label: statusLabels.pending },
        { key: "shipped", label: statusLabels.shipped },
        { key: "delivered", label: statusLabels.delivered },
    ]

    const isCancelled = normalizedStatus === "cancelled"
    const currentIndex = statuses.findIndex(s => s.key === normalizedStatus)

    return (
        <div className="w-full py-2">
            {isCancelled ? (
                // Cancelled state - show red timeline
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 border-2 border-red-500">
                        <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 h-0.5 bg-red-200" />
                    <span className="text-sm font-medium text-red-600">
                        {statusLabels.cancelled}
                    </span>
                </div>
            ) : (
                // Normal progression timeline
                <div className="flex items-center gap-1">
                    {statuses.map((statusItem, index) => {
                        const isActive = index === currentIndex
                        const isPast = index < currentIndex
                        const isFuture = index > currentIndex

                        return (
                            <div key={statusItem.key} className="flex items-center flex-1">
                                {/* Status circle */}
                                <div className="flex flex-col items-center gap-1">
                                    <div
                                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${isActive
                                            ? "bg-blue-100 border-blue-500"
                                            : isPast
                                                ? "bg-green-100 border-green-500"
                                                : "bg-gray-100 border-gray-300"
                                            }`}
                                    >
                                        {isPast ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        ) : isActive ? (
                                            <Circle className="h-5 w-5 text-blue-600 fill-blue-600" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs font-medium text-center ${isActive
                                            ? "text-blue-600"
                                            : isPast
                                                ? "text-green-600"
                                                : "text-gray-400"
                                            }`}
                                    >
                                        {statusItem.label}
                                    </span>
                                </div>

                                {/* Connector line (not after last item) */}
                                {index < statuses.length - 1 && (
                                    <div
                                        className={`flex-1 h-0.5 mx-1 ${isPast ? "bg-green-500" : "bg-gray-300"
                                            }`}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

const getStatusColor = (status: string) => {
    switch (status) {
        case "delivered":
            return "bg-green-100 text-green-800 hover:bg-green-100"
        case "shipped":
            return "bg-blue-100 text-blue-800 hover:bg-blue-100"
        case "processing":
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        case "cancelled":
            return "bg-red-100 text-red-800 hover:bg-red-100"
        default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
}

const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "")
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
}

export default function OrderLookup() {
    const [phoneNumber, setPhoneNumber] = useState("")
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [error, setError] = useState("")

    const t = useTranslations("OrderLookup")
    const locale = useLocale()

    // Prepare status labels once
    const statusLabels = {
        pending: t("order.status.pending"),
        shipped: t("order.status.shipped"),
        delivered: t("order.status.delivered"),
        cancelled: t("order.status.cancelled"),
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        setHasSearched(true)

        const cleaned = phoneNumber.replace(/\D/g, "")
        if (cleaned.length < 9) {
            setError(t("form.error"))
            setIsLoading(false)
            return
        }

        // Get last 9 digits only
        const last9Digits = cleaned.slice(-9)

        try {
            // 1. Fetch orders matching last 9 digits of phone number
            const { data: ordersData, error: ordersError } = await supabase
                .from("orders")
                .select("*")
                .eq("store_id", store_id)
                .or(`phone_number_1.like.%${last9Digits},phone_number_2.like.%${last9Digits}`)
                .order("created_at", { ascending: false })

            if (ordersError) {
                console.error("Order fetch error:", ordersError)
                setError(t("form.fetchError"))
                setOrders([])
                return
            }

            console.log("Fetched Orders:", ordersData)

            const orderIds = (ordersData || []).map((order) => order.id)

            if (orderIds.length === 0) {
                setOrders([])
                return
            }

            // 2. Fetch order products with product info
            const { data: orderProducts, error: productError } = await supabase
                .from("order_product")
                .select(`order_id,
                            amount,
                            product:product_id (
                                id,
                                name,
                                main_image      
                            )
                            `)
                .in("order_id", orderIds)

            if (productError) {
                console.error("Order Product fetch error:", productError)
                setOrders(ordersData || [])
                return
            }

            console.log("Fetched Order Products:", orderProducts)

            // 3. Merge order products into matching orders
            const ordersWithProducts = (ordersData || []).map((order) => ({
                ...order,
                products: orderProducts?.filter((op) => op.order_id === order.id) || [],
            }))

            console.log("Final Orders with Products:", ordersWithProducts)

            setOrders(ordersWithProducts)
        } catch (err) {
            console.error("Unexpected error:", err)
            setError(t("form.unexpectedError"))
            setOrders([])
        } finally {
            setIsLoading(false)
        }
    }


    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhoneNumber(e.target.value)
        setError("")
    }

    return (
        <div className="min-h-screen py-8 px-4" dir={locale === "ar" ? "rtl" : "ltr"}>
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h1>
                    <p className="text-gray-600">{t("subtitle")}</p>
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            {t("form.title")}
                        </CardTitle>
                        <CardDescription>{t("form.description")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">{t("form.label")}</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="059XXXXXXX"
                                    value={phoneNumber}
                                    onChange={handlePhoneChange}
                                    className={error ? "border-red-500" : ""}
                                />
                                {error && <p className="text-sm text-red-600">{error}</p>}
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full text-white"
                                style={{ backgroundColor: main_color }}
                            >
                                {isLoading ? t("form.loading") : t("form.submit")}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {hasSearched && (
                    <div className="space-y-6">
                        {orders.length > 0 ? (
                            <>
                                <div className="flex items-center gap-2 mb-4">
                                    <Package className="h-5 w-5 text-gray-600" />
                                    <h2 className="text-xl font-semibold">
                                        {orders.length} {orders.length === 1 ? t("order.one") : t("order.many")}
                                    </h2>
                                </div>
                                {orders.map((order) => (
                                    <Card key={order.id} className="overflow-hidden">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg font-semibold">{t("order.id", { id: order.id })}</CardTitle>
                                                    <CardDescription className="flex items-center gap-4 mt-2">
                                                        <span className="flex items-center gap-1.5 text-sm">
                                                            <Calendar className="h-4 w-4" />
                                                            {new Date(order.created_at).toLocaleDateString(locale)}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-sm font-medium">
                                                            {nis} {order.total_price.toFixed(2)}
                                                        </span>
                                                    </CardDescription>
                                                </div>
                                            </div>

                                            {/* Order Status Timeline */}
                                            <OrderStatusTimeline status={order.status} statusLabels={statusLabels} />
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            {/* Address Section */}
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {order.city}, {order.address}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Products Section */}
                                            {order.products?.length > 0 && (
                                                <div className="mt-6">
                                                    <h4 className="font-medium mb-3 text-base">{t("order.products")}</h4>
                                                    <div className="space-y-3">
                                                        {order.products.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border">
                                                                {/* Product Image */}
                                                                <div className="flex-shrink-0">
                                                                    <img
                                                                        src={cdn(item.product?.main_image) || "/placeholder.svg?height=64&width=64&query=product"}
                                                                        alt={item.product?.name || t("order.unknownProduct")}
                                                                        className="w-16 h-16 object-cover rounded-md border bg-background"
                                                                        onError={(e) => {
                                                                            ; (e.target as HTMLImageElement).src = "/placeholder.svg?height=64&width=64"
                                                                        }}
                                                                    />
                                                                </div>

                                                                {/* Product Info */}
                                                                <div className="flex-grow min-w-0">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex-1 min-w-0">
                                                                            <h5 className="font-medium text-foreground truncate">
                                                                                {item.product?.name || t("order.unknownProduct")}
                                                                            </h5>
                                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                                {t("order.quantity")}: {item.amount}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </>
                        ) : (
                            <Card>
                                <CardContent className="text-center py-8">
                                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t("notFound.title")}</h3>
                                    <p className="text-gray-600">
                                        {t("notFound.description", { phone: formatPhoneNumber(phoneNumber) })}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
