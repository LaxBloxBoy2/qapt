"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMaintenanceMedia, useUploadMaintenanceMedia, useDeleteMaintenanceMedia } from "@/hooks/useMaintenance";

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  size: number;
  uploaded_at: string;
}

interface MaintenanceMediaSectionProps {
  requestId: string;
}

export function MaintenanceMediaSection({ requestId }: MaintenanceMediaSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  // Use real database hooks
  const { data: mediaFiles = [], isLoading } = useMaintenanceMedia(requestId);
  const uploadMedia = useUploadMaintenanceMedia();
  const deleteMedia = useDeleteMaintenanceMedia();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Validate file count (max 10 photos + 1 video)
    const currentImages = mediaFiles.filter(f => f.file_type?.startsWith('image/')).length;
    const currentVideos = mediaFiles.filter(f => f.file_type?.startsWith('video/')).length;

    const newFiles = Array.from(files);
    const newImages = newFiles.filter(f => f.type.startsWith('image/')).length;
    const newVideos = newFiles.filter(f => f.type.startsWith('video/')).length;

    if (currentImages + newImages > 10) {
      toast({
        title: "Too many images",
        description: "Maximum 10 photos allowed",
        variant: "destructive",
      });
      return;
    }

    if (currentVideos + newVideos > 1) {
      toast({
        title: "Too many videos",
        description: "Maximum 1 video allowed",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const file of newFiles) {
        // Validate file size (max 10MB for images, 50MB for videos)
        const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: `${file.name} is too large. Max size: ${file.type.startsWith('video/') ? '50MB' : '10MB'}`,
            variant: "destructive",
          });
          continue;
        }

        // Upload using the hook
        await uploadMedia.mutateAsync({
          requestId,
          file,
          name: file.name
        });
      }
    } catch (error) {
      // Error handling is done in the hook
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    const mediaFile = mediaFiles.find(f => f.id === mediaId);
    if (!mediaFile) return;

    try {
      await deleteMedia.mutateAsync({
        attachmentId: mediaId,
        filePath: mediaFile.file_url
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return 'ri-image-line';
      case 'video': return 'ri-video-line';
      case 'audio': return 'ri-mic-line';
      default: return 'ri-file-line';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Media</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {mediaFiles.filter(f => f.file_type?.startsWith('image/')).length}/10 Photos
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {mediaFiles.filter(f => f.file_type?.startsWith('video/')).length}/1 Video
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
            onClick={handleFileSelect}
          >
            <i className="ri-upload-cloud-line text-3xl text-muted-foreground mb-2 block" />
            <p className="text-sm text-muted-foreground mb-1">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              Max: 10 photos + 1 video (Images: 10MB, Videos: 50MB)
            </p>
            {uploadMedia.isPending && (
              <div className="mt-2">
                <Badge variant="secondary">Uploading...</Badge>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Media Grid */}
          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaFiles.map((file) => (
                <div key={file.id} className="relative group">
                  <div
                    className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedMedia(file)}
                  >
                    {file.file_type?.startsWith('image/') ? (
                      <img
                        src={file.file_url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className={`${getFileIcon(file.file_type || '')} text-4xl text-muted-foreground`} />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="mt-1 text-xs">
                    <p className="truncate font-medium">{file.name}</p>
                    <p className="text-muted-foreground">{formatFileSize(file.file_size || 0)}</p>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMedia(file.id);
                    }}
                  >
                    <i className="ri-close-line h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <i className="ri-loader-line text-4xl mb-2 block animate-spin" />
              <p className="text-sm">Loading media files...</p>
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <i className="ri-image-line text-4xl mb-2 block" />
              <p className="text-sm">No media files uploaded yet</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Media Preview Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedMedia?.name}</DialogTitle>
          </DialogHeader>
          {selectedMedia && (
            <div className="flex justify-center">
              {selectedMedia.file_type?.startsWith('image/') ? (
                <img
                  src={selectedMedia.file_url}
                  alt={selectedMedia.name}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : selectedMedia.file_type?.startsWith('video/') ? (
                <video
                  src={selectedMedia.file_url}
                  controls
                  className="max-w-full max-h-[70vh]"
                />
              ) : (
                <audio src={selectedMedia.file_url} controls className="w-full" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
