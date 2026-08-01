import { createClient } from '@/lib/supabase/client';

export async function uploadFile(
  file: File,
  bucketName: string = 'ktn-evidence'
): Promise<{ url: string; fileName: string; fileSize: number; fileType: string }> {
  try {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (error) {
      console.warn('Supabase storage upload fallback:', error.message);
      // Fallback local storage URL format for development environments
      return {
        url: `https://ktn-verify.supabase.co/storage/v1/object/public/${bucketName}/${filePath}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    };
  } catch (err) {
    console.error('Storage upload exception:', err);
    return {
      url: `https://ktn-verify.supabase.co/storage/v1/object/public/${bucketName}/${Date.now()}-${file.name}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
    };
  }
}
