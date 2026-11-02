"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// React
import React, { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

// Constants & Helpers
import { supabase, store_id, maxProducts, SUPPORTED_LANGUAGES } from "@/app/lib/constants";
import { cartesianProduct } from "@/app/lib/utils";

// Services
import {
  createProduct,
  saveProductVariants,
  fetchCategories,
  fetchAttributesByIds,
  createProductCategories,
  saveProductAttributeItems,
} from "@/app/lib/productService";

// Types
import { Category } from "@/app/lib/interfaces";

// Custom Components
import SingleImageUploader from "@/components/custom/main_image_uploader";
import ImagesUploader from "@/components/custom/images-uploader";
import MultiCategorySelect from "@/components/custom/MultiCategorySelect";
import StockStatusSelect from "@/app/components/add-product/StockStatusSelect";
import ProductLimitNotice from "@/app/components/add-product/MaxHit";
import VariantImageList from "@/app/components/dashboard-components/variant-image-list";
import type { Attribute, AttributeItem, VariantCombination } from "@/app/lib/productInterface";


// -------------------------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------------------------

export default function AddProductPage() {
  // ----------------------------- Locale & i18n --------------------------------
  const t = useTranslations("AddProduct");
  const locale = useLocale();
  const isRtl = ["ar", "he"].includes(locale);

  // ----------------------------- State ----------------------------------------
  const [tab, setTab] = useState("basic");
  const [productId, setProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const [currency, setCurrency] = useState("ILS");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [showImageError, setShowImageError] = useState(false);

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeItems, setAttributeItems] = useState<AttributeItem[]>([]);
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([]);
  const [newAttrName, setNewAttrName] = useState("");

  const steps: Record<string, number> = {
    basic: 1,
    media: 2,
    variants: 3,
    success: 4
  };
  const currentStep = steps[tab] || 1;


  // ----------------------------- Effects --------------------------------------

  // 🔄 Fetch categories on mount
  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  // 🚫 Check if product limit is reached
  useEffect(() => {
    const checkLimit = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id")
        .eq("store_id", store_id)
        .eq("is_deleted", false);

      if (error) {
        console.error("Error checking product limit:", error);
        return;
      }

      if ((data?.length ?? 0) >= maxProducts) {
        setLimitReached(true);
      }
    };

    checkLimit();
  }, []);

  // 🧮 Generate variant combinations (cartesian product)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const grouped = attributes.reduce<Record<string, string[]>>((acc, attr) => {
        acc[attr.name] = attributeItems
          .filter((item) => item.attribute_id === attr.id)
          .map((item) => item.name);
        return acc;
      }, {});

      const combos = cartesianProduct(grouped);
      setVariantCombinations(
        combos.map((combo) => ({
          ...combo,
          in_stock: true,
          price_modifier: 0,
          v_quantity: 0,
        }))
      );
    }, 300);

    return () => clearTimeout(timeout);
  }, [attributes, attributeItems]);


  // -------------------------------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------------------------------

  // ⛔ Prevent form submit on Enter (unless textarea)
  const preventEnterSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  };

  // ➕ Add new attribute
  const handleAddAttribute = () => {
    const name = newAttrName.trim();
    if (!name || attributes.some((a) => a.name === name)) return;
    setAttributes((prev) => [...prev, { id: Date.now(), name }]);
    setNewAttrName("");
  };


  // ➕ Add item under attribute
  const handleAddAttributeItem = (attribute_id: number) => {
    setAttributeItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        attribute_id,
        name: "",
        price: 0,
        in_stock: true,
        v_quantity: 0,
      },
    ]);
  };

  // 🔁 Update item by index
  const updateAttributeItem = (index: number, changes: Partial<AttributeItem>) => {
    setAttributeItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...changes } as AttributeItem;
      return updated;
    });
  };


  // 🔁 Update variant combination
  const updateVariantCombination = (
    index: number,
    changes: Partial<Pick<VariantCombination, "in_stock" | "price_modifier" | "v_quantity">>
  ) => {
    setVariantCombinations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...changes };
      return updated;
    });
  };


  // -------------------------------------------------------------------------------------------------
  // Submit Flow
  // -------------------------------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imageUrl && tab === "basic") return setShowImageError(true);
    if (submitting) return;

    setSubmitting(true);

    if (tab === "basic") {
      const form = new FormData(e.currentTarget);

      const productData = {
        id: crypto.randomUUID(),
        name: form.get("name") as string,
        secondary_name: form.get("secondary_name") as string || undefined,
        description: form.get("description") as string,
        secondary_description: form.get("secondary_description") as string || undefined,
        price: parseFloat(form.get("price") as string),
        new_price: parseFloat(form.get("new_price") as string) || 0,
        quantity: parseFloat(form.get("quantity") as string) || 0,
        main_image: imageUrl,
        in_stock: true,
        currency,
        category: selectedCategories[0] ?? "",
      };

      const result = await createProduct(productData);
      if (!result) {
        console.error("❌ Failed to create product");
        setSubmitting(false);
        return;
      }

      setProductId(result.id);

      if (selectedCategories.length) {
        await createProductCategories({
          product_id: result.id,
          category_ids: selectedCategories,
        });
      }

      await saveAttributesAndVariants(result.id);
      setTab("media");

    } else if (tab === "media") {
      setTab("variants");
    } else if (tab === "variants") {
      setTab("success");
    }

    setSubmitting(false);
  };


  const saveAttributesAndVariants = async (product_id: string) => {
    const inserted = await saveProductAttributeItems(product_id, attributes, attributeItems);

    const attrIds = [...new Set(inserted.map((i) => i.attribute_id))];
    const attributeRecords = await fetchAttributesByIds(attrIds);

    const attrIdMap = Object.fromEntries(
      attributeRecords.map((attr) => [attr.name.trim().toLowerCase(), attr.id])
    );

    const variantsToSave = variantCombinations.map((variant) => {
      const attribute_items = Object.entries(variant)
        .filter(([key]) => !["in_stock", "price_modifier", "v_quantity"].includes(key))
        .map(([attributeName, value]) => {
          const attribute_id = attrIdMap[attributeName.trim().toLowerCase()];
          const found = inserted.find(
            (item) =>
              item.attribute_id === attribute_id &&
              item.name.trim().toLowerCase() === (value as string).trim().toLowerCase()
          );
          return found ? { attribute_id, attribute_item_id: found.id } : null;
        })
        .filter(Boolean) as { attribute_id: number; attribute_item_id: number }[];

      return {
        product_id,
        in_stock: variant.in_stock,
        price_modifier: variant.price_modifier,
        v_quantity: variant.v_quantity ?? 0,
        attribute_items,
      };
    });

    await saveProductVariants(variantsToSave);
  };


  const renderAddAttributeInput = () => (
    <div className="flex gap-2 mt-4">
      <Input placeholder={t("attributeName")} value={newAttrName} onChange={(e) => setNewAttrName(e.target.value)} />
      <Button type="button" onClick={handleAddAttribute}>
        {t("add")}
      </Button>
    </div>
  );

  const renderAttributeBlock = (attr: Attribute) => {
    const handleRemoveAttribute = () => {
      setAttributes((prev) => prev.filter((a) => a.id !== attr.id));
      setAttributeItems((prev) => prev.filter((i) => i.attribute_id !== attr.id));
    };

    return (
      <div key={attr.id} className="border p-4 rounded-2xl mt-6 space-y-4 shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold capitalize">{attr.name}</h4>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-lg font-bold text-muted-foreground hover:text-destructive"
            onClick={handleRemoveAttribute}
          >
            ×
          </Button>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {attributeItems
            .filter((i) => i.attribute_id === attr.id)
            .map((item) => {
              const index = attributeItems.findIndex((ai) => ai.id === item.id);
              return (
                <div key={item.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Value"
                    value={item.name}
                    className="flex-1"
                    onChange={(e) =>
                      updateAttributeItem(index, { name: e.target.value })
                    }
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setAttributeItems((prev) =>
                        prev.filter((i) => i.id !== item.id)
                      )
                    }
                  >
                    ✕
                  </Button>
                </div>
              );
            })}
        </div>

        {/* Add new item */}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => handleAddAttributeItem(attr.id)}
          >
            + {t("add")} {attr.name} Item
          </Button>
        </div>
      </div>
    );
  };

  const renderVariantCombinations = () => {
    if (variantCombinations.length === 0) return null;

    return (
      <div className="mt-6">
        <Label className="block mb-2">{t("variantCombinations")}</Label>

        {/* Table Headers (visible only on sm and up) */}
        <div className="hidden sm:grid grid-cols-4 gap-4 mb-2 text-sm font-semibold text-muted-foreground">
          <span className="text-center">{t("attributes")}</span>
          <span className="text-center">{t("inStock")}</span>
          <span className="text-center">{t("priceModifier")}</span>
          <span className="text-center">{t("v_quantity")}</span>
        </div>

        <div className="divide-y border rounded-md">
          {variantCombinations.map((variant, index) => {
            const attributes = Object.entries(variant).filter(
              ([key]) =>
                !["in_stock", "price_modifier", "v_quantity", "image_path"].includes(key)
            );

            return (
              <div
                key={index}
                className="flex flex-col gap-4 p-4 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4"
              >
                {/* Attributes */}
                <div className="text-sm text-muted-foreground">
                  {attributes.map(([k, v]) => (
                    <div key={k}>
                      <span className="font-medium">{k}</span>: {v}
                    </div>
                  ))}
                </div>

                {/* In Stock */}
                <div className="flex flex-col sm:block">
                  <Label className="sm:hidden text-xs text-muted-foreground mb-1">{t("inStock")}</Label>
                  <StockStatusSelect
                    value={variant.in_stock}
                    onChange={(val) =>
                      updateVariantCombination(index, { in_stock: val })
                    }
                  />
                </div>

                {/* Price Modifier */}
                <div className="flex flex-col sm:block">
                  <Label className="sm:hidden text-xs text-muted-foreground mb-1">{t("priceModifier")}</Label>
                  <Input
                    type="number"
                    value={variant.price_modifier ?? 0}
                    onChange={(e) =>
                      updateVariantCombination(index, {
                        price_modifier: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Quantity */}
                <div className="flex flex-col sm:block">
                  <Label className="sm:hidden text-xs text-muted-foreground mb-1">{t("v_quantity")}</Label>
                  <Input
                    type="number"
                    value={typeof variant.v_quantity === "number" ? variant.v_quantity : 0}
                    onChange={(e) =>
                      updateVariantCombination(index, {
                        v_quantity: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };




  return (
    <>
      {
        limitReached ? (
          <ProductLimitNotice />
        ) : (

          <div className="container max-w-4xl py-10 mt-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-semibold">{t("title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmit} className="space-y-6">
                  {/* Tabs: Basic / Media / Success */}
                  <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="grid grid-cols-4">
                      <TabsTrigger value="basic" disabled>{t("basic")}</TabsTrigger>
                      <TabsTrigger value="media" disabled>{t("media")}</TabsTrigger>
                      <TabsTrigger value="variants" disabled>{t("variants")}</TabsTrigger>
                      <TabsTrigger value="success" disabled>{t("success")}</TabsTrigger>
                    </TabsList>

                    {/* Basic Tab */}
                    <TabsContent value="basic" className="space-y-4 pt-6">
                      {/* Name & Price */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">{t("name")}</Label>
                          <Input id="name" name="name" required />
                        </div>

                        {/* Secondary Name - Only show if there are secondary languages */}
                        {SUPPORTED_LANGUAGES.secondary.length > 0 && (
                          <div>
                            <Label htmlFor="secondary_name">
                              {t("secondaryName")} ({SUPPORTED_LANGUAGES.secondary.join("/").toUpperCase()})
                            </Label>
                            <Input
                              id="secondary_name"
                              name="secondary_name"
                              placeholder={t("secondaryNamePlaceholder")}
                            />
                          </div>
                        )}

                        <div>
                          <Label htmlFor="price">{t("price")}</Label>
                          <div className="flex gap-2">
                            <Select value={currency} onValueChange={setCurrency}>
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder={t("currency")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ILS">ILS</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input id="price" name="price" type="number" min="0" step="0.01" className="flex-1" required />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="new_price">{t("new_price")}</Label>
                          <Input
                            id="new_price"
                            name="new_price"
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full"
                            placeholder={t("priceAfterDiscount")}
                          />
                        </div>

                        <div>
                          <Label htmlFor="quantity">{t("quantity")}</Label>
                          <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full"
                            placeholder={t("quantity")}
                          />
                        </div>
                      </div>

                      {/* Variants */}
                      <div>
                        <Label>{t("variants")}</Label>
                        {attributes.map(renderAttributeBlock)}
                        {renderAddAttributeInput()}
                      </div>

                      {/* Variant Combinations */}
                      {renderVariantCombinations()}

                      {/* Description */}
                      <div>
                        <Label htmlFor="description">{t("description")}</Label>
                        <Textarea id="description" name="description" rows={4} />
                      </div>

                      {/* Secondary Description - Only show if there are secondary languages */}
                      {SUPPORTED_LANGUAGES.secondary.length > 0 && (
                        <div>
                          <Label htmlFor="secondary_description">
                            {t("secondaryDescription")} ({SUPPORTED_LANGUAGES.secondary.join("/").toUpperCase()})
                          </Label>
                          <Textarea
                            id="secondary_description"
                            name="secondary_description"
                            rows={4}
                            placeholder={t("secondaryDescriptionPlaceholder")}
                          />
                        </div>
                      )}

                      {/* Main Image Upload */}
                      <div>
                        <Label htmlFor="main_image">{t("main_image")}</Label>
                        <SingleImageUploader imageUrl={imageUrl} setImageUrl={setImageUrl} />
                        {showImageError && (
                          <p className="text-sm text-destructive mt-2">
                            {t("pleaseUploadMainImage")}
                          </p>
                        )}
                      </div>


                      {/* Categories */}
                      <MultiCategorySelect
                        categories={categories}
                        selectedCategories={selectedCategories}
                        setSelectedCategories={setSelectedCategories}
                        isRtl={isRtl}
                        t={t}
                      />
                    </TabsContent>

                    {/* Media Tab */}
                    <TabsContent value="media" className="space-y-4 pt-6">
                      <Label>{t("images")}</Label>
                      <ImagesUploader images={images} setImages={setImages} productId={productId} />
                    </TabsContent>


                    <TabsContent value="variants" className="space-y-4 pt-6">
                      <Label>{t("variants")}</Label>
                      <VariantImageList productId={productId || 0} />
                    </TabsContent>



                    {/* Success Tab */}
                    <TabsContent value="success" className="text-center pt-6 space-y-4">
                      <h2 className="text-2xl font-bold text-green-600">{t("successMessage")}</h2>
                      <p className="text-gray-600">{t("productCreatedSuccess")}</p>
                      <Button className="cursor-pointer mb-10" onClick={() => window.location.reload()}>{t("createAnother")}</Button>
                    </TabsContent>
                  </Tabs>

                  {/* Actions */}
                  {currentStep < 3 && (
                    <div className="flex justify-end gap-2 pt-6">

                      <Button type="submit" disabled={submitting} className="cursor-pointer">
                        {submitting
                          ? t("saving")
                          : currentStep === 1
                            ? t("next")
                            : currentStep === 2
                              ? t("save")
                              : t("finish")}
                      </Button>
                    </div>
                  )}

                </form>
              </CardContent>
            </Card>
          </div>
        )
      }
    </>

  );
}
