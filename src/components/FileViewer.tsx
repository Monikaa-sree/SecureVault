import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Lock, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Loader2, 
  EyeOff
} from 'lucide-react';
import type { EncryptedFile } from '../types';
import { decryptFile } from '../utils/encryption';

interface FileViewerProps {
  secretKey: string;
}

const FileViewer: React.FC<FileViewerProps> = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  
  const [file, setFile] = useState<EncryptedFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decryptKey, setDecryptKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [viewMode, setViewMode] = useState<'encrypted' | 'decrypted'>('encrypted');

  useEffect(() => {
    loadFile();
  }, [fileId]);

  const loadFile = () => {
    // Get user from stored data
    const storedUser = localStorage.getItem('vaultUser');
    if (!storedUser) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    // Find all files across all users (for demo purposes)
    const allKeys = Object.keys(localStorage);
    let foundFile: EncryptedFile | null = null;
    let userId = '';

    for (const key of allKeys) {
      if (key.startsWith('vault_files_')) {
        const storedFiles = localStorage.getItem(key);
        if (storedFiles) {
          const files: EncryptedFile[] = JSON.parse(storedFiles);
          const file = files.find(f => f.id === fileId);
          if (file) {
            foundFile = file;
            userId = key.replace('vault_files_', '');
            break;
          }
        }
      }
    }

    if (foundFile) {
      setFile(foundFile);
      localStorage.setItem('currentUserId', userId);
    } else {
      setError('File not found');
    }
    
    setIsLoading(false);
  };

  const handleDecrypt = async () => {
    if (!file || !decryptKey) {
      setError('Please enter the secret key');
      return;
    }

    setIsDecrypting(true);
    setError('');

    try {
      const decryptedBlob = await decryptFile(file.encryptedData, decryptKey, file.name);
      
      // For text files, show preview
      if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        const text = await decryptedBlob.text();
        setDecryptedContent(text);
        setViewMode('decrypted');
      }
      
      // Trigger download
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showNotification('success', 'File decrypted and downloaded successfully!');
    } catch (error) {
      setError('Invalid secret key. Please try again.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-400/30 border-t-purple-400 rounded-full"
        />
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error || 'File not found'}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
          >
            Back to Dashboard
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-black/50 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-900/30 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">File Viewer</h1>
              <p className="text-gray-400">Decrypt and access your secure file</p>
            </div>
          </div>
        </div>

        {/* File Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 backdrop-blur-xl border border-purple-500/30 rounded-lg p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-900/30 rounded-lg">
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-1">{file.originalName}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Size: {(file.size / 1024).toFixed(1)} KB</span>
                <span>Type: {file.type || 'Unknown'}</span>
                <span>Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Encryption Status */}
          <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <Lock className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">File is encrypted with AES-256</span>
          </div>
        </motion.div>

        {/* View Mode Toggle */}
        {decryptedContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex bg-black/50 border border-purple-500/30 rounded-lg p-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode('encrypted')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'encrypted'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Eye className="inline w-4 h-4 mr-1" />
                Encrypted
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode('decrypted')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'decrypted'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <CheckCircle className="inline w-4 h-4 mr-1" />
                Decrypted
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Encrypted Content Preview */}
        {viewMode === 'encrypted' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/50 backdrop-blur-xl border border-purple-500/30 rounded-lg p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              Encrypted Content
            </h3>

            <div className="bg-black/30 border border-purple-500/20 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-purple-400 text-sm font-medium">Encrypted Data (AES-256)</span>
                <span className="text-gray-500 text-xs">
                  Size: {file?.encryptedData.length} characters
                </span>
              </div>
              <div className="bg-black/50 rounded p-3 border border-purple-500/10">
                <pre className="text-purple-400 text-xs font-mono break-all leading-relaxed">
                  {file?.encryptedData.substring(0, 1000)}
                  {file?.encryptedData.length > 1000 && '...'}
                </pre>
                {file?.encryptedData.length > 1000 && (
                  <p className="text-gray-500 text-xs mt-2">
                    (Showing first 1000 characters of {file.encryptedData.length} total)
                  </p>
                )}
              </div>
            </div>
            
            <p className="text-gray-500 text-sm mt-3">
              This is the encrypted version of your file. Enter the secret key below to decrypt and download the original file.
            </p>
          </motion.div>
        )}

        {/* Decrypted Content */}
        {decryptedContent && viewMode === 'decrypted' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/50 backdrop-blur-xl border border-green-500/30 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Decrypted Content
              </h3>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDecrypt}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
              >
                <Download className="w-4 h-4" />
                Download
              </motion.button>
            </div>

            {/* Content Preview */}
            <div className="bg-black/30 border border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                {decryptedContent}
              </pre>
            </div>
          </motion.div>
        )}

        {/* Decryption Section */}
        {!decryptedContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/50 backdrop-blur-xl border border-purple-500/30 rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              Decrypt File
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={decryptKey}
                    onChange={(e) => setDecryptKey(e.target.value)}
                    placeholder="Enter secret key to decrypt this file"
                    className="w-full px-4 py-3 pr-12 bg-black/50 border border-purple-500/30 rounded-lg text-green-400 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the secret key used to encrypt this file
                </p>
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

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDecrypt}
                disabled={isDecrypting || !decryptKey}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isDecrypting ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Decrypting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Download className="w-5 h-5 mr-2" />
                    Decrypt & Download
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-lg border ${
              notification.type === 'success'
                ? 'bg-green-900/20 border-green-500/30 text-green-400'
                : 'bg-red-900/20 border-red-500/30 text-red-400'
            } backdrop-blur-xl z-50`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileViewer;