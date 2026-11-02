"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/app/lib/interfaces";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SingleImageUploader from "@/components/custom/main_image_uploader";
import ImagesUploader from "@/components/custom/images-uploader";
import { toast } from "sonner";
import { cdn } from "@/lib/cdn";

import { updateVariants, saveProductCategories, fetchProductCategories, fetchAllCategories, removeProductCategory } from "@/app/lib/productService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fetchProductImages, deleteProductImage, fetchVariants } from "@/app/lib/productService";

interface AttributeItem {
  id: number;
  name: string;
  price: number;
  in_stock: boolean;
  attribute_id: number;
  attribute_name: string;
}

interface Variant {
  id: string;
  attributes: { attribute: string; attribute_item: string }[];
  in_stock: boolean;
  price_modifier: number;
}

interface Props {
  product: Product & { attribute_items?: AttributeItem[] };
  onClose: () => void;
  onSave: (updated: Product) => void;
}

const UpdateProductModal: React.FC<Props> = ({ product, onClose, onSave }) => {
  const t = useTranslations("AdminTable");

  const [formData, setFormData] = useState<Product>({ ...product });
  const [dbImages, setDbImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [attributeItems, setAttributeItems] = useState<AttributeItem[]>(product.attribute_items ?? []);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [allCategories, setAllCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!product.id) return;
      const [images, fetchedVariants] = await Promise.all([
        fetchProductImages(product.id),
        fetchVariants(product.id),
      ]);

      const categoryResponse = await fetchProductCategories([product.id]);
      const productCategoryIds = categoryResponse.map((cat) => cat.id);

      const fetchedAllCategories = await fetchAllCategories();

      setDbImages(images);
      setVariants(fetchedVariants);
      setSelectedCategoryIds(productCategoryIds);
      setAllCategories(fetchedAllCategories);
      setLoadingImages(false);
    };

    loadData();
  }, [product.id]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === "number" ? parseFloat(value) :
      type === "checkbox" ? (e.target as HTMLInputElement).checked :
        value;

    setFormData((prev) => ({ ...prev, [name]: parsedValue } as Product));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await Promise.all([
        onSave(formData),
        updateVariants(
          variants.map((variant) => ({
            id: variant.id,
            price_modifier: variant.price_modifier,
            in_stock: variant.in_stock,
          }))
        ),
        saveProductCategories(product.id, selectedCategoryIds),
      ]);

      toast.success(t("updateSuccess", { default: "Product updated successfully." }));
      onClose();
    } catch (error) {
      console.error("❌ Product update failed:", error);
      toast.error(t("updateFailed", { default: "Failed to update product." }));
    }
  };




  const handleRemoveImage = async (url: string) => {
    const confirmed = confirm(t("confirmDeleteImage", { default: "Delete this image?" }));
    if (!confirmed) return;
    console.log("Deleting image:", url);
    const success = await deleteProductImage(url);
    if (success) {
      setDbImages((prev) => prev.filter((img) => img !== url));
    }
  };

  const groupedAttributes = attributeItems.reduce<Record<string, AttributeItem[]>>((acc, item) => {
    (acc[item.attribute_name] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h3 className="text-2xl font-semibold text-gray-800">{t("updateProduct", { default: "Update Product" })}</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">{t("productInfo", { default: "Product Info" })}</TabsTrigger>
              <TabsTrigger value="images">{t("productImages", { default: "Product Images" })}</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "name", label: "name", type: "text" },
                  { id: "price", label: "price", type: "number" },
                  { id: "new_price", label: "new_price", type: "number" }
                ].map(({ id, label, type }) => (
                  <div key={id}>
                    <Label htmlFor={id}>{t(label, { default: label.replace("_", " ").toUpperCase() })}</Label>
                    <Input
                      id={id}
                      name={id}
                      type={type}
                      value={
                        type === "number"
                          ? (formData[id as keyof Product] as number) ?? 0
                          : String(formData[id as keyof Product] ?? "")
                      }
                      onChange={handleChange}
                    />
                  </div>
                ))}

                {/* Stock Status */}
                <div>
                  <Label htmlFor="in_stock">{t("status", { default: "Status" })}</Label>
                  <Select
                    value={String(formData.in_stock)}
                    onValueChange={(val) => setFormData((prev) => ({ ...prev, in_stock: val === "true" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">{t("inStock", { default: "In Stock" })}</SelectItem>
                      <SelectItem value="false">{t("outOfStock", { default: "Out of Stock" })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">{t("description", { default: "Description" })}</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description || ""}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>{t("categories", { default: "Categories" })}</Label>
                <Select
                  value={""}
                  onValueChange={(val) => {
                    const id = Number(val);
                    if (!selectedCategoryIds.includes(id)) {
                      setSelectedCategoryIds((prev) => [...prev, id]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCategory", { default: "Select Category" })} />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat.id} value={`${cat.id}`}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Show selected categories with remove option */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCategoryIds.map((catId) => {
                    const category = allCategories.find((c) => c.id === catId);
                    if (!category) return null;
                    return (
                      <span
                        key={catId}
                        className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full cursor-pointer"
                        onClick={async () => {
                          try {
                            await removeProductCategory(product.id, String(catId));
                            setSelectedCategoryIds((prev) => prev.filter((id) => id !== catId));
                          } catch {
                            toast.error(t("errorRemovingCategory", { default: "Failed to remove category." }));

                          }
                        }}

                      >
                        {category.name} &times;
                      </span>
                    );
                  })}
                </div>
              </div>


              {/* Attributes */}
              {attributeItems.length > 0 && (
                <div className="space-y-4">
                  <Label>{t("attributes", { default: "Attributes" })}</Label>
                  {Object.entries(groupedAttributes).map(([attributeName, items]) => (
                    <div key={attributeName} className="border p-4 rounded-md space-y-2">
                      <h4 className="font-semibold">{attributeName}</h4>
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                          <span>{item.name}</span>
                          <Select
                            value={String(item.in_stock)}
                            onValueChange={(val) =>
                              setAttributeItems((prev) =>
                                prev.map((ai) =>
                                  ai.id === item.id ? { ...ai, in_stock: val === "true" } : ai
                                )
                              )
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">{t("inStock", { default: "In Stock" })}</SelectItem>
                              <SelectItem value="false">{t("outOfStock", { default: "Out of Stock" })}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Variants */}
              {variants.length > 0 && (
                <div className="space-y-6">
                  <Label className="text-base font-semibold">{t("variants", { default: "Variants" })}</Label>

                  {variants.map((variant, idx) => (
                    <div key={idx} className="rounded-lg border bg-muted/30 p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-muted-foreground">
                          {t("variantNumber", { number: idx + 1 })}
                        </h4>
                      </div>

                      <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {variant.attributes.map((attr, attrIdx) => (
                          <li key={attrIdx}>
                            <span className="font-medium">{attr.attribute}:</span> {attr.attribute_item}
                          </li>
                        ))}
                      </ul>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* Price Modifier */}
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">
                            {t("priceModifier", { default: "Price Modifier" })}
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={variant.price_modifier ?? 0}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value);
                              setVariants((prev) =>
                                prev.map((v, i) =>
                                  i === idx ? { ...v, price_modifier: newPrice } : v
                                )
                              );
                            }}
                            className="h-9"
                          />
                        </div>

                        {/* Stock Select */}
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">
                            {t("stock", { default: "Stock" })}
                          </Label>
                          <Select
                            value={String(variant.in_stock)}
                            onValueChange={(val) => {
                              setVariants((prev) =>
                                prev.map((v, i) =>
                                  i === idx ? { ...v, in_stock: val === "true" } : v
                                )
                              );
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">{t("inStock", { default: "In Stock" })}</SelectItem>
                              <SelectItem value="false">{t("outOfStock", { default: "Out of Stock" })}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}



              {/* Main Image */}
              <div className="space-y-2">
                <Label>{t("mainImage", { default: "Main Image" })}</Label>
                {formData.main_image && (
                  <div className="flex justify-center">
                    <div className="w-64 h-64 overflow-hidden rounded-lg border shadow-sm">
                      <img src={cdn(formData.main_image)} alt="Main" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
                <SingleImageUploader
                  imageUrl={formData.main_image || ""}
                  setImageUrl={(url) => setFormData((prev) => ({ ...prev, main_image: url }))}
                />
              </div>
            </TabsContent>

            {/* Images tab */}
            <TabsContent value="images">
              <ImagesUploader
                images={newImages}
                setImages={setNewImages}
                productId={product.id}
                maxImages={10 - dbImages.length}
              />
              {!loadingImages && (
                <div className="space-y-2">
                  <Label>{t("currentImages", { default: "Gallery Images" })}</Label>
                  {dbImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {dbImages.map((url, idx) => (
                        <div key={idx} className="relative aspect-square overflow-hidden rounded-lg border shadow-sm group">
                          <img src={cdn(url)} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(url)}
                            className="absolute top-1 right-1 p-1 text-red-600 bg-white/80 rounded-full shadow hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title={t("delete", { default: "Delete" })}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="italic text-sm text-gray-500">{t("noImages", { default: "No images uploaded." })}</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button variant="outline" type="button" onClick={onClose}>
              {t("cancel", { default: "Cancel" })}
            </Button>
            <Button type="submit">{t("save", { default: "Save" })}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProductModal;
