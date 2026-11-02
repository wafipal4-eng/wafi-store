'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TestPage() {
  const [status, setStatus] = useState('Creating user...');

  useEffect(() => {
    const signUp = async () => {
      const { data, error } = await supabase.auth.signUp({
        email: 'Mom-ps@hotmail.com',
        password: 'Mom-ps@1234',
      });

      if (error) {
        setStatus(`❌ Error: ${error.message}`);
      } else {
        setStatus(`✅ User created: ${data.user?.email}`);
      }
    };

    signUp();
  }, []);

  return (
    <div className="p-4">
      <p>{status}</p>
    </div>
  );
}
