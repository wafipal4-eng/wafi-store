"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
// UI components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { cartesianProduct } from "@/app/lib/utils";

// Custom components
import SingleImageUploader from "@/components/custom/main_image_uploader";
import ImagesUploader from "@/components/custom/images-uploader";
import StockStatusSelect from "@/app/components/add-product/StockStatusSelect";
import VariantImageList from "@/app/components/dashboard-components/variant-image-list";
import { deleteProductAttributeData, saveProductVariants, saveProductCategories, updateProduct, fetchAllCategories, deleteProductVariants } from "@/app/lib/productService";

// Services
import {
    deleteProductImage,
    fetchProductImagesForDelete,
    fetchProduct,
    fetchVariants,
    fetchProductCategories,
    saveProductAttributeItems,
    fetchAttributesByIds,
    removeProductCategory
} from "@/app/lib/productService";
import { toast } from "sonner";
import type { Attribute, AttributeItem } from "@/app/lib/productInterface";
import { SUPPORTED_LANGUAGES } from "@/app/lib/constants";
import { cdn } from "@/lib/cdn";


type AttributeType = {
    id: number | string;
    name: string;
    values: AttributeItem[];

};


// -------------------------------------------------------------------------------------------------
// Component
// -------------------------------------------------------------------------------------------------

