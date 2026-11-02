'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Trash2, Loader2, Pencil, ImagePlus, X, Check, Plus, Save } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import { store_id } from '@/app/lib/constants';
import { cdn } from '@/lib/cdn';
import {
  fetchCategories,
  addCategory,
  deleteCategoryById,
  updateCategory,
  bulkUpdateCategoryOrder,
} from '@/app/lib/productService';
import type { Category } from '@/app/lib/interfaces';
import { Button } from '@/components/ui/button';

const BUCKET = 'products-images';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(''); // JSON of saved orderby values

  // add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSecondaryName, setNewSecondaryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  // delete confirm
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingSecondaryValue, setEditingSecondaryValue] = useState('');
  const [savingNameId, setSavingNameId] = useState<string | null>(null);
  const saveLockRef = useRef(false);

  // image uploading
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  const locale = useLocale();
  const t = useTranslations('AdminCategories');
  const isRTL = locale === 'ar' || locale === 'he';

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchCategories();
      setCategories(data);
      setSavedSnapshot(JSON.stringify(data.map((c) => ({ id: c.id, orderby: c.orderby }))));
      setLoading(false);
    })();
  }, []);

  const sorted = useMemo(() => {
    const list = [...categories];
    list.sort((a, b) => {
      const ao = a.orderby ?? Number.MAX_SAFE_INTEGER;
      const bo = b.orderby ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [categories]);

  const isDirty = useMemo(() => {
    const current = JSON.stringify(sorted.map((c) => ({ id: String(c.id), orderby: c.orderby })));
    const saved = savedSnapshot
      ? JSON.stringify(
        JSON.parse(savedSnapshot)
          .slice()
          .sort((a: any, b: any) => (a.orderby ?? 999) - (b.orderby ?? 999))
          .map((r: any) => ({ id: String(r.id), orderby: r.orderby }))
      )
      : '';
    return current !== saved;
  }, [sorted, savedSnapshot]);
  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || categories.some((c) => c.name === trimmed)) return;
    setAddingCategory(true);
    const created = await addCategory(trimmed);
    if (created) {
      const nextOrder =
        (sorted.filter((c) => Number.isFinite(c.orderby as any)).at(-1)?.orderby ?? 0) + 1;
      const optimistic: Category = { ...created, is_visible: true, orderby: nextOrder };
      setCategories((prev) => [...prev, optimistic]);
      await updateCategory(String(created.id), {
        is_visible: true,
        orderby: nextOrder,
        ...(newSecondaryName.trim() ? { secondary_name: newSecondaryName.trim() } : {}),
      });
      setNewName('');
      setNewSecondaryName('');
      setShowAddForm(false);
    }
    setAddingCategory(false);
  }

  /* ── Delete ── */
  function confirmDelete(id: string) {
    setSelectedCategoryId(id);
    setShowConfirm(true);
  }
  async function handleConfirmDelete() {
    if (!selectedCategoryId) return;
    const prev = categories;
    setCategories(prev.filter((c) => String(c.id) !== selectedCategoryId));
    try {
      const ok = await deleteCategoryById(selectedCategoryId);
      if (!ok) setCategories(prev);
    } finally {
      setShowConfirm(false);
      setSelectedCategoryId(null);
    }
  }

  /* ── Visibility ── */
  async function toggleVisible(cat: Category) {
    const prev = categories;
    setCategories(prev.map((c) => c.id === cat.id ? { ...c, is_visible: !cat.is_visible } : c));
    const ok = await updateCategory(String(cat.id), { is_visible: !cat.is_visible });
    if (!ok) setCategories(prev);
  }

  /* ── Order ── */
  function changeOrder(cat: Category, value: number) {
    setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, orderby: value } : c));
  }
  async function normalizeAndSaveOrder() {
    setSavingOrder(true);
    const reindexed = sorted.map((c, idx) => ({ id: String(c.id), orderby: idx + 1 }));
    const ok = await bulkUpdateCategoryOrder(reindexed);
    if (ok) {
      setCategories((prev) =>
        prev.map((c) => {
          const found = reindexed.find((r) => r.id === String(c.id));
          return found ? { ...c, orderby: found.orderby } : c;
        })
      );
      setSavedSnapshot(JSON.stringify(reindexed.map((r) => ({ id: r.id, orderby: r.orderby }))));
    }
    setSavingOrder(false);
  }

  /* ── Name editing ── */
  function startEdit(cat: Category) {
    setEditingId(String(cat.id));
    setEditingValue(cat.name);
    setEditingSecondaryValue(cat.secondary_name || '');
  }
  async function saveEdit(cat: Category) {
    if (saveLockRef.current) return;
    saveLockRef.current = true;
    const newN = editingValue.trim();
    const newSec = editingSecondaryValue.trim();
    setEditingId(null);
    if (!newN || (newN === cat.name && newSec === (cat.secondary_name || ''))) {
      saveLockRef.current = false;
      return;
    }
    const prev = categories;
    setSavingNameId(String(cat.id));
    setCategories(prev.map((c) => c.id === cat.id ? { ...c, name: newN, secondary_name: newSec || undefined } : c));
    const ok = await updateCategory(String(cat.id), { name: newN, secondary_name: newSec || undefined });
    if (!ok) setCategories(prev);
    setSavingNameId(null);
    saveLockRef.current = false;
  }
  function cancelEdit() {
    setEditingId(null);
    setEditingValue('');
    setEditingSecondaryValue('');
  }

  /* ── Image upload ── */
  async function handleImageUpload(cat: Category, file: File) {
    setUploadingImageId(String(cat.id));
    try {
      const safeName = file.name.replace(/\s+/g, '_');
      const filePath = `${store_id}/categories/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: signedData, error: urlError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);
      if (urlError || !signedData) throw urlError ?? new Error('No signed URL');

      const newExtras = { image_path: signedData.signedUrl };
      const ok = await updateCategory(String(cat.id), { extras: newExtras });
      if (ok) setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, extras: newExtras } : c));
    } catch (err: any) {
      console.error('❌ Category image upload failed:', err?.message);
    } finally {
      setUploadingImageId(null);
    }
  }

  async function handleRemoveImage(cat: Category) {
    const newExtras = { image_path: null };
    const ok = await updateCategory(String(cat.id), { extras: newExtras });
    if (ok) setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, extras: newExtras } : c));
  }

  /* ─────────────────── RENDER ── */
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="mx-auto max-w-5xl px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="rounded-xl gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {t('add')}
          </Button>
        </div>
      </div>

      {/* ── Add Category Form ── */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {t('add')} {t('name')}
          </h2>
          <form onSubmit={handleAddCategory} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-gray-500 font-medium">
                  {isRTL ? 'الاسم بالعربي' : 'Arabic Name'} *
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder={t('placeholder')}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-gray-500 font-medium">
                  {isRTL ? 'الاسم بالإنجليزي' : 'English Name'} (optional)
                </label>
                <input
                  type="text"
                  placeholder="English name"
                  value={newSecondaryName}
                  onChange={(e) => setNewSecondaryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewName('');
                  setNewSecondaryName('');
                  setShowAddForm(false);
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={addingCategory || !newName.trim()}
                className="rounded-xl"
              >
                {addingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : t('add')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && sorted.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <ImagePlus className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No categories yet. Add your first one!</p>
        </div>
      )}

      {/* ── Cards Grid ── */}
      {!loading && sorted.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map((cat) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              isRTL={isRTL}
              editingId={editingId}
              editingValue={editingValue}
              editingSecondaryValue={editingSecondaryValue}
              savingNameId={savingNameId}
              uploadingImageId={uploadingImageId}
              onStartEdit={startEdit}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
              onEditValueChange={setEditingValue}
              onEditSecondaryValueChange={setEditingSecondaryValue}
              onToggleVisible={toggleVisible}
              onChangeOrder={changeOrder}
              onConfirmDelete={confirmDelete}
              onImageUpload={handleImageUpload}
              onRemoveImage={handleRemoveImage}
            />
          ))}
        </div>
      )}

      {/* ── Sticky Save Bar ── */}
      {isDirty && !loading && (
        <div className={`fixed bottom-0 ${isRTL ? 'right-0' : 'left-0'} right-0 z-40 flex items-center justify-between gap-4 px-6 py-4 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]`}>
          <p className="text-sm text-gray-600">
            {isRTL ? 'لديك تغييرات غير محفوظة في ترتيب الأقسام' : 'You have unsaved changes to the category order.'}
          </p>
          <Button
            onClick={normalizeAndSaveOrder}
            disabled={savingOrder}
            className="rounded-xl gap-2 shrink-0"
          >
            {savingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('saveOrder')}
          </Button>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{t('confirmDeleteTitle')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('confirmDelete')}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowConfirm(false)}>
                {t('cancel')}
              </Button>
              <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleConfirmDelete}>
                {t('delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────── CategoryCard ── */
interface CardProps {
  cat: Category;
  isRTL: boolean;
  editingId: string | null;
  editingValue: string;
  editingSecondaryValue: string;
  savingNameId: string | null;
  uploadingImageId: string | null;
  onStartEdit: (cat: Category) => void;
  onSaveEdit: (cat: Category) => void;
  onCancelEdit: () => void;
  onEditValueChange: (v: string) => void;
  onEditSecondaryValueChange: (v: string) => void;
  onToggleVisible: (cat: Category) => void;
  onChangeOrder: (cat: Category, value: number) => void;
  onConfirmDelete: (id: string) => void;
  onImageUpload: (cat: Category, file: File) => void;
  onRemoveImage: (cat: Category) => void;
}

function CategoryCard({
  cat, isRTL,
  editingId, editingValue, editingSecondaryValue,
  savingNameId, uploadingImageId,
  onStartEdit, onSaveEdit, onCancelEdit,
  onEditValueChange, onEditSecondaryValueChange,
  onToggleVisible, onChangeOrder, onConfirmDelete,
  onImageUpload, onRemoveImage,
}: CardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = editingId === String(cat.id);
  const isUploadingThis = uploadingImageId === String(cat.id);
  const isSavingName = savingNameId === String(cat.id);

  const extrasRaw = cat.extras;
  const extras = typeof extrasRaw === 'string' ? JSON.parse(extrasRaw) : extrasRaw;
  const imagePath = extras?.image_path;
  const previewUrl = imagePath ? cdn(imagePath) : null;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur();
    if (e.key === 'Escape') { e.preventDefault(); onCancelEdit(); }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">

      {/* ── Image area ── */}
      <div className="relative group aspect-square bg-gray-50">
        {previewUrl ? (
          <>
            <img src={previewUrl} alt={cat.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingThis}
                className="h-9 w-9 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white transition"
                title="Change image"
              >
                {isUploadingThis
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Pencil className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => onRemoveImage(cat)}
                className="h-9 w-9 rounded-full bg-white/90 flex items-center justify-center text-red-500 hover:bg-white transition"
                title="Remove image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingThis}
            className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            {isUploadingThis
              ? <Loader2 className="h-8 w-8 animate-spin" />
              : <ImagePlus className="h-8 w-8" />}
            <span className="text-[11px] font-medium">
              {isUploadingThis ? 'Uploading…' : 'Add Image'}
            </span>
          </button>
        )}

        {/* Visibility pill */}
        <button
          type="button"
          onClick={() => onToggleVisible(cat)}
          className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} h-5 px-2 rounded-full text-[10px] font-semibold shadow-sm transition-colors ${cat.is_visible ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}
        >
          {cat.is_visible ? 'On' : 'Off'}
        </button>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageUpload(cat, file);
            e.target.value = '';
          }}
        />
      </div>

      {/* ── Body ── */}
      <div className="p-3 flex flex-col gap-2 flex-1">

        {/* Name / editing */}
        {isEditing ? (
          <div className="space-y-1.5">
            <input
              autoFocus
              value={editingValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Arabic name"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
            />
            <input
              value={editingSecondaryValue}
              onChange={(e) => onEditSecondaryValueChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => onSaveEdit(cat)}
              placeholder="English name"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onSaveEdit(cat)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition"
              >
                <Check className="h-3 w-3" /> Save
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition"
              >
                <X className="h-3 w-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onStartEdit(cat)}
            className="group text-start w-full"
          >
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                  {cat.name}
                </p>
                {cat.secondary_name && (
                  <p className="text-xs text-gray-400 truncate">{cat.secondary_name}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                {isSavingName && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                <Pencil className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition" />
              </div>
            </div>
          </button>
        )}

        {/* Order + Delete */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="text-[10px] text-gray-400 shrink-0">#</span>
            <input
              type="number"
              min={1}
              value={cat.orderby ?? ''}
              onChange={(e) => onChangeOrder(cat, Number(e.target.value || 1))}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black/20 text-gray-700"
              title="Display order"
            />
          </div>
          <button
            type="button"
            onClick={() => onConfirmDelete(String(cat.id))}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition shrink-0"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
