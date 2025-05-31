import { supabase } from "@/lib/supabase";

export async function uploadInspectionMedia(
  file: File,
  conditionId: string,
  mediaType: "image" | "video"
): Promise<{ url: string; path: string }> {
  if (!file) {
    throw new Error("No file provided");
  }

  // Validate file type
  if (mediaType === "image" && !file.type.startsWith("image/")) {
    throw new Error("Invalid file type. Please select an image file.");
  }

  if (mediaType === "video" && !file.type.startsWith("video/")) {
    throw new Error("Invalid file type. Please select a video file.");
  }

  // Create a unique file name
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `inspection-media/${conditionId}/${fileName}`;

  // Upload the file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("inspection-media")
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Error uploading file: ${uploadError.message}`);
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from("inspection-media")
    .getPublicUrl(filePath);

  return {
    url: publicUrl,
    path: filePath,
  };
}
