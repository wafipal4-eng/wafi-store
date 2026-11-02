export const store_id = 20;
export const name = 'WAFI';

// ====================================
// SUPPORTED LANGUAGES CONFIGURATION
// ====================================
// Configure which languages your store supports
// primary: The main language (used for 'name' column in database)
// secondary: Languages that use 'secondary_name' column (with fallback to 'name')

export const SUPPORTED_LANGUAGES = {
  primary: 'ar',           // Primary language (Arabic) - uses 'name' column
  secondary: ['en'] as readonly string[], // Secondary languages - use 'secondary_name' with fallback
  all: ['ar', 'en'],       // All enabled languages
} as const;

// Helper to check if a locale uses secondary names
export const usesSecondaryName = (locale: string): boolean => {
  return SUPPORTED_LANGUAGES.secondary.includes(locale as any);
};

// Helper to check if a locale is primary
export const isPrimaryLocale = (locale: string): boolean => {
  return locale === SUPPORTED_LANGUAGES.primary;
};

// ====================================
// METADATA & SEO
// ====================================
export const store_name = "وافي - WAFI";
export const store_short_name = "وافي - WAFI";
export const store_description = "متجر وافي - حيث يكتمل اختيارك؛ جودة لا تنقص، وتنوع يوفي بكل احتياجاتك.";
// ====================================
// STORE STYLING & BRANDING
// ====================================
export const main_color = "#064a3c";

export const secondary_color = "#ffffff";
export const nis = "₪";

export const logo_path = "/logo.svg";

export const sidebarLogo = "/logo.svg"
export const heroMobileImage = "/nour99/IMG_5757.JPG";

export const heroImage2 = "/nour99/BG.png";
export const footerLogo = "/logo.svg"
export const navbarLogo = "/logo.svg"
export const favicon = "/logo.svg"

export const tiktok = ""
export const facebook = ""
export const instagram = ""
export const whatsapp = "https://wa.me/972592682212"

export const whatsappTwilio = "+972592682212"
export const admin_email = "wafipal4@gmail.com"


// export const snapchat = "https://www.snapchat.com/add/mirashop.ps?sender_web_id=16d2f97c-9c44-4973-a151-45db95448638&device_type=ios&is_copy_url=true"
export const maxProducts = 999;
export const phoneNumbers = [];


export const location_ar = [
  // "الخليل - باب الزاوية - عمارة نادي شباب الخليل",
  // "الخليل - مجمع الجذور - الطابق الثاني",
];
export const location_en = [
  // "Hebron - Bab Al-Zawyeh",
  // "Hebron - Al-Buthoor Complex",
];


// section2
export const image1_section2 = "/Bayti/bathroom.avif"
export const image2_section2 = "/Bayti/art2 copy.png"
export const image3_section2 = "/Bayti/storage.avif"
export const image4_section2 = "/Bayti/kitchen.webp"

export const section2_text = {
  ar: {
    title: "تسوقي حسب النمط",
    subtitle: "اكتشفي تشكيلتنا من العبايات المصممة بذوق",
  },
  en: {
    title: "Shop by Style",
    subtitle: "Discover our curated collection of modest elegance",
  },
  he: {
    title: "קני לפי סגנון",
    subtitle: "גלי את הקולקציה האלגנטית שלנו",
  },
};


export const hero_text = {
  ar: {
    title: "نور حجاب",
    description: "أنتِ ما بتشتري مجرد عباية، أنتِ بتشتري قطعة صُمّمت خصيصًا من أجلك 😌✔️",
    cta: "تسوقي الآن",
  },
  en: {
    title: "Nour Hijab",
    description: "You're not just buying an abaya – you're investing in a piece tailored just for you 😌✔️.",
    cta: "Shop Now",
  },
  he: {
    title: "נור חיג'אב",
    description: "את לא קונה רק עבאיה – את בוחרת ביצירה שנתפרה בדיוק בשבילך 😌✔️.",
    cta: "קנייה עכשיו",
  },
};


export const footer_text = {
  ar: {
    brand: "وافي.. جودة كاملة لكل ما تحتاجه",
    description:
      "متجر وافي يقدم لك تشكيلة متكاملة من المنتجات المختارة بعناية، حيث تلتقي وفرة الخيارات مع الجودة التي لا تساوم؛ لأنك تستحق التمام في كل شيء.",
    cta: "تصفح منتجاتنا",
    phone: phoneNumbers,
    locations: location_ar,
  },
  en: {
    brand: "Wafi: Quality in Every Choice",
    description:
      "Wafi Store offers a comprehensive range of carefully selected products, where variety meets uncompromising quality. Because you deserve perfection in every detail.",
    cta: "Shop Our Collection",
    phone: phoneNumbers,
    locations: location_en,
  },
  he: {
    brand: "Wafi: איכות מושלמת לכל מה שצריך",
    description:
      "חנות Wafi מציעה מגוון רחב של מוצרים שנבחרו בקפידה, שבה שפע האפשרויות פוגש איכות ללא פשרות. כי מגיע לך שלמות בכל דבר.",
    cta: "לכל הקולקציות שלנו",
    phone: phoneNumbers,
    locations: location_en,
  },
};

export const copyright_text = {
  ar: "جميع الحقوق محفوظة لدى متجر وافي",
  en: "All rights reserved to Wafi Store",
  he: "כל הזכויות שמורות לחנות Wafi",
};

export const marquee_text = {
  ar: "في متجر وافي، نؤمن أن الجودة هي الأصل. اكتشف منتجاتنا المختارة بعناية لتلبي كافة احتياجاتك بتمام الإتقان ووفرة الخيارات التي تثق بها. لأنك تستحق الأفضل دائماً.",
  en: "At Wafi Store, we believe quality is the foundation. Discover products crafted and selected to meet all your needs with perfection, variety, and reliability. Because you always deserve the best.",
};

import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
