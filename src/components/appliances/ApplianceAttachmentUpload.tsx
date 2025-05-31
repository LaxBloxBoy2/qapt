"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUploadApplianceAttachment } from "@/hooks/useAppliances";

interface ApplianceAttachmentUploadProps {
  applianceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplianceAttachmentUpload({
  applianceId,
  open,
  onOpenChange
}: ApplianceAttachmentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const uploadAttachment = useUploadApplianceAttachment();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    // Set the custom name to the file name by default (without extension)
    const fileName = file.name.split(".").slice(0, -1).join(".");
    setCustomName(fileName);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      await uploadAttachment.mutateAsync({
        applianceId,
        file: selectedFile,
        name: customName || selectedFile.name,
      });

      // Reset form
      setSelectedFile(null);
      setCustomName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setCustomName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Attachment</DialogTitle>
          <DialogDescription>
            Upload a file attachment for this appliance.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground overflow-hidden">
                Selected: <span className="truncate inline-block max-w-[300px] align-bottom" title={selectedFile.name}>
                  {selectedFile.name}
                </span> ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Display Name (Optional)</Label>
            <Input
              id="name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter a name for this attachment"
            />
            <p className="text-sm text-muted-foreground">
              If left blank, the file name will be used.
            </p>
          </div>
        </div>

        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                Uploading...
              </>
            ) : (
              <>Upload</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
