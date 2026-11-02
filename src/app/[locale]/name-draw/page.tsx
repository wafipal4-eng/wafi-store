import type { Metadata } from 'next';
import NameDraw from './name-draw';

export const metadata: Metadata = {
  title: 'سحب الأسماء',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NameDrawPage() {
  return <NameDraw />;
}
