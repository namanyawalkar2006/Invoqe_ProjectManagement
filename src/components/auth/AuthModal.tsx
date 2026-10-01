import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { PlanifyLogo } from '../common/PlanifyLogo.tsx';
import { ShieldCheck, UserCheck, ArrowRight, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login, signup, switchUser, error, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password, role);
      }
    } catch {
      // error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    clearError();
    setSubmitting(true);
    try {
      await switchUser(demoEmail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 select-none">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <PlanifyLogo size="lg" showText={false} className="mb-3" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Planify</h1>
          <p className="text-xs text-slate-600 mt-1 max-w-xs">
            Real-time collaborative project management & Task Board workspace
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 border border-slate-200 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              clearError();
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              isLogin ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              clearError();
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              !isLogin ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Global System Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('MEMBER')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left flex items-center justify-between cursor-pointer transition-colors ${
                    role === 'MEMBER'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Member</span>
                  {role === 'MEMBER' && <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left flex items-center justify-between cursor-pointer transition-colors ${
                    role === 'ADMIN'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Administrator</span>
                  {role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isLogin ? 'Sign In to Workspace' : 'Create Free Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Demo Fast Login Switchers */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            One-Click Demo Personas (Zero Setup)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('sarah@planify.io')}
              className="p-2.5 text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 group-hover:text-blue-600">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                <span>Sarah C.</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">ADMIN</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('alex@planify.io')}
              className="p-2.5 text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 group-hover:text-blue-600">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                <span>Alex R.</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">MEMBER</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('elena@planify.io')}
              className="p-2.5 text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 group-hover:text-blue-600">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                <span>Elena R.</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">MEMBER</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
