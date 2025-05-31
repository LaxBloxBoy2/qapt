import { supabase } from "./supabase";

export async function uploadApplianceImage(file: File, applianceId: string): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${applianceId}-${Date.now()}.${fileExt}`;
  const filePath = `appliances/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("appliance-files")
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Error uploading file: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from("appliance-files").getPublicUrl(filePath);

  return data.publicUrl;
}
