'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { store_id, supabase } from '@/app/lib/constants';

type Props = {
  children: React.ReactNode;
};

export function SubscriptionGuard({ children }: Props) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      const { data: store, error } = await supabase
        .from('store')
        .select('due')
        .eq('id', store_id)
        .single();

      if (error) {
        console.error('❌ Database error checking subscription:', error.message);
        setIsAllowed(true); // Allow access on DB error to prevent site lockout
        return;
      }

      // If no due date is set in DB, assume it's an unlimited or trial store
      if (!store?.due) {
        setIsAllowed(true);
        return;
      }

      const due = new Date(store.due);
      const now = new Date();

      if (due < now) {
        router.replace('/SubscriptionEnded');
      } else {
        setIsAllowed(true);
      }
    };

    checkSubscription();
  }, [router]);

  if (isAllowed === null) return null; // or a loading spinner

  return <>{children}</>;
}
