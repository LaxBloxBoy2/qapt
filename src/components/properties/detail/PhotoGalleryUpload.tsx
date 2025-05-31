"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { StorageImage } from "@/components/ui/storage-image";
import { useToast } from "@/hooks/use-toast";
import { useGetPropertyPhotos, useUploadPropertyPhoto, useDeletePropertyPhoto } from "@/hooks/usePropertyPhotos";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PhotoGalleryUploadProps {
  propertyId: string;
}

export function PhotoGalleryUpload({ propertyId }: PhotoGalleryUploadProps) {
  const { data: photos, isLoading } = useGetPropertyPhotos(propertyId);
  const uploadPhoto = useUploadPropertyPhoto();
  const deletePhoto = useDeletePropertyPhoto();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log photos data for debugging
  React.useEffect(() => {
    if (photos && photos.length > 0) {
      console.log("Photos data:", photos);
    }
  }, [photos]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadPhoto.mutateAsync({
        propertyId,
        file: selectedFile
      });

      // Reset form
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Photo uploaded",
        description: "Your photo has been uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      await deletePhoto.mutateAsync(photoId);
      toast({
        title: "Photo deleted",
        description: "The photo has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-medium">Upload New Photo</h3>

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload">
              <Button type="button" variant="outline" className="w-full" asChild>
                <span>
                  <i className="ri-image-add-line mr-1" />
                  Select Image
                </span>
              </Button>
            </label>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadPhoto.isPending}
          >
            {uploadPhoto.isPending ? (
              <>
                <span className="mr-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </div>

        {/* Preview */}
        {preview && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Preview:</h4>
            <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Gallery */}
      <div>
        <h3 className="font-medium mb-4">Photo Gallery</h3>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : photos && photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group cursor-pointer">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden h-48">
                  <StorageImage
                    src={photo.url}
                    alt="Property photo"
                    className="w-full h-full"
                    onLoadingError={(error) => {
                      console.error('Error loading image:', error.message);
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-transparent group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <i className="ri-delete-bin-line text-lg" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this photo. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePhoto.mutate(photo.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          {deletePhoto.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No photos yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Upload your first property photo using the form above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
