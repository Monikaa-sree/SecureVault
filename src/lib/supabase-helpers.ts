import { supabase } from "@/integrations/supabase/client";
import { encryptFile, decryptFile } from "@/lib/crypto";

export async function uploadFile(file: File, userId: string, secretKey: string) {
  const encryptedBlob = await encryptFile(file, secretKey);

  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}.enc`;
  const storagePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('vault-files')
    .upload(storagePath, encryptedBlob);

  if (uploadError) throw uploadError;

  const { error: dbError } = await supabase.from('files').insert({
    user_id: userId,
    name: file.name,
    original_name: file.name,
    size: file.size,
    mime_type: file.type,
    storage_path: storagePath,
    is_encrypted: true,
  });

  if (dbError) throw dbError;
}

export async function downloadFile(storagePath: string, fileName: string, mimeType: string | null, secretKey: string) {
  const { data, error } = await supabase.storage
    .from('vault-files')
    .download(storagePath);

  if (error) throw error;

  const decryptedBlob = await decryptFile(data, secretKey, mimeType || "application/octet-stream");

  const url = URL.createObjectURL(decryptedBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function deleteFile(fileId: string, storagePath: string) {
  const { error: storageError } = await supabase.storage
    .from('vault-files')
    .remove([storagePath]);

  if (storageError) throw storageError;

  const { error: dbError } = await supabase.from('files').delete().eq('id', fileId);
  if (dbError) throw dbError;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return 'file';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'music';
  if (mimeType.includes('pdf')) return 'file-text';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'file-text';
  return 'file';
}
