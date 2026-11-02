"use client"

import type React from "react"
import { useEffect, useMemo, useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { Trash2, Pencil, Loader2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
// 🔽 use your supabase-backed service
import {
  fetchDiscountCodes,
  addDiscountCode,
  deleteDiscountCodeById,
  updateDiscountCode,
} from "@/app/lib/productService"

export interface DiscountCode {
  id: number
  code: string
  discount_value: number
  min_value: number
  valid_until: string
  store_id: number
  created_at: string
  is_active?: boolean
}
export default function AdminDiscountCodesPage() {
  const t = useTranslations("discountCodes")

  // TODO: inject this properly (context, settings, router param, etc.)
  const storeId = 8

  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const [newCode, setNewCode] = useState<Omit<DiscountCode, "id" | "created_at">>({
    code: "",
    discount_value: 0,
    min_value: 0,
    valid_until: "",
    store_id: storeId,
    is_active: true
  })

  // inline editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<keyof DiscountCode | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const saveLockRef = useRef(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchDiscountCodes()
        setDiscountCodes(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [storeId])

  const sorted = useMemo(
    () => [...discountCodes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [discountCodes]
  )

  async function handleAddDiscountCode(e: React.FormEvent) {
    e.preventDefault()
    if (!newCode.code.trim() || newCode.discount_value <= 0) return

    setLoading(true)
    try {
      const created = await addDiscountCode(newCode)
      if (created) {
        setDiscountCodes((prev) => [created, ...prev])
        setNewCode({
          code: "",
          discount_value: 0,
          min_value: 0,
          valid_until: "",
          store_id: storeId,
          is_active: true
        })
        setShowAddForm(false)
      }
    } finally {
      setLoading(false)
    }
  }

  function confirmDelete(id: string) {
    setSelectedCodeId(id)
    setShowConfirm(true)
  }

  async function handleConfirmDelete() {
    if (!selectedCodeId) return
    const prev = discountCodes
    setDiscountCodes(prev.filter((c) => c.id !== Number.parseInt(selectedCodeId))) // optimistic

    try {
      const ok = await deleteDiscountCodeById(selectedCodeId)
      if (!ok) setDiscountCodes(prev) // rollback on failure
    } finally {
      setShowConfirm(false)
      setSelectedCodeId(null)
    }
  }

  async function toggleActive(code: DiscountCode) {
    const prev = discountCodes
    const next = prev.map((c) => (c.id === code.id ? { ...c, is_active: !code.is_active } : c))
    setDiscountCodes(next) // optimistic
    const ok = await updateDiscountCode(String(code.id), { is_active: !code.is_active })
    if (!ok) setDiscountCodes(prev) // rollback
  }

  function startEdit(code: DiscountCode, field: keyof DiscountCode) {
    setEditingId(String(code.id))
    setEditingField(field)
    setEditingValue(String(code[field]))
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function saveEdit(code: DiscountCode) {
    if (saveLockRef.current || !editingField) return
    saveLockRef.current = true

    const newValue = editingValue.trim()
    setEditingId(null)
    setEditingField(null)

    if (!newValue || newValue === String(code[editingField])) {
      saveLockRef.current = false
      return
    }

    const prev = discountCodes
    setSavingId(String(code.id))

    let updateValue: any = newValue
    if (editingField === "discount_value" || editingField === "min_value") {
      updateValue = Number.parseFloat(newValue) || 0
    }

    // optimistic
    setDiscountCodes(prev.map((c) => (c.id === code.id ? { ...c, [editingField]: updateValue } : c)))

    const ok = await updateDiscountCode(String(code.id), { [editingField]: updateValue } as Partial<DiscountCode>)
    if (!ok) setDiscountCodes(prev) // rollback

    setSavingId(null)
    saveLockRef.current = false
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingField(null)
    setEditingValue("")
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>, code: DiscountCode) {
    if (e.key === "Enter") e.currentTarget.blur()
    else if (e.key === "Escape") {
      e.preventDefault()
      cancelEdit()
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString()
  }

  function isExpired(validUntil: string) {
    return new Date(validUntil) < new Date()
  }

  // ------- JSX BELOW (unchanged UI, still using t() keys) -------
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 md:p-10 mt-5">
      <div className="mb-5 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1">{t("title")}</h1>
          <p className="text-gray-500 text-sm">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="rounded-xl self-start sm:self-auto" disabled={loading}>
          {t("addNew")}
        </Button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">{t("modal.addTitle")}</h2>
            <form onSubmit={handleAddDiscountCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("form.code")}</label>
                <input
                  type="text"
                  value={newCode.code}
                  onChange={(e) => setNewCode((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder={t("form.placeholderCode")}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("form.discountPercent")}</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newCode.discount_value || ""}
                    onChange={(e) => setNewCode((prev) => ({ ...prev, discount_value: Number.parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("form.minValue")}</label>
                  <input
                    type="number"
                    min="0"
                    value={newCode.min_value || ""}
                    onChange={(e) => setNewCode((prev) => ({ ...prev, min_value: Number.parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("form.validUntil")}</label>
                <input
                  type="date"
                  value={newCode.valid_until}
                  onChange={(e) => setNewCode((prev) => ({ ...prev, valid_until: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  {t("form.cancel")}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("form.addCode")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 items-center px-4 py-3 text-xs font-semibold uppercase text-gray-500 bg-gray-50">
          <div className="col-span-2">{t("table.code")}</div>
          <div className="col-span-2">{t("table.discount")}</div>
          <div className="col-span-2">{t("table.minValue")}</div>
          <div className="col-span-2">{t("table.validUntil")}</div>
          <div className="col-span-2">{t("table.status")}</div>
          <div className="col-span-2 text-right">{t("table.actions")}</div>
        </div>

        {sorted.map((code) => (
          <div
            key={code.id}
            className={`lg:grid lg:grid-cols-12 lg:items-center px-3 sm:px-4 py-4 border-t first:border-t-0 hover:bg-gray-50/60 ${isExpired(code.valid_until) ? "bg-red-50/30" : ""}`}
          >
            {/* Mobile card */}
            <div className="lg:hidden space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Tag className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    {editingId === String(code.id) && editingField === "code" ? (
                      <input
                        ref={inputRef}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => saveEdit(code)}
                        onKeyDown={(e) => onKeyDown(e, code)}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/20"
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(code, "code")}
                        className="text-lg font-mono font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {code.code}
                      </button>
                    )}
                    <p className="text-xs text-gray-500">{t("table.createdAt", { date: formatDate(code.created_at) })}</p>
                  </div>
                </div>
                <button
                  onClick={() => confirmDelete(code.id.toString())}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title={t("table.deleteTitle")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t("mobile.discount")}</span>
                  <div className="font-semibold text-green-600">{t("table.percentOff", { value: code.discount_value })}</div>
                </div>
                <div>
                  <span className="text-gray-500">{t("mobile.minValue")}</span>
                  <div className="font-semibold">{t("table.currencyValue", { value: code.min_value })}</div>
                </div>
                <div>
                  <span className="text-gray-500">{t("mobile.validUntil")}</span>
                  <div className={`font-semibold ${isExpired(code.valid_until) ? "text-red-600" : "text-gray-900"}`}>{formatDate(code.valid_until)}</div>
                </div>
                <div>
                  <span className="text-gray-500">{t("mobile.status")}</span>
                  <label className="inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={!!code.is_active}
                      onChange={() => toggleActive(code)}
                      className="peer sr-only"
                    />
                    <span className="relative h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-green-500 after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
                    <span className="ml-2 text-sm">{code.is_active ? t("table.active") : t("table.inactive")}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden lg:contents">
              <div className="col-span-2">
                {editingId === String(code.id) && editingField === "code" ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => saveEdit(code)}
                      onKeyDown={(e) => onKeyDown(e, code)}
                      className="px-2 py-1 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/20"
                    />
                    {savingId === String(code.id) && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                  </div>
                ) : (
                  <button onClick={() => startEdit(code, "code")} className="group flex items-center gap-2">
                    <span className="font-mono font-semibold text-gray-900 group-hover:text-blue-600">{code.code}</span>
                    <Pencil className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </button>
                )}
              </div>

              <div className="col-span-2">
                {editingId === String(code.id) && editingField === "discount_value" ? (
                  <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    max="100"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => saveEdit(code)}
                    onKeyDown={(e) => onKeyDown(e, code)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                ) : (
                  <button onClick={() => startEdit(code, "discount_value")} className="text-green-600 font-semibold hover:text-green-700">
                    {t("table.percentOff", { value: code.discount_value })}
                  </button>
                )}
              </div>

              <div className="col-span-2">
                {editingId === String(code.id) && editingField === "min_value" ? (
                  <input
                    ref={inputRef}
                    type="number"
                    min="0"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => saveEdit(code)}
                    onKeyDown={(e) => onKeyDown(e, code)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                ) : (
                  <button onClick={() => startEdit(code, "min_value")} className="font-semibold hover:text-blue-600">
                    {t("table.currencyValue", { value: code.min_value })}
                  </button>
                )}
              </div>

              <div className="col-span-2">
                {editingId === String(code.id) && editingField === "valid_until" ? (
                  <input
                    ref={inputRef}
                    type="date"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => saveEdit(code)}
                    onKeyDown={(e) => onKeyDown(e, code)}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                ) : (
                  <button onClick={() => startEdit(code, "valid_until")} className={`hover:underline ${isExpired(code.valid_until) ? "text-red-600" : "text-gray-900"}`}>
                    {formatDate(code.valid_until)}
                    {isExpired(code.valid_until) && <span className="ml-1 text-xs">({t("table.expired")})</span>}
                  </button>
                )}
              </div>

              <div className="col-span-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={!!code.is_active} onChange={() => toggleActive(code)} className="peer sr-only" />
                  <span className="relative h-6 w-10 rounded-full bg-gray-200 transition-colors peer-checked:bg-green-500 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
                  <span className="ml-2 text-sm text-gray-700">{code.is_active ? t("table.active") : t("table.inactive")}</span>
                </label>
              </div>

              <div className="col-span-2 text-right">
                <button
                  onClick={() => confirmDelete(code.id.toString())}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                  title={t("table.deleteTitle")}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {sorted.length === 0 && !loading && (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t("empty.title")}</h3>
            <p className="text-gray-500 mb-4">{t("empty.subtitle")}</p>
            <Button onClick={() => setShowAddForm(true)}>{t("addNew")}</Button>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">{t("confirm.title")}</h2>
            <p className="text-gray-600">{t("confirm.body")}</p>
            <div className="flex justify-center gap-4 mt-4">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                {t("confirm.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                {t("confirm.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
