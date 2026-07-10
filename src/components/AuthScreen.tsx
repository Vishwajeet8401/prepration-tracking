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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { LogIn, Sparkles, AlertCircle, Loader, Mail, Lock, User, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthScreenProps {
  onSuccess?: () => void;
  onBackToLanding?: () => void;
}

function getFriendlyAuthErrorMessage(err: any): string {
  if (!err) return 'An error occurred during authentication.';
  
  const code = err.code || (err.message && err.message.match(/\((auth\/[^)]+)\)/)?.[1]);
  
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. If you registered via Google, click the Google button to sign in, or click "Forgot Password" to set a password.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed sign-in attempts. Access to this account has been temporarily disabled. Please try again later or reset your password.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before completion. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Multiple sign-in popups opened. Please close other windows and try again.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection and try again.';
    case 'auth/requires-recent-login':
      return 'Please log in again before performing this action.';
    case 'auth/internal-error':
      return 'An internal error occurred. Please try again in a few moments.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    default:
      if (err.message) {
        let msg = err.message;
        if (msg.includes('Firebase:')) {
          msg = msg.replace(/Firebase:\s*(?:Error\s*)?\(auth\/[^)]+\)\.?\s*/, '').trim();
          msg = msg.replace(/Firebase:\s*/, '').trim();
        }
        return msg || 'Authentication failed. Please try again.';
      }
      return 'An unexpected authentication error occurred. Please try again.';
  }
}

export default function AuthScreen({ onSuccess, onBackToLanding }: AuthScreenProps) {
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
          updatedAt: new Date().toISOString(),
          onboardingCompleted: false,
        });
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyAuthErrorMessage(err));
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
      setError(getFriendlyAuthErrorMessage(err));
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
      setError(getFriendlyAuthErrorMessage(err));
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

      // Save user profile in Firestore (merge so existing data is preserved)
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      const isFirstTimeGoogleUser = !snap.exists();
      await setDoc(userDocRef, {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'Candidate',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(isFirstTimeGoogleUser ? { onboardingCompleted: false } : {}),
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
        setError(getFriendlyAuthErrorMessage(err));
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
          setError(getFriendlyAuthErrorMessage(innerErr));
        }
      } else {
        setError(getFriendlyAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-screen-container" className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto min-h-0 bg-[#060918]/40">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
      >
        {/* Back Button */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="absolute right-6 top-6 p-2 text-slate-500 hover:text-white rounded-xl hover:bg-white/5 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer z-20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}

        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          {/* Left Column: Brand & Info (Desktop only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-indigo-950/10 border-r border-slate-800/60 relative">
            {/* Interactive Grid Background */}
            <div className="absolute inset-0 lp-grid-bg pointer-events-none opacity-40 z-0" />
            
            <div className="relative z-10 flex items-center gap-2.5">
              <img src="/prepFlow.png" alt="PrepFlow Logo" className="w-8 h-8 rounded-xl object-contain border border-slate-700/50 shadow-md shadow-indigo-500/10" />
              <span className="font-bold text-[16px] text-white font-display">PrepFlow</span>
            </div>

            <div className="relative z-10 my-auto py-8 space-y-6">
              <h3 className="text-xl font-bold font-display text-white leading-tight">
                Accelerate your <span className="text-[#00F0FF]">learning loop</span> with smart companion tools.
              </h3>
              <ul className="space-y-4 text-xs text-slate-300">
                {[
                  { title: 'AI Mock Simulator', desc: 'Real-time spoken responses scored by LLM engines.' },
                  { title: 'Spaced Repetition', desc: 'Retain tech concepts right before you forget them.' },
                  { title: 'Goals & Applications', desc: 'Track companies, offer pipelines, and schedules.' }
                ].map((item) => (
                  <li key={item.title} className="flex gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-white block mb-0.5">{item.title}</strong>
                      <span className="text-slate-400 leading-normal">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 border-t border-slate-800/60 pt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>v1.0.0 released</span>
              <span>Free & Open Source</span>
            </div>
          </div>

          {/* Right Column: Auth Form */}
          <div className="lg:col-span-7 p-10 flex flex-col justify-center relative">
            {/* Form Header (Mobile/Tablet only) */}
            <div className="text-center mb-6 relative lg:hidden mt-4">
              <div className="inline-flex mb-4">
                <img src="/prepFlow.png" alt="PrepFlow Logo" className="w-14 h-14 rounded-2xl object-contain border border-slate-700/50 shadow-lg shadow-indigo-500/10" />
              </div>
              <h2 className="text-3xl font-bold font-display tracking-tight text-white mb-1.5">
                PrepFlow
              </h2>
              <p className="text-sm text-slate-300 font-medium mb-1">
                Master interviews with focused, AI-powered preparation
              </p>
              <p className="text-xs text-slate-500">
                Secure, intelligent preparation workspace
              </p>
            </div>

            {/* Form Header (Desktop only) */}
            <div className="hidden lg:block mb-6 relative">
              <h2 className="text-2xl font-bold font-display tracking-tight text-white mb-1">
                {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : mode === 'link' ? 'Link Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-slate-450">
                {mode === 'signup' ? 'Set up your smart preparation workspace' : mode === 'forgot' ? 'Get back into your account' : mode === 'link' ? 'Verify your password to link Google' : 'Enter details to access your dashboard'}
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
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25 transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 mt-6 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5659ed] hover:to-[#7f51f3] text-white font-bold text-sm rounded-xl cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25 transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 mt-6 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5659ed] hover:to-[#7f51f3] text-white font-bold text-sm rounded-xl cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25 transition-all"
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
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25 transition-all"
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
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition hover:underline cursor-pointer"
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
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25 transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="auth-submit-btn"
                  disabled={loading}
                  className="w-full py-3.5 px-4 mt-6 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5659ed] hover:to-[#7f51f3] text-white font-bold text-sm rounded-xl cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-slate-800/50"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-[10px] tracking-widest uppercase font-mono font-semibold">Or Connect</span>
                  <div className="flex-grow border-t border-slate-800/50"></div>
                </div>

                <div className={`grid gap-3 mb-6 ${isDemoAvailable ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <button
                    type="button"
                    id="google-auth-btn"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="py-2.5 px-4 cursor-pointer bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 hover:bg-white/10 hover:border-white/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 font-bold"
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
                      className="py-2.5 px-4 cursor-pointer bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 font-bold"
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
                      className="text-indigo-400 hover:text-indigo-300 font-semibold transition hover:underline cursor-pointer"
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
                      className="text-indigo-400 hover:text-indigo-300 font-semibold transition hover:underline cursor-pointer"
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
                    className="text-indigo-400 hover:text-indigo-300 font-semibold transition hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
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
                    className="text-indigo-400 hover:text-indigo-300 font-semibold transition hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
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
          </div>
        </div>
      </motion.div>
    </div>
  );
}
