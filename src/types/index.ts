export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface EncryptedFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  encryptedData: string;
  encryptionKey: string;
  uploadedAt: string;
  userId: string;
  isShared: boolean;
}

export interface ShareRequest {
  fileId: string;
  recipientEmail: string;
  secretCode: string;
  message?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  message: string;
  attachment?: {
    name: string;
    data: string;
  };
}