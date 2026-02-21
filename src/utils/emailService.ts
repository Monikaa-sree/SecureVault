import emailjs from '@emailjs/browser';
import type { EmailData } from '../types';

// Initialize EmailJS with your service details
// Note: You'll need to sign up at https://www.emailjs.com/ and get your own credentials
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Replace with your EmailJS public key
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // Replace with your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // Replace with your EmailJS template ID

emailjs.init(EMAILJS_PUBLIC_KEY);

export const sendEncryptedFileEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    const templateParams = {
      to_email: emailData.to,
      subject: emailData.subject,
      message: emailData.message,
      attachment_name: emailData.attachment?.name || '',
      download_link: emailData.attachment?.data || '',
      reply_to: 'noreply@securevault.com',
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    return response.status === 200;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const generateShareLink = (fileId: string, secretCode: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/share/${fileId}?code=${encodeURIComponent(secretCode)}`;
};

// Mock email service for development (remove this in production)
export const mockSendEmail = async (emailData: EmailData): Promise<boolean> => {
  console.log('📧 Email Service (Mock):');
  console.log('To:', emailData.to);
  console.log('Subject:', emailData.subject);
  console.log('Message:', emailData.message);
  console.log('Attachment:', emailData.attachment?.name);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('✅ Email sent successfully (mock)');
  return true;
};