"use client";

import React, { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  store_id,
  main_color,
  supabase,
  whatsappTwilio, // owner number in +E164 (no "whatsapp:")
  copyright_text,
  whatsapp, // whatsapp link for customer redirect
} from "@/app/lib/constants";
import { decrementQuantityAfterOrder } from "@/app/lib/productHelper";

interface OrderOption {
  product_id: number;
  name: string;
  quantity: number;
  selectedAttributes: Record<string, string>;
  price: number;
}

interface ContactInfoProps {
  options: OrderOption[];
  amount?: number;            // (unused, kept for compat)
  total_price: number;        // cart sum
  final_price: number;        // after discounts
  coupon?: string;
  disabled?: boolean;
  isCart?: boolean;
  shipping?: number;          // shipping cost
  shippingArea?: string;      // selected delivery area
}

type FormState = {
  firstName: string;
  lastName: string;
  phoneNumber1: string; // Must be WhatsApp in +E164
  phoneNumber2: string;
  city: string;
  address: string;
  notes: string;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  phoneNumber1: "",
  phoneNumber2: "",
  city: "",
  address: "",
  notes: "",
};

// --- Helpers ---
const isE164 = (v: string) => /^\+[1-9]\d{7,14}$/.test(v.trim()); // +[country][number], 8–15 digits total
const formatCurrency = (v: number) => `₪${Number(v).toLocaleString()}`;

// SINGLE-LINE details for template {{3}} (no emojis/newlines/extra labels)
const buildOrderSummaryLine = (items: OrderOption[]) =>
  items
    .map((opt) => {
      const attrs =
        Object.keys(opt.selectedAttributes).length > 0
          ? ` (${Object.entries(opt.selectedAttributes)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")})`
          : "";
      return `${opt.name} ×${opt.quantity}${attrs}`;
    })
    .join(" | ");

// Send the approved WhatsApp template through the server-side Twilio route.
const sendWhatsAppDynamic = async ({
  recipients,
  phone,
  name,
  details,
}: {
  recipients: string[]; // +E164 numbers, no "whatsapp:"
  phone: string;        // {{1}}
  name: string;         // {{2}}
  details: string;      // {{3}} single-line
}) => {
  const v1 = String(phone).replace(/\r?\n/g, " ").trim();
  const v2 = String(name).replace(/\r?\n/g, " ").trim();
  const v3 = String(details).replace(/\r?\n/g, " ").trim();

  const response = await fetch("/api/send-whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipients: recipients.filter(Boolean),
      variables: { "1": v1, "2": v2, "3": v3 },
    }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(result?.error || "Twilio WhatsApp notification failed.");
  }
};

