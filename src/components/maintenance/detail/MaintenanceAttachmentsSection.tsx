"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMaintenanceAttachments, useUploadMaintenanceAttachment, useDeleteMaintenanceAttachment } from "@/hooks/useMaintenance";

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: string;
}

interface MaintenanceAttachmentsSectionProps {
  requestId: string;
}

export function MaintenanceAttachmentsSection({ requestId }: MaintenanceAttachmentsSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use real database hooks
  const { data: attachments = [], isLoading } = useMaintenanceAttachments(requestId);
  const uploadAttachment = useUploadMaintenanceAttachment();
  const deleteAttachment = useDeleteMaintenanceAttachment();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (attachments.length + files.length > 10) {
      toast({
        title: "Too many files",
        description: "Maximum 10 attachments allowed",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const file of Array.from(files)) {
        // Validate file size (max 25MB)
        if (file.size > 25 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is too large. Max size: 25MB`,
            variant: "destructive",
          });
          continue;
        }

        // Upload file using the hook
        await uploadAttachment.mutateAsync({
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

  const handleDeleteAttachment = async (attachmentId: string) => {
    const attachment = attachments.find(a => a.id === attachmentId);
    if (!attachment) return;

    try {
      await deleteAttachment.mutateAsync({
        attachmentId,
        filePath: attachment.file_url
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
    if (type.includes('pdf')) return 'ri-file-pdf-line';
    if (type.includes('word')) return 'ri-file-word-line';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'ri-file-excel-line';
    if (type.includes('image')) return 'ri-image-line';
    if (type.includes('text')) return 'ri-file-text-line';
    return 'ri-file-line';
  };

  const handleDownload = (attachment: any) => {
    const link = document.createElement('a');
    link.href = attachment.file_url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Attachments</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {attachments.length}/10 Files
            </Badge>
            <Button variant="outline" size="sm" onClick={handleFileSelect}>
              <i className="ri-attachment-line mr-1 h-3 w-3" />
              Upload
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
          onChange={handleFileChange}
          className="hidden"
        />

        {attachments.length > 0 ? (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <i className={`${getFileIcon(attachment.file_type || '')} h-5 w-5 text-muted-foreground`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{attachment.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(attachment.file_size || 0)}</span>
                      <span>•</span>
                      <span>
                        {new Date(attachment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(attachment)}
                  >
                    <i className="ri-download-line h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                  >
                    <i className="ri-delete-bin-line h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
            onClick={handleFileSelect}
          >
            <i className="ri-upload-cloud-line text-3xl text-muted-foreground mb-2 block" />
            <p className="text-sm text-muted-foreground mb-1">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              PDFs, documents, images (Max: 10 files, 25MB each)
            </p>
            {uploadAttachment.isPending && (
              <div className="mt-2">
                <Badge variant="secondary">Uploading...</Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
