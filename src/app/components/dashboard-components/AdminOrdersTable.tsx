"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { fetchOrders, fetchStoreCities, updateOrderStatus } from "@/app/lib/productService";
import { store_id, supabase } from "@/app/lib/constants";
import { Order } from "@/app/lib/interfaces";
import Skeleton from "@mui/material/Skeleton";
import OrderDetailsModal from "@/app/components/dashboard-components/OrderDetailsModal";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// --- Local type for parsed coupon coming from the API string ---
type DiscountCode = {
  id: number;
  code: string;
  discount_value: number; // percentage
  min_value: number;
  valid_until: string;
  store_id: number;
  created_at: string;
  is_active: boolean;
};

// Safely parse the coupon JSON string
function parseCoupon(raw: string | null | undefined): DiscountCode | null {
  try {
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Extend Order state locally to include parsed coupon
type UIOrder = Order & {
  parsedCoupon?: DiscountCode | null;
};

export const AdminOrdersTable = () => {
  const t = useTranslations("AdminTable");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<UIOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<UIOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<UIOrder | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const getOrders = async () => {
      setLoading(true);
      const [fetched, storeCities] = await Promise.all([
        fetchOrders(store_id),
        fetchStoreCities(),
      ]);
      const shippingByArea = new Map(
        storeCities.map((city) => [
          city.name.trim().toLocaleLowerCase(),
          Number(city.shipping_cost) || 0,
        ])
      );
      const mapped: UIOrder[] = (fetched || []).map((o: Order) => ({
        ...o,
        parsedCoupon: parseCoupon((o as any).coupon), // API returns coupon as string
        shipping_cost:
          shippingByArea.get(String(o.city || "").trim().toLocaleLowerCase()) ?? null,
      }));
      setOrders(mapped);
      setLoading(false);
    };
    getOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((order) =>
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (cityFilter !== "all") {
      filtered = filtered.filter((order) => order.city === cityFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, cityFilter, statusFilter]);

  const uniqueCities = Array.from(new Set(orders.map((order) => order.city)));
  
  const handleDeleteOrder = async (orderId: number) => {
    if (!window.confirm(t("confirmDeleteOrder") || "Are you sure you want to delete this order?")) {
      return;
    }

    try {
      // Delete order_product items first (if not cascading)
      const { error: productsError } = await supabase
        .from("order_product")
        .delete()
        .eq("order_id", orderId);

      if (productsError) throw productsError;

      // Delete the order itself
      const { error: orderError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (orderError) throw orderError;

      // Update local state
      setOrders((prev) => prev.filter((o) => String(o.id) !== String(orderId)));
      console.log("✅ Order deleted successfully");
    } catch (err) {
      console.error("❌ Failed to delete order:", err);
      alert(t("deleteError") || "Failed to delete order. Please try again.");
    }
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      {showModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            setShowModal(false);
          }}
        />
      )}

      {/* Header and Filters */}
      <div className="p-6 bg-white shadow-sm rounded-xl border border-gray-200 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t("ordersManagement")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("manageOrdersDescription")}</p>

        {/* Filters */}
        <div className="mt-6 flex flex-col lg:flex-row gap-4">
          <Input
            placeholder={t("searchByCustomerName")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full lg:w-1/3"
          />
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full lg:w-1/3">
              <SelectValue placeholder={t("filterByCity")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCities")}</SelectItem>
              {uniqueCities.map((city, idx) => (
                <SelectItem key={idx} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-1/3">
              <SelectValue placeholder={t("filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="Pending">{t("statusPending")}</SelectItem>
              <SelectItem value="Shipped">{t("statusShipped")}</SelectItem>
              <SelectItem value="Delivered">{t("statusDelivered")}</SelectItem>
              <SelectItem value="Cancelled">{t("statusCancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table or Loading */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={40} variant="rounded" animation="wave" />
            ))}
          </div>
        ) : (
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="p-4 text-start">{t("customerName")}</th>
                <th className="p-4 text-start">{t("totalPrice")}</th>
                <th className="p-4 text-start">{t("finalPrice") /* NEW key */}</th>
                <th className="p-4 text-start">{t("discount") /* NEW key */}</th>
                <th className="p-4 text-start">{t("coupon") /* NEW key */}</th>
                <th className="p-4 text-start">{t("city")}</th>
                <th className="p-4 text-start">{t("address")}</th>
                <th className="p-4 text-start">{t("primaryPhone")}</th>
                <th className="p-4 text-start">{t("secondaryPhone")}</th>
                <th className="p-4 text-start">{t("notes")}</th>
                <th className="p-4 text-start">{t("orderTime")}</th>
                <th className="px-12 text-start">{t("status")}</th>
                <th className="p-4 text-start">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const finalPrice =
                    (order as any).final_price != null
                      ? Number((order as any).final_price)
                      : Number(order.total_price);

                  const discountAmount = Math.max(0, Number(order.total_price) - finalPrice);
                  const hasCoupon = !!order.parsedCoupon;
                  const shippingCost =
                    order.shipping_cost == null ? null : Number(order.shipping_cost);
                  const productsPrice =
                    shippingCost == null
                      ? Number(order.total_price)
                      : Math.max(0, Number(order.total_price) - shippingCost);

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition duration-150 border-b last:border-none"
                    >
                      <td className="p-4 whitespace-nowrap">{order.customer_name}</td>

                      <td className="p-4 whitespace-nowrap">
                        {shippingCost == null ? (
                          <span className="font-semibold">
                            {Number(order.total_price).toLocaleString()} {t("currency")}
                          </span>
                        ) : (
                          <div className="min-w-[170px]">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <span>{productsPrice.toLocaleString()}</span>
                              <span className="text-gray-400">+</span>
                              <span className="text-blue-700">
                                {shippingCost.toLocaleString()} {t("shippingFee")}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              = {Number(order.total_price).toLocaleString()} {t("currency")}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Final price */}
                      <td className="p-4 whitespace-nowrap font-semibold">
                        {finalPrice.toLocaleString()} {t("currency")}
                      </td>

                      {/* Discount amount */}
                      <td className="p-4 whitespace-nowrap">
                        {discountAmount > 0 ? (
                          <span className="text-green-700">
                            - {discountAmount.toLocaleString()} {t("currency")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Coupon (code + % if present) */}
                      <td className="p-4 whitespace-nowrap">
                        {hasCoupon ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs border border-green-200">
                              {order.parsedCoupon!.code}
                            </span>
                            <span className="text-xs text-gray-500">
                              {order.parsedCoupon!.discount_value}%
                            </span>
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="p-4">
                        <div className="min-w-[130px]">
                          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                            {order.city || "-"}
                          </span>
                          {shippingCost != null && (
                            <div className="mt-1.5 text-xs text-gray-500">
                              +{shippingCost.toLocaleString()} {t("currency")} {t("shippingFee")}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">{order.address}</td>
                      <td className="p-4">{order.phone_number_1}</td>
                      <td className="p-4">{order.phone_number_2 || "-"}</td>

                      {/* Keep line breaks in notes e.g., "before ... \n after ..." */}
                      <td className="p-4 whitespace-pre-line">{order.notes || "-"}</td>

                      <td className="p-4 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleString(locale)}
                      </td>

                      <td className="p-4 whitespace-nowrap min-w-[140px]">
                        <Select
                          value={order.status || "Pending"}
                          disabled={order.status === "Cancelled"}
                          onValueChange={async (newStatus) => {
                            const oldStatus = order.status;

                            // If changing to Cancelled, restore quantities
                            if (newStatus === "Cancelled" && oldStatus !== "Cancelled") {
                              try {
                                // Fetch order products
                                const { data: orderProducts, error } = await supabase
                                  .from("order_product")
                                  .select("product_id, options, amount")
                                  .eq("order_id", order.id);

                                if (!error && orderProducts) {
                                  // Import dynamically to avoid circular dependencies
                                  const { incrementQuantityAfterCancellation } = await import("@/app/lib/productHelper");

                                  // Restore quantity for each product
                                  for (const item of orderProducts) {
                                    await incrementQuantityAfterCancellation(
                                      item.product_id,
                                      item.options || {},
                                      item.amount
                                    );
                                  }
                                  console.log("✅ Quantities restored for cancelled order");
                                }
                              } catch (err) {
                                console.error("❌ Failed to restore quantities:", err);
                              }
                            }

                            // Update order status
                            const success = await updateOrderStatus(Number(order.id), newStatus);
                            if (success) {
                              const updated = [...orders];
                              const index = updated.findIndex((o) => o.id === order.id);
                              if (index !== -1) {
                                updated[index].status = newStatus;
                                setOrders(updated);
                              }
                            }
                          }}
                        >
                          <SelectTrigger
                            className={`
                              text-xs px-3 py-1 rounded-full border
                              ${order.status === "Pending" ? "bg-yellow-100 text-yellow-800 border-yellow-300" : ""}
                              ${order.status === "Shipped" ? "bg-blue-100 text-blue-800 border-blue-300" : ""}
                              ${order.status === "Delivered" ? "bg-green-100 text-green-800 border-green-300" : ""}
                              ${order.status === "Cancelled" ? "bg-red-100 text-red-800 border-red-300" : ""}
                            `}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">{t("statusPending")}</SelectItem>
                            <SelectItem value="Shipped">{t("statusShipped")}</SelectItem>
                            <SelectItem value="Delivered">{t("statusDelivered")}</SelectItem>
                            <SelectItem value="Cancelled">{t("statusCancelled")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition"
                          >
                            {t("viewDetails")}
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(Number(order.id))}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition"
                          >
                            {t("delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={13} className="p-6 text-center text-gray-500 text-sm">
                    {t("noOrders")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