const ContactInfo: React.FC<ContactInfoProps> = ({
  options,
  total_price,
  final_price,
  coupon,
  disabled = false,
  isCart = false,
  shipping = 0,
  shippingArea = "",
}) => {
  const locale = useLocale();
  const t = useTranslations("ContactForm");
  const isRtl = ["ar", "he", "fa", "ur"].includes(locale);

  const [submitting, setSubmitting] = useState(false);
  const lockRef = useRef(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<
    | null
    | (FormState & {
      options: OrderOption[];
      total_price: number;
      final_price: number;
    })
  >(null);

  const [formData, setFormData] = useState<FormState>(initialForm);

  React.useEffect(() => {
    if (!shippingArea) return;
    setFormData((current) => ({ ...current, city: shippingArea }));
  }, [shippingArea]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || lockRef.current) return;
    setSubmitting(true);
    lockRef.current = true;

    try {
      const {
        firstName,
        lastName,
        phoneNumber1,
        phoneNumber2,
        city,
        address,
        notes,
      } = formData;

      if (!options?.length) {
        toast.error(t("orderFailed", { default: "Failed to place order." }));
        return;
      }

      const customer_name = `${firstName} ${lastName}`.trim();
      const roundedTotal = Number(total_price.toFixed(2));
      const roundedFinal = Number((final_price ?? total_price).toFixed(2));

      // 1) Create Order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            store_id,
            customer_name,
            city,
            address,
            phone_number_1: phoneNumber1,
            phone_number_2: phoneNumber2 || null,
            notes,
            total_price: roundedTotal,
            final_price: roundedFinal,
            coupon: coupon || null,
          },
        ])
        .select()
        .single();
      if (orderError) throw orderError;
      const order_id = order.id;

      // 2) Attach products
      const orderProducts = options.map((opt) => ({
        order_id,
        product_id: opt.product_id,
        options: opt.selectedAttributes,
        amount: opt.quantity,
      }));
      const { error: opError } = await supabase
        .from("order_product")
        .insert(orderProducts);
      if (opError) throw opError;

      // 3) Decrement stock per variant
      for (const opt of options) {
        await decrementQuantityAfterOrder(
          opt.product_id,
          opt.selectedAttributes,
          opt.quantity
        );
      }

      // 4) Notify the store owner through Twilio's approved WhatsApp template.
      try {
        const details = buildOrderSummaryLine(options); // SINGLE LINE

        const recipients = [
          ...(whatsappTwilio ? [whatsappTwilio] : []), // owner
          // phoneNumber1, // customer (validated E.164)
        ];

        if (recipients.length) {
          await sendWhatsAppDynamic({
            recipients,
            phone: phoneNumber1, // {{1}}
            name: customer_name, // {{2}}
            details, // {{3}}
          });
        }
      } catch (werr) {
        console.error("WhatsApp send failed:", werr);
        // Keep order successful even if WhatsApp fails
      }

      toast.success(
        t("orderSuccess", { default: "Order placed successfully!" })
      );

      // No longer redirecting to WhatsApp. 
      // The background notification via sendWhatsAppDynamic (line 214) handles the message.

      setConfirmationData({
        ...formData,
        options,
        total_price: roundedTotal,
        final_price: roundedFinal,
      });

      setShowFormModal(false);
      setFormData(initialForm);
      if (isCart) localStorage.removeItem("cart");
    } catch (err) {
      console.error("Order failed:", err);
      toast.error(t("orderFailed", { default: "Failed to place order." }));
    } finally {
      setSubmitting(false);
      lockRef.current = false;
    }
  };

  return (
    <div className="w-full z-[9999]">
      <button
        disabled={disabled}
        onClick={() => {
          if (shippingArea) {
            setFormData((current) => ({ ...current, city: shippingArea }));
          }
          setShowFormModal(true);
        }}
        className={`px-4 py-2 rounded-3xl text-sm font-semibold transition-all duration-200 ${disabled
          ? "bg-gray-400 text-white cursor-not-allowed"
          : "bg-white border hover:text-white"
          }`}
        style={
          !disabled ? { color: main_color, borderColor: main_color, borderWidth: 1 } : {}
        }
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = String(main_color);
            e.currentTarget.style.color = "white";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = "white";
            e.currentTarget.style.color = String(main_color);
          }
        }}
      >
        {t("openForm")}
      </button>

      {/* Form Modal */}
      {showFormModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-md px-4 py-6"
          onClick={() => setShowFormModal(false)}
        >
          <div
            className="bg-white shadow-2xl rounded-2xl w-full max-w-md md:max-w-lg p-6 max-h-[75vh] overflow-y-auto relative"
            style={{ direction: isRtl ? "rtl" : "ltr" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-info-title"
          >
            <button
              onClick={() => setShowFormModal(false)}
              className="absolute top-4 end-4 text-gray-400 hover:text-gray-600 text-2xl"
              aria-label={t("close", { default: "Close" })}
            >
              &times;
            </button>

            <h2
              id="contact-info-title"
              className="text-xl font-bold text-center text-gray-800"
            >
              {t("contactInfo")}
            </h2>


            <form
              onSubmit={handleSubmit}
              className="mt-3 space-y-5"
              autoComplete="off" // prevent global autofill
            >
              {(
                [
                  "firstName",
                  "lastName",
                  "phoneNumber1",
                  "phoneNumber2",
                  "city",
                  "address",
                ] as const
              ).map((name) => {
                const isPhone = name.includes("phone");
                const isWhatsApp = name === "phoneNumber1";
                return (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {t(name)}
                    </label>
                    <input
                      type={isPhone ? "tel" : "text"}
                      name={name}
                      value={formData[name]}
                      onChange={onChange}
                      required={name !== "phoneNumber2"}
                      inputMode={isPhone ? "tel" : "text"}
                      // defeat autofill heuristics
                      autoComplete={isPhone ? "off" : "off"}
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder={undefined}
                      pattern={undefined}
                      aria-invalid={undefined}
                      aria-describedby={undefined}
                      readOnly={name === "city" && Boolean(shippingArea)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3f8e99] shadow-sm"
                    />
                    {name === "city" && shippingArea ? (
                      <p className="mt-1 text-xs text-gray-500">
                        {t("selectedShippingArea", { default: "Selected shipping area" })}:{" "}
                        {shippingArea} (+{shipping.toLocaleString()} ₪)
                      </p>
                    ) : null}

                  </div>
                );
              })}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {t("notes")}
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={onChange}
                  rows={3}
                  autoComplete="off"
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3f8e99] shadow-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 mt-1 rounded-2xl text-white transition bg-[#3f8e99] hover:bg-[#32717a] disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? t("processing") : t("submit")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationData && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-md px-4 py-6"
          onClick={() => setConfirmationData(null)}
        >
          <div
            className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-6 overflow-y-auto relative"
            style={{ direction: isRtl ? "rtl" : "ltr" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-success-title"
          >
            <button
              onClick={() => setConfirmationData(null)}
              className="absolute top-4 end-4 text-gray-400 hover:text-gray-600 text-2xl"
              aria-label={t("close", { default: "Close" })}
            >
              &times;
            </button>

            <h2
              id="order-success-title"
              className="text-xl font-bold text-center text-green-700 mb-4"
            >
              {t("orderSuccess")}
            </h2>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>{t("name")}:</strong> {confirmationData.firstName}{" "}
                {confirmationData.lastName}
              </p>
              <p>
                <strong>{t("phoneNumber1")}:</strong>{" "}
                {confirmationData.phoneNumber1}
                <br />
                <span className="text-emerald-700">
                  {t("waConfirmNotice", {
                    default:
                      "You'll receive a confirmation message on WhatsApp at this number.",
                  })}
                </span>
              </p>
              {confirmationData.phoneNumber2 && (
                <p>
                  <strong>{t("phoneNumber2")}:</strong>{" "}
                  {confirmationData.phoneNumber2}
                </p>
              )}
              <p>
                <strong>{t("city")}:</strong> {confirmationData.city}
              </p>
              <p>
                <strong>{t("address")}:</strong> {confirmationData.address}
              </p>
              <p>
                <strong>{t("total")}:</strong>{" "}
                {formatCurrency(confirmationData.final_price)}
              </p>

              <div>
                <strong>{t("products")}:</strong>
                <ul className="list-disc list-inside">
                  {confirmationData.options.map((opt, idx) => (
                    <li key={idx} className="mt-1">
                      {opt.name} ×{opt.quantity} – {formatCurrency(opt.price)}
                      {Object.keys(opt.selectedAttributes).length > 0 && (
                        <>
                          <br />
                          {Object.entries(opt.selectedAttributes)
                            .map(([key, val]) => `${key}: ${val}`)
                            .join(", ")}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>


          </div>
        </div>
      )}
    </div>
  );
};

export default ContactInfo;
