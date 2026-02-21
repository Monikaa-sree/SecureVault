import CryptoJS from 'crypto-js';
import { sha256 } from 'js-sha256';

export const generateHash = (data: string): string => {
  return sha256(data);
};

export const encryptData = (data: string, secretKey: string): string => {
  const keyHash = sha256(secretKey);
  const encrypted = CryptoJS.AES.encrypt(data, keyHash).toString();
  return encrypted;
};

export const decryptData = (encryptedData: string, secretKey: string): string => {
  try {
    const keyHash = sha256(secretKey);
    const decrypted = CryptoJS.AES.decrypt(encryptedData, keyHash);
    const originalText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!originalText) {
      throw new Error('Invalid secret key or corrupted data');
    }
    
    return originalText;
  } catch (error) {
    throw new Error('Failed to decrypt data. Please check your secret key.');
  }
};

export const encryptFile = async (file: File, secretKey: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const fileData = event.target?.result as string;
        const base64Data = fileData.split(',')[1];
        const encrypted = encryptData(base64Data, secretKey);
        resolve(encrypted);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const decryptFile = async (
  encryptedData: string, 
  secretKey: string, 
  fileName: string
): Promise<Blob> => {
  try {
    const decryptedBase64 = decryptData(encryptedData, secretKey);
    
    // Convert base64 to blob
    const byteCharacters = atob(decryptedBase64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: getMimeType(fileName) });
  } catch (error) {
    throw new Error('Failed to decrypt file. Invalid secret key.');
  }
};

export const getMimeType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
};

export const validateSecretKey = (key: string): boolean => {
  return key.length >= 8 && /[A-Za-z]/.test(key) && /[0-9]/.test(key);
};