export default function AddProductPage() {
    // ----------------------------- Locale & i18n --------------------------------
    const t = useTranslations("AddProduct");
    const { id } = useParams<{ id: string }>();

    // ----------------------------- State ----------------------------------------
    // Product form state
    const [loadedVariants, setLoadedVariants] = useState<any[]>([]);
    const [productId, setProductId] = useState<string | number | null>(null);
    const [currency, setCurrency] = useState("ILS");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [showImageError, setShowImageError] = useState(false);
    const [dbImages, setDbImages] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [loadingImages, setLoadingImages] = useState(true);
    const router = useRouter();
    const [name, setName] = useState("");
    const [secondaryName, setSecondaryName] = useState("");
    const [price, setPrice] = useState<number | string>("");
    const [newPrice, setNewPrice] = useState<number | string>("");
    const [quantity, setQuantity] = useState<number | string>("");

    const [description, setDescription] = useState("");
    const [secondaryDescription, setSecondaryDescription] = useState("");

    // Category selection
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [allCategories, setAllCategories] = useState<any[]>([]);

    // Attribute/Variant management
    const [attributeItems, setAttributeItems] = useState<AttributeItem[]>([]);

    // Form control
    const [tab, setTab] = useState("basic");
    const [newAttrName, setNewAttrName] = useState("");
    const [submitting, setSubmitting] = useState(false);


    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [variantCombinations, setVariantCombinations] = useState<VariantCombinationType[]>([]);


    // Step mapping
    const steps: Record<string, number> = {
        basic: 1,
        media: 2,
        variants: 3,
        success: 4
    };
    const currentStep = steps[tab] || 1;

    type VariantCombinationType = {
        [key: string]: string | number | boolean;
        in_stock: boolean;
        price_modifier: number;
        v_quantity: number;
    };






    // useEffect(() => {

    //     console.log("🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀");
    //     console.log("🔀 Variant combinations changed::", variantCombinations);
    //     console.log("🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀🔀");

    // }, [variantCombinations]);


    useEffect(() => {
        if (!attributes.length || !attributeItems.length) {
            setVariantCombinations([]);
            return;
        }

        // Step 1: Group attribute items by attribute name
        const grouped: Record<string, string[]> = attributes.reduce((acc, attr) => {
            const items = attributeItems
                .filter(item => item.attribute_id === attr.id)
                .map(item => item.name.trim());

            if (items.length > 0) acc[attr.name.trim()] = items;

            return acc;
        }, {} as Record<string, string[]>);

        // Step 2: Generate cartesian product
        const combos = cartesianProduct(grouped);

        // Step 3: Map to full variant objects with defaults
        const fullVariants = combos.map(combo => ({
            ...combo,
            in_stock: true,
            price_modifier: 0,
            v_quantity: 0
        }));

        setVariantCombinations(fullVariants);

        // console.log("🔀 Generated variant combinations:", fullVariants);
    }, [attributes, attributeItems]);


    // ----------------------------- Testing --------------------------------------








    // ----------------------------- Effects --------------------------------------
    // Fetch categories on mount
    useEffect(() => {
        if (!attributes.length || !attributeItems.length) {
            setVariantCombinations([]);
            return;
        }

        const grouped: Record<string, string[]> = attributes.reduce((acc, attr) => {
            const items = attributeItems
                .filter((item) => item.attribute_id === attr.id)
                .map((item) => item.name.trim());

            if (items.length > 0) acc[attr.name.trim()] = items;

            return acc;
        }, {} as Record<string, string[]>);

        // console.log("📊 Grouped for cartesian:", grouped);

        const combos = cartesianProduct(grouped);
        // console.log("🧪 Cartesian product combos:", combos);

        // Get saved variants from backend (must be already loaded via fetchVariants)
        const fullVariants = combos.map((combo) => {
            const match = loadedVariants.find((v) => {
                return Object.entries(combo).every(([key, value]) => {
                    return v.attributes?.some(
                        (a: any) => a.attribute === key && a.attribute_item === value
                    );
                });
            });

            return {
                ...combo,
                in_stock: match?.in_stock ?? true,
                price_modifier: match?.price_modifier ?? 0,
                v_quantity: match?.quantity ?? 0,
                image_path: match?.image_path ?? null,
            };
        });
        // console.log("fullVariants:", fullVariants)
        setVariantCombinations(fullVariants);
        // console.log("🔀 Final matched variant combinations:", fullVariants);
    }, [attributes, attributeItems, loadedVariants]);




    useEffect(() => {
        const loadData = async () => {
            if (!productId) return;

            const categoryResponse = await fetchProductCategories([productId]);
            const productCategoryIds = categoryResponse.map((cat) => Number(cat.id));
            const fetchedAllCategories = await fetchAllCategories();
            
            setSelectedCategoryIds(productCategoryIds);
            setAllCategories(fetchedAllCategories);
        };

        loadData();
    }, [productId]);

    useEffect(() => {
        const loadData = async () => {
            if (!productId) return;
            const [images] = await Promise.all([
                fetchProductImagesForDelete(String(productId)),
            ]);


            setDbImages(images);
            setLoadingImages(false);
        };

        loadData();
    }, [productId]);

    // Load product details
    useEffect(() => {
        if (!id) return;

        const loadProductData = async () => {
            const product = await fetchProduct(String(id));
            if (!product) return;

            setProductId(product.id);
            setName(product.name || "");
            setSecondaryName(product.secondary_name || "");
            setPrice(product.price ?? 0);
            setNewPrice(product.new_price ?? 0);
            setDescription(product.description || "");
            setSecondaryDescription(product.secondary_description || "");
            setQuantity(product.quantity ?? 0);
            setImageUrl(product.main_image || null);

            const productCategories = await fetchProductCategories([product.id]);
            setSelectedCategoryIds(productCategories.map((c) => Number(c.id)));
        };

        loadProductData();
    }, [id]);


    // Load product variants (attributes + combinations)
    useEffect(() => {
        if (!productId) return;

        const loadVariants = async () => {
            const loaded = await fetchVariants(String(productId));
            // console.log("loaded variants:", loaded)
            setLoadedVariants(loaded);

            const attrMap: Record<string, AttributeType> = {};
            const items: AttributeItem[] = [];

            for (const variant of loaded) {
                for (const { attribute_id, attribute, attribute_item } of variant.attributes) {
                    if (!attribute || !attribute_item) continue;

                    if (!attrMap[attribute]) {
                        attrMap[attribute] = {
                            id: attribute_id ?? Date.now() + Math.random(), // use real id if available
                            name: attribute,
                            values: [],
                        };
                    }


                    const exists = attrMap[attribute].values.some(v => v.name === attribute_item);
                    if (!exists) {
                        const item: AttributeItem = {
                            id: crypto.randomUUID(),
                            attribute_id: Number(attrMap[attribute].id),
                            name: attribute_item,
                            price: 0,
                            in_stock: true,
                            v_quantity: 0,
                        };
                        attrMap[attribute].values.push(item);
                        items.push(item);
                    }
                }
            }

            setAttributes(
                Object.values(attrMap).map(attr => ({
                    ...attr,
                    id: typeof attr.id === "string" ? Date.now() + Math.random() : attr.id,
                }))
            );

            setAttributeItems(items);

            const combos = loaded.map(v => {
                const combo: VariantCombinationType = {
                    in_stock: !!v.in_stock,
                    price_modifier: Number(v.price_modifier ?? 0),
                    v_quantity: Number(v.quantity ?? 0),

                };

                v.attributes.forEach(({ attribute, attribute_item }) => {
                    combo[attribute] = attribute_item;
                });

                return combo;
            });

            setVariantCombinations(combos);
        };

        loadVariants();
    }, [productId]);


    // Prevent form submission on Enter, except in <textarea>
    const preventEnterSubmit = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.preventDefault();
        }
    };



    const handleRemoveImage = async (signedUrl: string) => {
        const confirmed = confirm(t("confirmDeleteImage", { default: "Delete this image?" }));
        if (!confirmed) return;

        try {


            const success = await deleteProductImage(signedUrl);

            if (success) {
                setDbImages((prev) => prev.filter((img) => img !== signedUrl));
            }
        } catch (err) {
            console.error("❌ Invalid signed URL:", err);
        }
    };


    // Add new attribute if it doesn't exist
    const handleAddAttribute = () => {
        const trimmed = newAttrName.trim();
        if (!trimmed || attributes.some(a => a.name === trimmed)) return;

        const newId = Date.now() + Math.random();

        setAttributes((prev) => [
            ...prev,
            {
                id: newId,
                name: trimmed,
                values: [],
            },
        ]);


        setNewAttrName("");
    };

    const handleAddAttributeItem = (attribute_id: number) => {
        setAttributeItems(prev => [
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

    const updateAttributeItem = (index: number, changes: Partial<AttributeItem>) => {
        setAttributeItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...changes };
            return updated;
        });
    };

    const updateVariantCombination = (index: number, updatedFields: Partial<VariantCombinationType>) => {
        const cleaned = Object.fromEntries(
            Object.entries(updatedFields).filter(([, v]) => v !== undefined)
        ) as Record<string, string | number | boolean>;

        setVariantCombinations(prev => {
            // console.log("🧩 Previous variants:", prev);
            // console.log("🧩 Updating index:", index);
            // console.log("🧩 New values (cleaned):", cleaned);

            const updated = prev.map((v, i) => {
                if (i === index) {
                    const merged = { ...v, ...cleaned };
                    // console.log(`✅ Variant updated at index ${i}:`, merged);
                    return merged;
                }
                return v;
            });

            // console.log("🧩 Final updated variants:", updated);
            return updated;
        });

    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!imageUrl && tab === "basic") {
            setShowImageError(true);
            return;
        }

        if (tab === "basic") {
            setSubmitting(true);
            const parsedPrice = parseFloat(price as string);
            const parsedNewPrice = parseFloat(newPrice as string) || 0;

            await updateProduct({
                id: String(productId),
                name,
                secondary_name: secondaryName || undefined,
                description: description,
                secondary_description: secondaryDescription || undefined,
                price: parsedPrice,
                new_price: parsedNewPrice,
                main_image: imageUrl,
                quantity: Number(quantity),
                in_stock: true,
            });

            await saveProductCategories(String(productId), selectedCategoryIds);

            await saveAttributesAndVariants(String(productId));


            setSubmitting(false);
            setTab("media");
        }

        else if (tab === "media") {
            setTab("variants");
        }

        else if (tab === "variants") {
            // await saveAttributesAndVariants(String(productId)); // variants now exist
            setTab("success");
        }
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


    useEffect(() => {

        // console.log("look here man :", variantCombinations)
        const combinations = generateVariantCombinations(attributes, variantCombinations);

        setVariantCombinations(combinations);
    }, [attributes]);


    function generateVariantCombinations(
        attributes: Attribute[],
        existingVariants: any[] = []
    ): any[] {
        // 🍊 Step 1: Build attrMap
        const attrMap: Record<string, string[]> = {};

        (attributes as any[]).forEach((attr) => {
            attrMap[attr.name] = attr.values.map((v: any) => v.name);
        });

        const combos = cartesianProduct(attrMap);

        const fullVariants = combos.map((combo, index) => {
            const match = existingVariants.find((variant, i) => {
                const isMatch = Object.entries(combo).every(
                    ([key, val]) => variant[key] === val
                );

                return isMatch;
            });

            const result = {
                ...combo,
                in_stock: match?.in_stock ?? true,
                price_modifier: match?.price_modifier ?? 0,
                v_quantity: match?.v_quantity ?? 0,
                image_path: match?.image_path ?? null,
            };

            return result;
        });

        return fullVariants;
    }




    /** Persist attribute items first, then build and persist variants. */
    const saveAttributesAndVariants = async (product_id: string) => {
        // console.log("🚮 Deleting old attribute and variant data...");
        await deleteProductAttributeData(product_id);
        await deleteProductVariants(Number(product_id));
        // console.log("✅ Old data deleted.");

        // Save attribute items and receive DB‑inserted rows
        // console.log("📥 Saving attribute items...");
        const inserted = await saveProductAttributeItems(product_id, attributes, attributeItems);
        // console.log("✅ Attribute items inserted:", inserted);

        // Map attribute names → ids
        const attributeIds = [...new Set(inserted.map((i) => i.attribute_id))];
        // console.log("📌 Attribute IDs found:", attributeIds);

        const attributeRecords = await fetchAttributesByIds(attributeIds);
        // console.log("📖 Full attribute records:", attributeRecords);

        const attrIdMap = Object.fromEntries(
            attributeRecords.map((attr) => [attr.name.trim().toLowerCase(), attr.id])
        );
        // console.log("🗺️ Attribute name → ID map:", attrIdMap);

        // Build variants payload
        const variantsToSave = variantCombinations.map((variant, idx) => {
            const attribute_items = Object.entries(variant)
                .filter(([k]) => k !== "in_stock" && k !== "price_modifier" && k !== "v_quantity")
                .map(([attributeName, value]) => {
                    const matchedAttr = Object.entries(attrIdMap).find(
                        ([name]) => name.trim().toLowerCase() === attributeName.trim().toLowerCase()
                    );

                    const attribute_id = matchedAttr?.[1];

                    if (!attribute_id) {
                        // console.warn(`❌ [${idx}] Attribute ID not found for:`, attributeName);
                        return null;
                    }

                    const foundItem = inserted.find((item) =>
                        item.attribute_id === attribute_id &&
                        item.name.trim().toLowerCase() === (value as string).trim().toLowerCase()
                    );


                    if (!foundItem) {
                        // console.warn(`❌ [${idx}] Attribute item not found for:`, {
                        //     attribute_id,
                        //     attributeName,
                        //     value,
                        // });
                        return null;
                    }

                    // console.log(`✅ [${idx}] Mapped:`, {
                    //     attribute_id,
                    //     attribute_item_id: foundItem.id,
                    //     attributeName,
                    //     value,
                    // });

                    return {
                        attribute_id,
                        attribute_item_id: foundItem.id,
                    };
                })
                .filter(Boolean) as { attribute_id: number; attribute_item_id: number }[];

            return {
                product_id,
                in_stock: variant.in_stock,
                price_modifier: variant.price_modifier,
                attribute_items,
                v_quantity: Number(variant.v_quantity ?? 0),
            };
        });

        // console.log("📤 Saving final variants:", variantsToSave);
        await saveProductVariants(variantsToSave);
        // console.log("✅ Variants saved successfully.");
    };


    // -------------------------------------------------------------------------------------------------
    // Render Helpers
    // -------------------------------------------------------------------------------------------------


    return (
        <>
            {(
                <div className="container max-w-4xl py-10 mt-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl font-semibold">
                                {productId ? t("edit_title") : t("title")}
                            </CardTitle>
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
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    required
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                />
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
                                                        value={secondaryName}
                                                        onChange={(e) => setSecondaryName(e.target.value)}
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
                                                    <Input
                                                        id="price"
                                                        name="price"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={price}
                                                        onChange={(e) => setPrice(e.target.value)}
                                                    />
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
                                                    value={newPrice}
                                                    onChange={(e) => setNewPrice(e.target.value)}
                                                />

                                            </div>
                                            <div>
                                                <Label htmlFor="quantity">{t("quantity")}</Label>
                                                <Input
                                                    id="quantity"
                                                    name="quantity"
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    className="w-full"
                                                    placeholder={t("quantity")}
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(e.target.value)}
                                                />
                                            </div>
                                        </div>
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
                                            <Textarea
                                                id="description"
                                                name="description"
                                                rows={4}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            />
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
                                                    value={secondaryDescription}
                                                    onChange={(e) => setSecondaryDescription(e.target.value)}
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
                                                    {allCategories.map((cat) => {
                                                        const parent = cat.parent_id ? allCategories.find(c => String(c.id) === String(cat.parent_id)) : null;
                                                        return (
                                                            <SelectItem key={cat.id} value={`${cat.id}`}>
                                                                {parent ? `${parent.name} › ` : ''}{cat.name}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>

                                            {/* Show selected categories with remove option */}
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedCategoryIds.map((catId) => {
                                                    const category = allCategories.find((c) => Number(c.id) === Number(catId));
                                                    if (!category) return null;
                                                    return (
                                                        <span
                                                            key={catId}
                                                            className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full cursor-pointer"
                                                            onClick={async () => {
                                                                try {
                                                                    await removeProductCategory(String(productId), String(catId));
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

                                    </TabsContent>

                                    {/* Media Tab */}
                                    <TabsContent value="media" className="space-y-4 pt-6">
                                        <Label>{t("images")}</Label>
                                        <ImagesUploader
                                            images={newImages}
                                            setImages={setNewImages}
                                            productId={String(productId)}
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
                                                                    className="absolute top-1 right-1 p-1 px-2 text-red-600  rounded-full shadow bg-white group-opacity-100 transition-opacity cursor-pointer"
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


                                    <TabsContent value="variants" className="space-y-4 pt-6">
                                        <Label>{t("variants")}</Label>
                                        <VariantImageList productId={productId || 0} />
                                    </TabsContent>




                                    {/* Success Tab */}
                                    <TabsContent value="success" className="text-center pt-6 space-y-4">
                                        <h2 className="text-2xl font-bold text-green-600">{t("successMessage2")}</h2>
                                        {/* <p className="text-gray-600">{t("productCreatedSuccess")}</p> */}
                                        <Button
                                            className="cursor-pointer mb-10"
                                            onClick={() => router.push("/dashboard/admin-products")}
                                        >
                                            {t("goToProductsTable")}
                                        </Button>
                                    </TabsContent>
                                </Tabs>

                                {/* Actions */}
                                {currentStep !== 3 && (
                                    <div className="flex justify-end gap-2 pt-6">
                                        <Button type="button" variant="outline">
                                            {t("cancel")}
                                        </Button>
                                        <Button type="submit" disabled={submitting} className="cursor-pointer">
                                            {submitting
                                                ? t("saving")
                                                : currentStep === 1
                                                    ? t("next")
                                                    : currentStep === 2
                                                        ? t("next")
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