export const variantMatchesSelection = (
    variant: any,
    selected: Record<string, string>,
    attrName?: string,
    candidateValue?: string
  ) => {
    return Object.entries(selected).every(([name, value]) => {
      const desired = name === attrName ? candidateValue : value;
  
      return variant.attributes.some((a: any) => {
        if (!a?.attribute || !a?.attribute_item) return false;
  
        return (
          a.attribute?.toLowerCase() === name?.toLowerCase() &&
          a.attribute_item?.toLowerCase() === desired?.toLowerCase()
        );
      });
    });
  };
  
  export const isDisabled = (
    attrName: string,
    value: string,
    selected: Record<string, string>,
    variants: any[]
  ) => {
    if (!variants?.length || Object.keys(selected).length === 0) return false;
  
    return !variants.some(
      (v) =>
        v.in_stock &&
        Array.isArray(v.attributes) &&
        variantMatchesSelection(v, selected, attrName, value)
    );
  };
  