"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { encodeStorageUrl, isStorageUrl } from "@/lib/utils/storage-url";
import { Image } from "./image";

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  onLoadingComplete?: () => void;
  onLoadingError?: (error: Error) => void;
}

/**
 * Enhanced Image component specifically for Supabase storage images
 * Automatically encodes the URL and adds cache-busting
 */
export function StorageImage({
  src,
  alt,
  className,
  fallbackSrc = "/placeholder-image.svg",
  onLoadingComplete,
  onLoadingError,
  ...props
}: StorageImageProps) {
  const [encodedSrc, setEncodedSrc] = useState<string | undefined>(src);

  // Process the URL when src changes
  useEffect(() => {
    if (!src) {
      setEncodedSrc(fallbackSrc);
      return;
    }

    // Only encode if it's a storage URL
    if (isStorageUrl(src)) {
      try {
        const encoded = encodeStorageUrl(src);
        setEncodedSrc(encoded);
        console.log('Encoded storage URL:', encoded);
      } catch (error) {
        console.error('Error encoding storage URL:', error);
        setEncodedSrc(src);
      }
    } else {
      setEncodedSrc(src);
    }
  }, [src, fallbackSrc]);

  return (
    <Image
      src={encodedSrc}
      alt={alt}
      className={className}
      fallbackSrc={fallbackSrc}
      onLoadingComplete={onLoadingComplete}
      onLoadingError={onLoadingError}
      {...props}
    />
  );
}
