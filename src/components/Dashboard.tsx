import React from 'react';
import { Activity, Wallet, AlertCircle } from 'lucide-react';
import type { MedicalProfile, UserProfile } from '../types';
import AchievementCard from './AchievementCard';
import { translations, Language } from '../translations';

interface DashboardProps {
  budget: number;
  setBudget: (val: number) => void;
  medicalProfile: MedicalProfile;
  user?: Partial<UserProfile>;
  language?: Language;
}

export default function Dashboard({ budget, setBudget, medicalProfile, user, language = 'en' }: DashboardProps) {
  const t = translations[language];
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-purple-700 to-purple-900 rounded-[2.5rem] p-8 shadow-xl text-white mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative z-10">
           <h2 className="text-3xl font-bold mb-2">Bienvenue{user?.name ? `, ${user.name.split(' ')[0]}` : ''}&nbsp;!</h2>
           <p className="text-purple-200 text-lg">Voici un aperçu de votre profil de santé intelligent.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Budget Tracker */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-purple-600">
            <div className="p-3 bg-purple-50 rounded-2xl">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg text-slate-800">{t.dailyBudget}</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-2">
            <p className="text-4xl font-bold text-slate-800">{budget} <span className="text-lg text-slate-400 font-medium">MAD</span></p>
            <div className="flex items-center mt-2">
               <input 
                 type="range" 
                 min="10" 
                 max="200" 
                 value={budget} 
                 onChange={(e) => setBudget(parseInt(e.target.value))}
                 className="w-full accent-purple-500 rounded-lg"
               />
            </div>
          </div>
        </div>

        {/* Medical Profile Summary */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
             <div className="p-3 bg-blue-50 rounded-2xl">
              <Activity className="w-6 h-6" />
             </div>
            <h3 className="font-semibold text-lg text-slate-800">{t.healthAlerts}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Known Allergies</h4>
              {medicalProfile.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {medicalProfile.allergies.map((a, i) => (
                    <span key={i} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold border border-red-100 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">{t.noConditions}</p>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Conditions</h4>
              {medicalProfile.conditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {medicalProfile.conditions.map((c, i) => (
                    <span key={i} className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold border border-orange-100 flex items-center gap-1">
                       <Activity className="w-3 h-3" /> {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">{t.noConditions}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <AchievementCard user={user} medicalProfile={medicalProfile} />
    </div>
  );
}
