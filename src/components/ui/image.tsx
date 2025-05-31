"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  onLoadingComplete?: () => void;
  onLoadingError?: (error: Error) => void;
}

/**
 * Enhanced Image component with built-in error handling and fallback
 */
export function Image({
  src,
  alt,
  className,
  fallbackSrc = "/placeholder-image.svg",
  onLoadingComplete,
  onLoadingError,
  ...props
}: ImageProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Reset state when src changes
  useEffect(() => {
    setImgSrc(src);
    setIsLoading(true);
    setError(null);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoadingComplete?.();
  };

  const handleError = () => {
    console.error(`Failed to load image: ${src}`);
    setIsLoading(false);

    const error = new Error(`Failed to load image: ${src}`);
    setError(error);
    setImgSrc(fallbackSrc);

    onLoadingError?.(error);
  };

  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <img
        src={imgSrc}
        alt={alt || "Image"}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />

      {error && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-500 bg-opacity-70 text-white text-xs p-1">
          Failed to load
        </div>
      )}
    </div>
  );
}
