import { fetchVariants, fetchProduct } from "@/app/lib/productService";

export async function isQuantityAvailable(
    productId: number,
    selected: Record<string, string>,
    quantity: number,
): Promise<boolean> {
    console.log("productId : ", productId)



    const variants = await fetchVariants(String(productId));
    console.log("variants are : ", variants)
    console.log("selected", selected)
    if (Object.keys(selected).length === 0) {
        console.log("No attributes selected, checking product quantity");
        const product = await fetchProduct(String(productId));
        if ((product?.quantity ?? 0) < quantity) {
            return false
        }
        else {
            return true
        }
    }


    else {
        const match = variants.find(
            (variant) =>
                variant.attributes.every(
                    (attr) => selected[attr.attribute] === attr.attribute_item
                )
        );

        if (!match) return false;
        return match.quantity >= quantity;

    }

}



import { supabase } from "@/app/lib/constants";

export async function decrementQuantityAfterOrder(
    productId: number,
    selected: Record<string, string>,
    quantity: number
) {
    const product = await fetchProduct(String(productId));
    // const variants = await fetchVariants(String(productId));

    // 1. If NO attributes selected → update only product.quantity
    if (Object.keys(selected).length === 0) {
        const newQty = (product?.quantity ?? 0) - quantity;

        await supabase
            .from("products")
            .update({ quantity: newQty })
            .eq("id", productId);

        return;
    }

    //2. If attributes selected → update product and matching variant
    await decrementVariantQuantity(productId, selected, quantity)
}


/**
 * Decrease quantity after placing an order.
 * @param productId - ID of the product
 * @param selected - Selected attribute values, e.g., { color: 'red', size: 'L' }
 * @param quantity - Quantity to decrease
 */
export async function decrementVariantQuantity(
    productId: number,
    selected: Record<string, string>,
    quantity: number
): Promise<{ success: boolean; variantId?: number }> {
    const variants = await fetchVariants(String(productId));
    console.log("variants are:", variants);
    console.log("selected:", selected);

    if (Object.keys(selected).length === 0) {
        console.log("❗ No attributes selected. Cannot update variant quantity.");
        return { success: false };
    }

    // Find matching variant
    const matchedVariant = variants.find((variant: any) =>
        variant.attributes.every(
            (attr: any) =>
                selected[attr.attribute] === attr.attribute_item
        )
    );

    if (!matchedVariant) {
        console.warn("❌ No matching variant found.");
        return { success: false };
    }

    const newQuantity = matchedVariant.quantity - quantity;
    if (newQuantity < 0) {
        console.warn("⚠️ Quantity would go negative. Aborting.");
        return { success: false };
    }

    // Perform update
    const { error } = await supabase
        .from("product_variants")
        .update({ quantity: newQuantity })
        .eq("id", matchedVariant.id);

    if (error) {
        console.error("❌ Failed to update variant quantity:", error.message);
        return { success: false };
    }

    console.log(`✅ Updated variant ${matchedVariant.id} to quantity ${newQuantity}`);
    return { success: true, variantId: matchedVariant.id };
}


/**
 * Restore quantity after cancelling an order.
 * @param productId - ID of the product
 * @param selected - Selected attribute values, e.g., { color: 'red', size: 'L' }
 * @param quantity - Quantity to restore
 */
export async function incrementQuantityAfterCancellation(
    productId: number,
    selected: Record<string, string>,
    quantity: number
) {
    const product = await fetchProduct(String(productId));

    // 1. If NO attributes selected → update only product.quantity
    if (Object.keys(selected).length === 0) {
        const newQty = (product?.quantity ?? 0) + quantity;

        await supabase
            .from("products")
            .update({ quantity: newQty })
            .eq("id", productId);

        console.log(`✅ Restored product ${productId} quantity to ${newQty}`);
        return;
    }

    // 2. If attributes selected → update matching variant
    const variants = await fetchVariants(String(productId));

    const matchedVariant = variants.find((variant: any) =>
        variant.attributes.every(
            (attr: any) =>
                selected[attr.attribute] === attr.attribute_item
        )
    );

    if (!matchedVariant) {
        console.warn("❌ No matching variant found for restoration.");
        return;
    }

    const newQuantity = matchedVariant.quantity + quantity;

    const { error } = await supabase
        .from("product_variants")
        .update({ quantity: newQuantity })
        .eq("id", matchedVariant.id);

    if (error) {
        console.error("❌ Failed to restore variant quantity:", error.message);
        return;
    }

    console.log(`✅ Restored variant ${matchedVariant.id} to quantity ${newQuantity}`);
}