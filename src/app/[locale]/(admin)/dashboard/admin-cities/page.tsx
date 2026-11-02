'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import { store_id } from '@/app/lib/constants';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface City {
  name: string;
  shipping_cost: number;
}

export default function AdminCitiesPage() {
  const t = useTranslations('CitiesManagement');
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [newCityName, setNewCityName] = useState('');
  const [newShippingCost, setNewShippingCost] = useState<number>(0);
  
  // Edit states
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editCityName, setEditCityName] = useState('');
  const [editShippingCost, setEditShippingCost] = useState<number>(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchCities();
  }, []);

  async function fetchCities() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store')
        .select('cities')
        .eq('id', store_id)
        .single();

      if (error) throw error;
      setCities(data?.cities || []);
    } catch (err) {
      console.error('Error fetching cities:', err);
      toast.error(t('errorUpdate'));
    } finally {
      setLoading(false);
    }
  }

  async function saveToDatabase(updatedCities: City[]) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('store')
        .update({ cities: updatedCities })
        .eq('id', store_id);

      if (error) throw error;
      setCities(updatedCities);
      toast.success(t('successUpdate'));
    } catch (err) {
      console.error('Error saving cities:', err);
      toast.error(t('errorUpdate'));
    } finally {
      setSaving(false);
    }
  }

  const handleAddCity = () => {
    if (!newCityName.trim()) return;
    const updated = [...cities, { name: newCityName.trim(), shipping_cost: newShippingCost }];
    saveToDatabase(updated);
    setNewCityName('');
    setNewShippingCost(0);
  };

  const handleDeleteCity = (index: number) => {
    const updated = cities.filter((_, i) => i !== index);
    saveToDatabase(updated);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditCityName(cities[index].name);
    setEditShippingCost(cities[index].shipping_cost);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const updated = [...cities];
    updated[editingIndex] = { name: editCityName, shipping_cost: editShippingCost };
    saveToDatabase(updated);
    setEditingIndex(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      {/* Add Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('cityName')}</label>
          <input
            type="text"
            value={newCityName}
            onChange={(e) => setNewCityName(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/50"
            placeholder={t('cityName')}
          />
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('shippingCost')}</label>
          <input
            type="number"
            value={newShippingCost}
            onChange={(e) => setNewShippingCost(Number(e.target.value))}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50/50"
          />
        </div>
        <Button onClick={handleAddCity} disabled={saving || !newCityName.trim()} className="rounded-xl h-10 px-6">
          <Plus className="w-4 h-4 mr-2" /> {t('addCity')}
        </Button>
      </div>

      {/* Cities List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700">{t('cityName')}</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700">{t('shippingCost')}</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-center">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {cities.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">{t('noCities')}</td>
              </tr>
            ) : (
              cities.map((city, index) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={editCityName}
                        onChange={(e) => setEditCityName(e.target.value)}
                        className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{city.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingIndex === index ? (
                      <input
                        type="number"
                        value={editShippingCost}
                        onChange={(e) => setEditShippingCost(Number(e.target.value))}
                        className="w-32 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    ) : (
                      <span className="text-gray-600 font-mono">₪ {city.shipping_cost}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {editingIndex === index ? (
                        <>
                          <Button onClick={handleSaveEdit} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => setEditingIndex(null)} variant="ghost" size="sm" className="rounded-lg">
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => startEdit(index)} variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleDeleteCity(index)} variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
