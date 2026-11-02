'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  image1_section2,
  image2_section2,
  image3_section2,
  image4_section2,
  section2_text,
} from '@/app/lib/constants';


const images = [image1_section2, image2_section2, image3_section2, image4_section2];
const categories = ['91', '90', '92','93'];

const Section2: React.FC = () => {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const text = section2_text[isRTL ? 'ar' : 'en'];
  const sectionTitles = [
    'אמבטיה וניקיון',   // BATHROOM
    'עיצוב הבית',     // DECORATION
    'אחסון וארגון',   // STORAGE
    'מטבח ואוכל'      // KITCHEN
  ];
  
  
  return (
    <section className="my-12 px-4">
      <div className="max-w-screen-lg mx-auto">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {text.title}
          </h2>
          <p className="mt-2 text-gray-600 text-sm md:text-base">
            {text.subtitle}
          </p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 justify-items-center">
          {images.map((src, index) => (
            <Link
              key={index}
              href={{
                pathname: '/Products',
                query: { category: categories[index] || 'all' },
              }}
              className="relative w-full h-64 md:h-80 max-w-sm overflow-hidden rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer group"
            >
              <Image
                src={src}
                alt={`section2-image-${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-4 w-full text-center">
                <p className="text-white text-lg md:text-xl font-bold drop-shadow-md tracking-wider">
                  {sectionTitles[index] ?? 'UNKNOWN CATEGORY'}
                </p>
              </div>
            </Link>
          ))}

        </div>
      </div>
    </section>

  );
};

export default Section2;
