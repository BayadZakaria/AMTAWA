import { ScanLine, FileText, Utensils, Home, Bell, User, Dumbbell, HeartPulse, Coins, Globe, LogOut } from 'lucide-react';
import { Logo } from './components/Logo';
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import MedicalUpload from './components/MedicalUpload';
import Scanner from './components/Scanner';
import MealDisplay from './components/MealDisplay';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Fitness from './components/Fitness';
import TokenStore from './components/TokenStore';
import type { MedicalProfile, UserProfile } from './types';

import { Language, translations } from './translations';
import { supabase } from './lib/supabase';

export default function App() {
  const [user, setUser] = useState<Partial<UserProfile> | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [budget, setBudget] = useState(50);
  const [medicalProfile, setMedicalProfile] = useState<MedicalProfile>({ allergies: [], conditions: [], documents: [] });
  const [showTokenStore, setShowTokenStore] = useState(false);
  const [language, setLanguage] = useState<Language>('fr');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [notifications, setNotifications] = useState<any[]>([
    { id: 'start', title: 'Bienvenue sur Amtawa !', message: 'Votre assistant IA de santé est prêt. N\'oubliez pas d\'utiliser le NutriScan pour vérifier vos produits.', time: 'À l\'instant', isRead: false }
  ]);

  const t = translations[language];
  const isRTL = language === 'ar';

  useEffect(() => {
    const channel = new BroadcastChannel('oauth_channel');

    // 1. Popup: Handle OAuth callback
    if (window.location.search.includes('code=') || 
        window.location.hash.includes('access_token=') || 
        window.location.search.includes('error=') ||
        window.location.hash.includes('error=')) {
      
      // Check if we are inside the popup
      if (window.opener || window.name === 'oauth_popup') {
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;font-size:1.2rem;color:#333;">Finalisation de la connexion...</div>';
        
        // Broadcast the URL to any listening windows
        channel.postMessage({ 
          type: 'oauth_callback', 
          url: window.location.href 
        });
        
        // Also try postMessage as fallback
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'oauth_callback', 
            url: window.location.href 
          }, '*');
        }
        
        // Close after a brief delay
        setTimeout(() => window.close(), 100);
        return; 
      }
    }

    // 2. Main Window: Listen for popup completion (BroadcastChannel)
    channel.onmessage = (event) => {
      if (event.data?.type === 'oauth_callback' && event.data?.url) {
        const popupUrl = new URL(event.data.url);
        const error = popupUrl.searchParams.get('error') || popupUrl.hash.includes('error=');
        
        if (error) {
          const errorDesc = popupUrl.searchParams.get('error_description') || popupUrl.hash.split('error_description=')[1]?.split('&')[0];
          alert(`Erreur d'authentification Google: ${decodeURIComponent(errorDesc || 'Erreur inconnue')}`);
          return;
        }

        window.location.assign(event.data.url);
      }
    };

    // 2. Main Window: Listen for popup completion (postMessage Fallback)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'oauth_callback' && event.data?.url) {
        const popupUrl = new URL(event.data.url);
        const error = popupUrl.searchParams.get('error') || popupUrl.hash.includes('error=');
        
        if (error) {
          const errorDesc = popupUrl.searchParams.get('error_description') || popupUrl.hash.split('error_description=')[1]?.split('&')[0];
          alert(`Erreur d'authentification Google: ${decodeURIComponent(errorDesc || 'Erreur inconnue')}`);
          return;
        }

        window.location.assign(event.data.url);
      }
    };
    
    window.addEventListener('message', handleMessage);

    // 3. Gestion d'erreur classique

    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const error = urlParams.get('error') || hashParams.get('error');
    const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

    if (error) {
      alert(`Erreur d'authentification: ${errorDescription || error}`);
      window.history.replaceState(null, '', window.location.pathname);
    }

    if (!supabase) {
      channel.close();
      return () => window.removeEventListener('message', handleMessage);
    }

    // 4. Flux standard Supabase

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || 'User',
          email: session.user.email,
          dailyBudgetMAD: 50,
          tokens: 5,
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || 'User',
          email: session.user.email,
          dailyBudgetMAD: 50,
          tokens: 5,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      channel.close();
      window.removeEventListener('message', handleMessage);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !supabase) return;
    
    // Load existing user data from our tables
    const loadData = async () => {
      // 1. Fetch user extended info
      let { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (!userData) {
         // Create default user record
         const { data: newUserData, error: insertError } = await supabase
           .from('users')
           .insert([{ 
             id: user.id, 
             email: user.email || 'user@example.com', 
             name: user.name || user.email?.split('@')[0] || 'User',
             daily_budget_mad: 50, 
             tokens: 5 
           }])
           .select()
           .maybeSingle();
           
         if (insertError) {
           console.error("Error creating user profile:", insertError);
         } else {
           userData = newUserData;
         }
      }
      
      if (userData) {
         setBudget(userData.daily_budget_mad);
         // Update top-level user with Supabase stats if available
         setUser(prev => ({
           ...prev,
           name: userData.name || prev?.name,
           dailyBudgetMAD: userData.daily_budget_mad,
           tokens: userData.tokens,
           age: userData.age,
           weightKg: userData.weight_kg,
           heightCm: userData.height_cm,
           mealPlan: userData.meal_plan,
           fitnessPlan: userData.fitness_plan
         }));
      }

      // 2. Fetch medical profile
      let { data: medData } = await supabase
        .from('medical_profiles')
        .select('allergies, conditions, documents')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (medData) {
         setMedicalProfile({
           allergies: medData.allergies || [],
           conditions: medData.conditions || [],
           documents: medData.documents || []
         });
      } else {
         // Create default medical profile
         const { error: medError } = await supabase.from('medical_profiles').insert([{ user_id: user.id }]);
         if (medError) {
           console.error("Error creating medical profile:", medError);
         }
      }

      // 3. Check for Stripe checkout success
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true' && urlParams.get('purchased_tokens')) {
         const purchasedTokens = parseInt(urlParams.get('purchased_tokens') || '0', 10);
         if (!isNaN(purchasedTokens) && purchasedTokens > 0) {
            const finalTokens = (userData?.tokens || user.tokens || 0) + purchasedTokens;
            
            // Update UI
            setUser(prev => prev ? { ...prev, tokens: finalTokens } : prev);
            
            // Update Database
            await supabase.from('users').update({ tokens: finalTokens }).eq('id', user.id);
            
            alert(`Paiement réussi ! ${purchasedTokens} jetons ont été ajoutés à votre compte.`);
            
            // Clean URL
            window.history.replaceState({}, document.title, "/");
         }
      }

      // 4. Fetch Real Notifications
      try {
        const notifRes = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          if (notifData.notifications) {
            setNotifications(notifData.notifications);
            setUnreadCount(notifData.notifications.length);
          }
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };
    
    loadData();
  }, [user?.id]);

  if (!user) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        <Auth onLogin={setUser} language={language} />
      </div>
    );
  }

  const handleUpdateUser = async (updates: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : updates as any);
    if (supabase && user?.id) {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.tokens !== undefined) updateData.tokens = updates.tokens;
      if (updates.age !== undefined) updateData.age = updates.age;
      if (updates.weightKg !== undefined) updateData.weight_kg = updates.weightKg;
      if (updates.heightCm !== undefined) updateData.height_cm = updates.heightCm;
      if (updates.mealPlan !== undefined) updateData.meal_plan = updates.mealPlan;
      if (updates.fitnessPlan !== undefined) updateData.fitness_plan = updates.fitnessPlan;
      
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase.from('users').update(updateData).eq('id', user.id);
        if (error) {
          console.error("Failed to update user in Supabase:", error);
          alert("Erreur de sauvegarde dans la base de données. Assurez-vous que les colonnes : age, weight_kg, height_cm, meal_plan, fitness_plan existent dans la table users !");
        }
      }
    }
  };

  const handleUpdateBudget = async (newBudget: number) => {
    setBudget(newBudget);
    if (supabase && user?.id) {
      await supabase.from('users').update({ daily_budget_mad: newBudget }).eq('id', user.id);
    }
  };

  const handleUpdateMedicalProfile = async (data: MedicalProfile) => {
    setMedicalProfile(data);
    if (supabase && user?.id) {
      const { error } = await supabase.from('medical_profiles').upsert({
        user_id: user.id,
        allergies: data.allergies,
        conditions: data.conditions,
        documents: data.documents || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
      if (error) {
         console.error("Failed to upsert medical profile:", error);
         alert("Erreur de sauvegarde. Assurez-vous que 'user_id' est la Primary Key ou UNIQUE dans la table medical_profiles.");
      }
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const renderTab = () => {
    if (showTokenStore) {
      return <TokenStore user={user} onUpdateUser={handleUpdateUser} onBack={() => setShowTokenStore(false)} language={language} />;
    }
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard budget={budget} setBudget={handleUpdateBudget} medicalProfile={medicalProfile} user={user} language={language} />;
      case 'upload':
        return <MedicalUpload medicalProfile={medicalProfile} onDataParsed={handleUpdateMedicalProfile} language={language} />;
      case 'scanner':
        return <Scanner medicalProfile={medicalProfile} user={user} onUpdateUser={handleUpdateUser} language={language} />;
      case 'meals':
        return <MealDisplay budget={budget} medicalProfile={medicalProfile} user={user} onUpdateUser={handleUpdateUser} language={language} />;
      case 'fitness':
        return <Fitness user={user} medicalProfile={medicalProfile} onUpdateUser={handleUpdateUser} language={language} />;
      case 'profile':
        return <Profile user={user} onUpdate={handleUpdateUser} language={language} />;
      default:
        return <Dashboard budget={budget} setBudget={handleUpdateBudget} medicalProfile={medicalProfile} user={user} language={language} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: Home },
    { id: 'profile', label: t.profile, icon: User },
    { id: 'upload', label: t.medical, icon: FileText },
    { id: 'scanner', label: t.scanner, icon: ScanLine },
    { id: 'meals', label: t.meals, icon: Utensils },
    { id: 'fitness', label: t.fitness, icon: Dumbbell },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 to-slate-100 flex flex-col font-sans text-slate-800 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-purple-600 text-white shadow-md rounded-b-2xl mx-2 mt-2 px-6 py-4 flex justify-between items-center relative gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowTokenStore(true)}
            className="bg-purple-700 hover:bg-amber-500 hover:text-white p-2 rounded-xl transition-all flex items-center gap-2 relative z-10 font-bold"
          >
            <Coins className="w-5 h-5 text-amber-300" />
            <span>{user?.tokens || 0}</span>
          </button>
          <div className="relative z-20">
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1 bg-purple-700 hover:bg-purple-800 p-2 rounded-xl transition text-sm font-bold uppercase"
            >
              <Globe className="w-5 h-5" />
              <span className="hidden sm:inline">{language}</span>
            </button>
            {isLangOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)}></div>
                <div className="absolute top-full mt-2 bg-white text-slate-800 rounded-xl shadow-lg border border-slate-100 overflow-hidden min-w-[120px] left-0 md:left-auto max-h-60 z-20">
                  <div className="py-1">
                    <button onClick={() => { setLanguage('en'); setIsLangOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium transition-colors" dir="ltr">🇬🇧 English</button>
                    <button onClick={() => { setLanguage('fr'); setIsLangOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium transition-colors" dir="ltr">🇫🇷 Français</button>
                    <button onClick={() => { setLanguage('ar'); setIsLangOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-slate-50 text-sm font-medium transition-colors" dir="rtl">🇲🇦 العربية</button>
                    <button onClick={() => { setLanguage('zgh'); setIsLangOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium transition-colors" dir="ltr">ⵣ ⵜⵉⴼⵉⵏⴰⵖ</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <div className="flex items-center gap-0.5">
            <Logo className="w-7 h-7 sm:w-8 sm:h-8 text-white relative bottom-0.5 drop-shadow-md" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight hidden sm:block pt-1">{t.appTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications Dropdown */}
          <div className="relative z-20">
            <button 
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                if (!isNotifOpen && unreadCount > 0) {
                  setUnreadCount(0);
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                }
              }}
              className="bg-purple-700 hover:bg-purple-800 p-2 rounded-full transition-colors flex items-center justify-center relative z-10"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full border border-purple-700"></span>}
            </button>

            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)}></div>
                <div className={`absolute top-full lg:right-0 mt-2 bg-white text-slate-800 rounded-xl shadow-lg border border-slate-100 overflow-hidden w-[280px] sm:w-80 max-h-96 z-50 flex flex-col right-0`}>
                  <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-sm">Notifications</h3>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifications.length > 0 ? notifications.map(notif => (
                      <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-purple-50/50' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${!notif.isRead ? 'bg-purple-600' : 'bg-transparent'}`}></div>
                          <div>
                            <h4 className="text-sm font-semibold">{notif.title}</h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 mt-2 block">{notif.time}</span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-6 text-center text-slate-500 text-sm">Aucune notification</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <button 
            onClick={handleLogout}
            className="bg-purple-700 hover:bg-red-500 p-2 rounded-full transition-colors flex items-center justify-center relative z-10"
            title="Log out"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 mb-24 md:mb-6">
        {renderTab()}
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-purple-100 pb-safe shadow-[0_-10px_40px_rgba(168,85,247,0.15)] pb-1">
        <nav className="flex justify-around p-1.5 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all flex-1 min-w-[3.5rem] relative ${
                  isActive ? 'text-purple-700' : 'text-slate-400 hover:text-purple-400'
                }`}
              >
                {isActive && (
                   <span className="absolute -top-1.5 w-10 h-1 bg-purple-600 rounded-b-full"></span>
                )}
                <div className={`p-1.5 rounded-xl mb-1 transition-all duration-300 ${isActive ? 'bg-purple-100 scale-110' : 'bg-transparent'}`}>
                  <Icon className={`w-6 h-6 sm:w-5 sm:h-5 ${isActive ? 'animate-bounce-short text-purple-700' : ''}`} />
                </div>
                <span className={`text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-center ${isActive ? 'text-purple-800' : 'text-slate-500'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Side Navigation for Desktop */}
      <div className={`hidden md:flex fixed top-24 flex-col gap-2 w-48 z-40 ${isRTL ? 'right-4' : 'left-4'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${isActive ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'} ${isRTL ? 'text-right flex-row-reverse' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
