import React, { useState } from 'react';
import { Mail, Lock, User, Chrome, ArrowRight, ShieldCheck, Database } from 'lucide-react';
import type { UserProfile } from '../types';
import { translations, Language } from '../translations';
import { supabase } from '../lib/supabase';

import { Logo } from './Logo';

interface AuthProps {
  onLogin: (user: Partial<UserProfile>) => void;
  language?: Language;
}

export default function Auth({ onLogin, language = 'en' }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (supabase) {
        if (isLogin) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          
          if (data.user) {
            onLogin({
              id: data.user.id,
              name: data.user.user_metadata?.name || 'User',
              email: data.user.email,
              dailyBudgetMAD: 50,
              tokens: 5,
            });
          }
        } else {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name }
            }
          });
          if (error) throw error;
          
          if (data.session) {
            onLogin({
              id: data.user!.id,
              name: name,
              email: data.user!.email,
              dailyBudgetMAD: 50,
              tokens: 5,
            });
          } else if (data.user) {
             alert('Registration successful! Please check your email to confirm your account.');
          }
        }
      } else {
        // Fallback to local simulated auth if Supabase isn't configured
        console.warn("Supabase not configured, using local mock auth");
        onLogin({
          id: Math.random().toString(36).substring(7),
          name: isLogin ? 'User' : name,
          email: email,
          dailyBudgetMAD: 50,
          tokens: 5,
        });
      }
    } catch (error: any) {
      alert(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (supabase) {
      if (window.self !== window.top) {
         alert("La connexion avec Google nécessitant une redirection (bloquée dans cet aperçu), une session 'Test' a été simulée. Pour le vrai Google Auth, ouvrez l'application dans un nouvel onglet.");
         onLogin({
           id: Math.random().toString(36).substring(7),
           name: 'Google User (Test)',
           email: 'test@gmail.com',
           dailyBudgetMAD: 50,
           tokens: 10,
         });
         return;
      }

      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            queryParams: {
              prompt: 'select_account'
            }
          }
        });
        
        if (error) throw error;
      } catch (error: any) {
        if (error.message?.includes('provider is not enabled') || error.message?.includes('Unsupported provider')) {
           alert("Google n'est pas activé !\n\nAllez sur votre Dashboard Supabase -> Authentication -> Providers -> Activez Google.");
        } else {
           alert("Erreur: " + error.message);
        }
      }
    } else {
      // Simulate Google auth
      onLogin({
        id: Math.random().toString(36).substring(7),
        name: 'Google User',
        email: 'user@gmail.com',
        dailyBudgetMAD: 50,
        tokens: 5,
      });
    }
  };

  return (
    <div className="min-h-screen bg-purple-900 sm:bg-gradient-to-br sm:from-purple-50 sm:to-slate-100 flex flex-col sm:items-center justify-center p-0 sm:p-8">
      <div className="w-full h-full sm:h-auto sm:max-w-5xl sm:w-full bg-white sm:rounded-[2rem] shadow-2xl sm:border sm:border-slate-100/50 overflow-hidden flex flex-col md:flex-row flex-1">
        
        {/* Mobile Header / Branding */}
        <div className="bg-purple-900 text-white px-6 pt-12 pb-14 flex flex-col relative overflow-hidden sm:hidden shadow-lg z-0">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-400 via-transparent to-transparent"></div>
          <div className="relative z-10 flex items-center justify-center font-bold tracking-widest text-purple-200 mb-6 text-2xl gap-0.5">
            <Logo className="w-9 h-9 text-purple-300 relative bottom-0.5" />
            <span className="pt-1">MTAWA</span>
          </div>
          <div className="relative z-10 text-center">
            <h1 className="text-3xl font-bold mb-2 tracking-tight leading-tight">
              Gérez votre santé, <br/> optimisez votre budget
            </h1>
            <p className="text-purple-200 text-sm max-w-xs mx-auto">
              Votre assistant IA pour la nutrition et le suivi médical.
            </p>
          </div>
        </div>

        {/* Left side / Branding (Hidden on very small mobile, or just stacked) */}
        <div className="bg-purple-900 md:w-5/12 text-white p-10 flex-col justify-between relative overflow-hidden hidden sm:flex">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white via-purple-600 to-transparent"></div>
          
          <div className="relative z-10 flex items-center font-bold tracking-widest text-purple-200 text-3xl gap-0.5">
            <Logo className="w-10 h-10 text-purple-300 relative bottom-0.5" />
            <span className="pt-1">MTAWA</span>
          </div>

          <div className="relative z-10 mt-12 mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight leading-tight">
              Prenez soin de votre corps <br/> & de votre budget.
            </h1>
            <p className="text-purple-200 text-lg leading-relaxed max-w-sm">
              L'IA générative au service de votre nutrition, optimisée pour vos besoins médicaux et votre pouvoir d'achat au Maroc.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
             <div className="flex -space-x-4">
                <img className="w-10 h-10 rounded-full border-2 border-purple-900 object-cover shadow-sm" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" alt="Avatar User" />
                <img className="w-10 h-10 rounded-full border-2 border-purple-900 object-cover shadow-sm" src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80" alt="Avatar User" />
                <img className="w-10 h-10 rounded-full border-2 border-purple-900 object-cover shadow-sm" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" alt="Avatar User" />
             </div>
             <p className="text-sm font-medium text-purple-200">Rejoignez des milliers de membres.</p>
          </div>
        </div>

        {/* Right side / Form */}
        <div className="p-6 sm:p-8 md:p-12 md:w-7/12 flex flex-col justify-center bg-white relative rounded-t-[2.5rem] sm:rounded-none -mt-8 sm:mt-0 z-20 flex-1 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] sm:shadow-none min-h-[60vh]">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">
            {isLogin ? 'Bienvenue !' : 'Créer un compte'}
          </h2>
          <p className="text-slate-500 mb-8">
            {isLogin ? 'Connectez-vous pour accéder à votre tableau de bord.' : 'Rejoignez-nous pour optimiser votre santé.'}
          </p>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 hover:shadow-md hover:border-slate-300 transition-all shadow-sm mb-6 text-base group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>

          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm uppercase font-bold tracking-wider">Ou avec un email</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                    placeholder="Zakaria B."
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                  placeholder="nom@exemple.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-700 text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-purple-800 transition disabled:opacity-50 mt-4 text-lg"
            >
              {loading ? "Traitement..." : (isLogin ? "Se connecter" : "S'inscrire")}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-500 font-medium">
            {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-700 font-bold hover:underline"
            >
              {isLogin ? "Créer un compte" : "Se connecter"}
            </button>
          </p>

          <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-slate-100 text-xs font-semibold">
            {supabase ? (
              <>
                <Database className="w-4 h-4 text-purple-500" />
                <span className="text-purple-700 uppercase tracking-widest text-[10px]">Cloud Sync Actif</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">Mode Local</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
