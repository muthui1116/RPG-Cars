// app/products/[slug]/ProductGallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

export default function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  // Track which image index is currently shown as the "main" image.
  // Starts at 0, meaning the first image in the array.
  const [activeIndex, setActiveIndex] = useState(0);

  const galleryImages = images.length >= 4
    ? images.slice(0, 4)
    : [
        ...images,
        ...Array.from({ length: 4 - images.length }, (_, index) =>
          images[index % images.length] ?? images[0]
        ),
      ];

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
        <Image
          src={galleryImages[activeIndex] ?? galleryImages[0]}
          alt={productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnail row — always show at least four thumbnails */}
      {galleryImages.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {galleryImages.map((imageUrl, index) => (
            <button
              key={`${imageUrl}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                index === activeIndex
                  ? "border-gray-900"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={imageUrl}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}