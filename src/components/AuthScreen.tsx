import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
  linkWithCredential
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { LogIn, Sparkles, AlertCircle, Loader, Mail, Lock, User, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'link'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingGoogleCred, setPendingGoogleCred] = useState<any>(null);

  const demoEmail = import.meta.env.VITE_DEMO_EMAIL;
  const demoPass = import.meta.env.VITE_DEMO_PASSWORD;
  const isDemoAvailable = Boolean(demoEmail && demoPass);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide all credentials.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'signup') {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save initial user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          email: user.email || email,
          name: name || user.email?.split('@')[0] || 'Candidate',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. If you registered via Google, click "Google" to sign in, or click "Forgot Password" to set a password.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to receive the password reset link.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset link sent to your email. Check your inbox!');
      setMode('signin');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError(err.message || 'Failed to send password reset email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Sign in with the existing password credential
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // 2. Link the pending Google credential
      if (pendingGoogleCred) {
        await linkWithCredential(userCredential.user, pendingGoogleCred);
      }
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid password. Please try again.');
      } else {
        setError(err.message || 'Failed to link Google account.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      let user;
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.initialize();
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        const userCredential = await signInWithCredential(auth, credential);
        user = userCredential.user;
      } else {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        user = userCredential.user;
      }

      // Save user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'Candidate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      onSuccess?.();
    } catch (err: any) {
      console.error("Google Auth Error: ", err);
      if (err.code === 'auth/account-exists-with-different-credential') {
        const credential = GoogleAuthProvider.credentialFromError(err);
        setPendingGoogleCred(credential);
        if (err.customData?.email) {
          setEmail(err.customData.email);
        }
        setMode('link');
        setError('An account already exists with this email address. Please verify your password to link your Google sign-in.');
      } else {
        setError(err.message || 'Google Login was closed or failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Automated Quick Demo Login
  const handleQuickDemoLoc = async () => {
    if (!isDemoAvailable) {
      setError('Demo login is not configured for this build.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      onSuccess?.();
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        // Auto-Register demo candidate for premium sandbox evaluation
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
          const user = userCredential.user;
          await setDoc(doc(db, 'users', user.uid), {
            id: user.uid,
            email: demoEmail,
            name: 'Demo Candidate Sandbox',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          onSuccess?.();
        } catch (innerErr: any) {
          setError(innerErr.message || 'Unable to provision demo sandbox account.');
        }
      } else {
        setError(err.message || 'Demo Sandbox connection failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-screen-container" className="flex items-center justify-center min-h-[85vh] p-4 z-10">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl" />

        <div className="text-center mb-8 relative">
          <div className="inline-flex p-3 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 rounded-xl mb-4 border border-indigo-500/30">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold font-sans tracking-tight text-white mb-1">
            Preparation Tracker
          </h2>
          <p className="text-sm text-slate-300 font-medium mb-1">
            Master interviews with focused, AI-powered preparation
          </p>
          <p className="text-xs text-slate-400">
            Secure, intelligent preparation workspace
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error-msg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2 text-rose-300 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
          {successMessage && (
            <motion.div 
              key="success-msg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2 text-emerald-300 text-xs"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4 relative">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input 
                  type="email"
                  placeholder="work@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/60 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm rounded-lg cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Send Password Reset Link
                </>
              )}
            </button>
          </form>
        ) : mode === 'link' ? (
          <form onSubmit={handleLinkCredential} className="space-y-4 relative">
            <div className="text-xs text-slate-300 bg-slate-800/40 border border-slate-700/40 p-3 rounded-lg leading-relaxed mb-4">
              An account with email <strong className="text-indigo-300">{email}</strong> already exists. 
              Please enter the password for this account to link Google sign-in.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/60 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm rounded-lg cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Verify & Link Account
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-4 relative">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/60 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input 
                  type="email"
                  placeholder="work@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/60 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">Password</label>
                {mode === 'signin' && (
                  <button 
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setMode('forgot');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input 
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/60 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              id="auth-submit-btn"
              disabled={loading}
              className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm rounded-lg cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {mode === 'signup' ? 'Create Account' : 'Sign In Secure'}
                </>
              )}
            </button>
          </form>
        )}

        {(mode === 'signin' || mode === 'signup') && (
          <>
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-slate-800/50"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-[11px] tracking-widest uppercase font-mono font-semibold">Or Connect</span>
              <div className="flex-grow border-t border-slate-800/50"></div>
            </div>

            <div className={`grid gap-3 mb-6 ${isDemoAvailable ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <button
                type="button"
                id="google-auth-btn"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="py-2.5 px-4 cursor-pointer bg-slate-900/40 border border-slate-700/50 rounded-lg text-xs text-slate-300 hover:bg-slate-800/60 hover:border-slate-600/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50 font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.63 15.03 1 12 1 7.24 1 3.21 3.73 1.25 7.72l3.86 3C6.03 7.72 8.78 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.44c-.28 1.48-1.11 2.73-2.37 3.58l3.68 2.85c2.15-1.99 3.74-4.91 3.74-8.53z" />
                  <path fill="#FBBC05" d="M5.11 14.78c-.24-.72-.38-1.5-.38-2.28 0-.78.14-1.56.38-2.28l-3.86-3C.46 8.78 0 10.33 0 12c0 1.67.46 3.22 1.25 4.72l3.86-2.94z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.68-2.85c-1.1.74-2.5 1.18-4.28 1.18-3.22 0-5.97-2.68-6.89-5.68l-3.86 3C3.21 20.27 7.24 23 12 23z" />
                </svg>
                Google
              </button>

              {isDemoAvailable && (
                <button
                  type="button"
                  id="demo-sandbox-btn"
                  onClick={handleQuickDemoLoc}
                  disabled={loading}
                  className="py-2.5 px-4 cursor-pointer bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 hover:bg-emerald-950/50 hover:border-emerald-500/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  Try Demo
                </button>
              )}
            </div>
          </>
        )}

        <div className="text-center text-xs text-slate-400 space-y-1.5">
          <p>
            {mode === 'signup' && (
              <span>
                Already have an account?{' '}
                <button 
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('signin');
                  }} 
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition hover:underline"
                >
                  Sign In
                </button>
              </span>
            )}
            {mode === 'signin' && (
              <span>
                New here?{' '}
                <button 
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('signup');
                  }} 
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition hover:underline"
                >
                  Create Account
                </button>
              </span>
            )}
            {mode === 'forgot' && (
              <button 
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode('signin');
                }} 
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition hover:underline flex items-center justify-center gap-1.5 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </button>
            )}
            {mode === 'link' && (
              <button 
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode('signin');
                  setPendingGoogleCred(null);
                }} 
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition hover:underline flex items-center justify-center gap-1.5 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Cancel & Sign In
              </button>
            )}
          </p>
          <p className="text-[11px] text-slate-500 pt-1">
            By continuing, you agree to our Terms of Service & Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
}
