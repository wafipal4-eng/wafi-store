'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

import { store_id } from '@/app/lib/constants';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Upload, Trash2, Image as ImageIcon, Link as LinkIcon, Type } from 'lucide-react';
import { cdn } from '@/lib/cdn';
import { fetchCategories } from '@/app/lib/productService';
import { Category } from '@/app/lib/interfaces';

interface HeroImage {
  path: string;
  title: string;
  subtitle: string;
  buttonText: string;
  link: string;
}

const BUCKET = 'products-images';

export default function StoreSettingsPage() {
  const t = useTranslations('StoreSettings');

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<HeroImage[]>([]);
  const [banner, setBanner] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);

  // Fetch current store settings
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const [{ data: storeData, error: storeError }, categoriesData] = await Promise.all([
          supabase
            .from('store')
            .select('images, banner, text_color')
            .eq('id', store_id)
            .single(),
          fetchCategories()
        ]);

        if (storeError) throw storeError;
        if (cancelled) return;

        // Convert strings to objects if necessary (handles text[] array containing JSON strings)
        const rawImages = storeData?.images || [];
        setBanner(storeData?.banner || '');
        setTextColor(storeData?.text_color || '#000000');
        const normalizedImages: HeroImage[] = rawImages.map((item: any) => {
          if (typeof item === 'string') {
            try {
              // Try to parse if it's a JSON string
              if (item.trim().startsWith('{')) {
                const parsed = JSON.parse(item);
                return { 
                  path: parsed.path || item, 
                  title: parsed.title || '', 
                  subtitle: parsed.subtitle || '',
                  buttonText: parsed.buttonText || 'Shop Now',
                  link: parsed.link || '/Products' 
                };
              }
            } catch (e) {
              // Not JSON, just a path string
            }
            return { path: item, title: '', subtitle: '', buttonText: 'Shop Now', link: '/Products' };
          }
          return item;
        });

        setImages(normalizedImages);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching store settings:', err);
        toast.error(t('loadingError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [supabase, t]);

  const uploadImage = async (file: File): Promise<string> => {
    const safeName = file.name.replace(/\s+/g, '_');
    const filePath = `${store_id}/hero/${Date.now()}_${safeName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    });

    if (error) throw error;
    return `${BUCKET}/${filePath}`;
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newPaths = await Promise.all(Array.from(files).map(file => uploadImage(file)));
      const newImages: HeroImage[] = newPaths.map(path => ({
        path,
        title: '',
        subtitle: '',
        buttonText: 'Shop Now',
        link: '/Products'
      }));
      setImages(prev => [...prev, ...newImages]);
      toast.success('Images uploaded! Remember to save changes.');
    } catch (err) {
      console.error(err);
      toast.error(t('errorMessage'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateImage = (index: number, updates: Partial<HeroImage>) => {
    setImages(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleSave = async () => {
    console.log('🚀 Attempting to save images...', { store_id, images });
    setSaving(true);
    try {
      const { error } = await supabase
        .from('store')
        .update({ 
          images: images,
          banner: banner,
          text_color: textColor
        })
        .eq('id', store_id);

      if (error) {
        console.error('❌ Supabase Save Error Detail:', error);
        toast.error(`${t('errorMessage')} (${error.message})`);
        throw error;
      }
      
      // Verify the save by fetching again
      const { data: verifyData } = await supabase
        .from('store')
        .select('images, banner, text_color')
        .eq('id', store_id)
        .single();
      
      console.log('🔍 Verification after save:', verifyData);
      
      toast.success(t('successMessage'));
      console.log('✅ Save successful and verified!');
    } catch (err) {
      console.error('Error updating store settings:', err);
      toast.error(t('errorMessage'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving || uploading} className="rounded-xl px-8 h-11 bg-indigo-600 hover:bg-indigo-700">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm rounded-3xl">
        <CardHeader className="border-b bg-gray-50/50 p-6">
          <CardTitle className="text-xl">{t('bannerTitle')}</CardTitle>
          <CardDescription>{t('bannerDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('bannerPlaceholder')}
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                className="w-full bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm font-medium shadow-sm"
              />
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">لون الخط في الصفحة الرئيسية</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-16 h-10 rounded-lg cursor-pointer border border-gray-200"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm rounded-3xl">
        <CardHeader className="border-b bg-gray-50/50 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{t('heroImages')}</CardTitle>
              <CardDescription>{t('heroImagesDescription')}</CardDescription>
            </div>
            <div className="relative w-full sm:w-auto">
              <input
                id="multi-upload"
                type="file"
                accept="image/*,video/*,.gif"
                multiple
                className="hidden"
                onChange={handleAddImage}
                disabled={uploading}
              />
              <Button disabled={uploading} asChild variant="outline" className="rounded-xl w-full sm:w-auto border-dashed border-2 h-11">
                <label htmlFor="multi-upload" className="cursor-pointer flex items-center justify-center gap-2">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? t('saving') : t('uploadImage')}
                </label>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
              <ImageIcon className="h-12 w-12 mb-4 opacity-10" />
              <p className="text-sm font-medium">{t('noImageUploaded')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {images.map((img, index) => (
                <div key={index} className="flex flex-col gap-4 p-4 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="group relative aspect-video rounded-2xl overflow-hidden border border-gray-200">
                    <img
                      src={cdn(img.path)}
                      alt={`Hero ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-gray-900 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm border border-white/50">
                      #{index + 1}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => handleRemoveImage(index)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl h-11 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors border border-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('deleteImage')}
                  </Button>
                  
                  <div className="space-y-3 px-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Type className="h-4 w-4 text-gray-400 shrink-0" />
                          <input
                            type="text"
                            placeholder={t('slideTitle')}
                            value={img.title}
                            onChange={(e) => handleUpdateImage(index, { title: e.target.value })}
                            className="flex-1 bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm font-medium"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Type className="h-4 w-4 text-gray-400 shrink-0" />
                          <input
                            type="text"
                            placeholder={t('slideButtonText')}
                            value={img.buttonText}
                            onChange={(e) => handleUpdateImage(index, { buttonText: e.target.value })}
                            className="flex-1 bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Type className="h-4 w-4 text-gray-400 shrink-0 mt-2.5" />
                        <textarea
                          placeholder={t('slideSubtitle')}
                          value={img.subtitle}
                          onChange={(e) => handleUpdateImage(index, { subtitle: e.target.value })}
                          rows={2}
                          className="flex-1 bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm font-medium resize-none"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-gray-400 shrink-0" />
                        <select
                          value={img.link}
                          onChange={(e) => handleUpdateImage(index, { link: e.target.value })}
                          className="flex-1 bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm font-medium appearance-none"
                        >
                          <option value="/Products">{t('allProducts')}</option>
                          <optgroup label={t('categoriesLabel')}>
                            {categories.map((cat) => (
                              <option key={cat.id} value={`/Products?category=${cat.id}`}>
                                {cat.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
