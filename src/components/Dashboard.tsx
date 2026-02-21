import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Download, 
  Mail, 
  Search, 
  LogOut, 
  Trash2, 
  Eye,
  Lock,
  Share2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import type { User, EncryptedFile } from '../types';
import { encryptFile, decryptFile, generateHash } from '../utils/encryption';
import { mockSendEmail, generateShareLink } from '../utils/emailService';
import ShareModal from './ShareModal';

interface DashboardProps {
  user: User | null;
  secretKey: string;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, secretKey, onLogout }) => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<EncryptedFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<EncryptedFile | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = () => {
    const storedFiles = localStorage.getItem(`vault_files_${user?.id}`);
    if (storedFiles) {
      setFiles(JSON.parse(storedFiles));
    }
  };

  const handleFileUpload = async (uploadedFiles: File[]) => {
    setIsUploading(true);
    
    try {
      const newFiles: EncryptedFile[] = [];
      
      for (const file of uploadedFiles) {
        const encryptedData = await encryptFile(file, secretKey);
        const encryptedFile: EncryptedFile = {
          id: generateHash(file.name + Date.now()),
          name: file.name,
          originalName: file.name,
          size: file.size,
          type: file.type,
          encryptedData,
          encryptionKey: generateHash(secretKey),
          uploadedAt: new Date().toISOString(),
          userId: user?.id || '',
          isShared: false,
        };
        
        newFiles.push(encryptedFile);
      }
      
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      localStorage.setItem(`vault_files_${user?.id}`, JSON.stringify(updatedFiles));
      
      showNotification('success', `${uploadedFiles.length} file(s) uploaded and encrypted successfully!`);
    } catch (error) {
      showNotification('error', 'Failed to upload and encrypt files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDownload = async (file: EncryptedFile) => {
    try {
      const decryptedBlob = await decryptFile(file.encryptedData, secretKey, file.name);
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
      showNotification('error', 'Failed to decrypt file. Please check your secret key.');
    }
  };

  const handleFileDelete = (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this encrypted file?')) {
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      localStorage.setItem(`vault_files_${user?.id}`, JSON.stringify(updatedFiles));
      showNotification('success', 'File deleted successfully!');
    }
  };

  const handleFileShare = (file: EncryptedFile) => {
    setSelectedFile(file);
    setShowShareModal(true);
  };

  const handleShareSubmit = async (recipientEmail: string, secretCode: string, message: string) => {
    if (!selectedFile) return;
    
    try {
      const shareLink = generateShareLink(selectedFile.id, secretCode);
      
      const emailData = {
        to: recipientEmail,
        subject: `Secure File Shared: ${selectedFile.originalName}`,
        message: `
${message}

You have been sent an encrypted file: ${selectedFile.originalName}

To access this file, use this secret code: ${secretCode}

Download link: ${shareLink}

This file is encrypted for security. Keep the secret code safe!
        `,
        attachment: {
          name: selectedFile.originalName,
          data: shareLink
        }
      };
      
      await mockSendEmail(emailData);
      
      // Mark file as shared
      const updatedFile = { ...selectedFile, isShared: true };
      const updatedFiles = files.map(f => f.id === selectedFile.id ? updatedFile : f);
      setFiles(updatedFiles);
      localStorage.setItem(`vault_files_${user?.id}`, JSON.stringify(updatedFiles));
      
      setShowShareModal(false);
      setSelectedFile(null);
      showNotification('success', 'File shared successfully via email!');
    } catch (error) {
      showNotification('error', 'Failed to share file. Please try again.');
    }
  };

  const handleFileView = (file: EncryptedFile) => {
    navigate(`/file/${file.id}`);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    multiple: true,
    disabled: isUploading
  });

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
              SecureVault
            </h1>
            <p className="text-gray-400">
              Welcome back, <span className="text-purple-400">{user?.name}</span>
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-900/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search encrypted files..."
            className="w-full pl-12 pr-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-green-400 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
          />
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-purple-400 bg-purple-900/20'
              : 'border-purple-500/30 bg-black/30 hover:border-purple-400/50 hover:bg-purple-900/10'
          } ${isUploading ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={isUploading ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 2, repeat: isUploading ? Infinity : 0, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Upload className="w-12 h-12 text-purple-400 mx-auto" />
          </motion.div>
          
          {isUploading ? (
            <div>
              <p className="text-purple-400 font-semibold mb-2">Encrypting files...</p>
              <div className="w-full max-w-xs mx-auto bg-black/50 rounded-full h-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                  animate={{ width: '100%' }}
                  transition={{ duration: 2 }}
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-300 font-semibold mb-2">
                {isDragActive ? 'Drop files here' : 'Drop files here or click to upload'}
              </p>
              <p className="text-gray-500 text-sm">
                Files will be automatically encrypted with your secret key
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Files Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Your Encrypted Files ({filteredFiles.length})
          </h2>
          
          {files.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Lock className="w-4 h-4" />
              <span>All files encrypted with AES-256</span>
            </div>
          )}
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {searchTerm ? 'No files found matching your search' : 'No encrypted files yet'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Upload files to get started with secure encryption
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative bg-black/50 backdrop-blur-xl border border-purple-500/30 rounded-lg p-6 hover:border-purple-400/50 transition-all"
              >
                {/* File Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-900/30 rounded-lg">
                      <FileText className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">
                        {file.originalName}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  
                  {file.isShared && (
                    <Share2 className="w-4 h-4 text-green-400" />
                  )}
                </div>

                {/* File Actions */}
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFileView(file)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded text-purple-400 hover:bg-purple-900/50 transition-all text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFileDownload(file)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-900/30 border border-green-500/30 rounded text-green-400 hover:bg-green-900/50 transition-all text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFileShare(file)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded text-blue-400 hover:bg-blue-900/50 transition-all text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    Share
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFileDelete(file.id)}
                    className="p-2 bg-red-900/30 border border-red-500/30 rounded text-red-400 hover:bg-red-900/50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && selectedFile && (
          <ShareModal
            file={selectedFile}
            onClose={() => {
              setShowShareModal(false);
              setSelectedFile(null);
            }}
            onShare={handleShareSubmit}
          />
        )}
      </AnimatePresence>

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

export default Dashboard;