import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const store_id = 20;

const sampleProducts = [
  {
    name: 'ساعة فاخرة كلاسيكية',
    description: 'ساعة أنيقة بتصميم كلاسيكي فاخر، مناسبة للمناسبات الرسمية',
    price: 299,
    new_price: 249,
    quantity: 10,
    main_image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    in_stock: true,
    store_id: store_id,
    is_deleted: false,
  },
  {
    name: 'حقيبة جلدية أنيقة',
    description: 'حقيبة يد جلدية عالية الجودة بتصميم عصري',
    price: 189,
    new_price: 159,
    quantity: 15,
    main_image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    in_stock: true,
    store_id: store_id,
    is_deleted: false,
  },
  {
    name: 'نظارة شمسية فاخرة',
    description: 'نظارة شمسية بإطار معدني وعدسات عالية الجودة',
    price: 149,
    new_price: 129,
    quantity: 20,
    main_image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
    in_stock: true,
    store_id: store_id,
    is_deleted: false,
  },
  {
    name: 'محفظة جلدية',
    description: 'محفظة جلدية أنيقة بتصميم بسيط وعملي',
    price: 79,
    new_price: 69,
    quantity: 25,
    main_image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
    in_stock: true,
    store_id: store_id,
    is_deleted: false,
  },
  {
    name: 'سوار ذهبي',
    description: 'سوار ذهبي أنيق مناسب للإهداء',
    price: 129,
    new_price: 99,
    quantity: 12,
    main_image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400',
    in_stock: true,
    store_id: store_id,
    is_deleted: false,
  },
  {
    name: 'عطر فاخر',
    description: 'عطر فاخر برائحة مميزة تدوم طويلاً',
    price: 199,
    new_price: 179,
    quantity: 8,
    main_image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
    in_stock: true,
    store_id: store_id,
    is_deleted: false,
  },
];

export async function POST() {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data?.length || 0 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to seed products' }, { status: 500 });
  }
}
