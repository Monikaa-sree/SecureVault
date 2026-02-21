import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Send, AlertCircle } from 'lucide-react';
import type { EncryptedFile } from '../types';

interface ShareModalProps {
  file: EncryptedFile;
  onClose: () => void;
  onShare: (email: string, secretCode: string, message: string) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ file, onClose, onShare }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [message, setMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');

  const generateSecretCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSecretCode(code);
  };

  const validateForm = (): boolean => {
    if (!recipientEmail || !secretCode) {
      setError('All fields are required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (secretCode.length < 4) {
      setError('Secret code must be at least 4 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;

    setIsSharing(true);

    try {
      await onShare(recipientEmail, secretCode, message);
    } catch (error) {
      setError('Failed to share file. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-black/90 backdrop-blur-2xl border border-purple-500/30 rounded-lg p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Mail className="w-6 h-6 text-purple-400" />
              Share Secure File
            </h2>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* File Info */}
          <div className="mb-6 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-purple-300 mb-1">Sharing file:</p>
            <p className="text-white font-medium">{file.originalName}</p>
            <p className="text-xs text-gray-400 mt-1">
              Size: {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recipient Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Recipient Email
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-green-400 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                placeholder="recipient@example.com"
                required
              />
            </div>

            {/* Secret Code */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Lock className="inline w-4 h-4 mr-1" />
                Secret Code for Recipient
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="flex-1 px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-green-400 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  placeholder="Enter secret code"
                  required
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={generateSecretCode}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm"
                >
                  Generate
                </motion.button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This code will be required to decrypt the file
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-green-400 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all resize-none"
                placeholder="Add a message for the recipient..."
              />
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Security Notice */}
            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm flex items-start gap-2">
                <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  The recipient will need the secret code to decrypt and access this file. 
                  Share the code securely through a separate channel.
                </span>
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSharing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSharing ? (
                <span className="flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                  />
                  Sharing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Send className="w-5 h-5 mr-2" />
                  Share Encrypted File
                </span>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareModal;