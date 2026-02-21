import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, User as UserIcon, Eye, EyeOff, Key, AlertCircle } from 'lucide-react';
import type { User } from '../types';
import { validateSecretKey, generateHash } from '../utils/encryption';

interface AuthProps {
  onLogin: (user: User, secretKey: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showConfirmKey, setShowConfirmKey] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!email || !secretKey) {
      setError('All fields are required');
      return false;
    }

    if (!validateSecretKey(secretKey)) {
      setError('Secret key must be at least 8 characters with letters and numbers');
      return false;
    }

    if (isSignUp) {
      if (!name) {
        setError('Name is required');
        return false;
      }
      if (secretKey !== confirmKey) {
        setError('Secret keys do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const user: User = {
        id: generateHash(email + Date.now()),
        email,
        name: name || email.split('@')[0],
        createdAt: new Date().toISOString(),
      };

      onLogin(user, secretKey);
    } catch (error) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="relative">
          {/* Glowing border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur-xl opacity-50" />
          
          <div className="relative bg-black/90 backdrop-blur-2xl border border-purple-500/30 rounded-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-4"
              >
                <Shield className="w-16 h-16 text-purple-400 mx-auto" />
              </motion.div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                SecureVault
              </h1>
              <p className="text-gray-400 text-sm">
                {isSignUp ? 'Create your secure vault' : 'Access your encrypted files'}
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <UserIcon className="inline w-4 h-4 mr-1" />
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-green-400 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                    placeholder="Enter your name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-green-400 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Key className="inline w-4 h-4 mr-1" />
                  Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-black/50 border border-purple-500/30 rounded-lg text-green-400 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                    placeholder="Enter secret key"
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
                  Must be 8+ characters with letters and numbers
                </p>
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Lock className="inline w-4 h-4 mr-1" />
                    Confirm Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmKey ? 'text' : 'password'}
                      value={confirmKey}
                      onChange={(e) => setConfirmKey(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-black/50 border border-purple-500/30 rounded-lg text-green-400 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                      placeholder="Confirm secret key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmKey(!showConfirmKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      {showConfirmKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                    />
                    Processing...
                  </span>
                ) : (
                  isSignUp ? 'Create Account' : 'Access Vault'
                )}
              </motion.button>
            </form>

            {/* Toggle Sign In/Up */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="ml-1 text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;