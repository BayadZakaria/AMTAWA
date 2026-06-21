import React, { useState, useEffect } from 'react';
import { Clock, Download, Info, ShieldAlert, Utensils, Dumbbell } from 'lucide-react';
import type { UserProfile } from '../types';
import { translations, Language } from '../translations';

interface HistoryProps {
  user: Partial<UserProfile>;
  language?: Language;
}

export default function History({ user, language = 'en' }: HistoryProps) {
  const [activeTab, setActiveTab] = useState<'scans' | 'meals' | 'fitness'>('scans');
  const [historyData, setHistoryData] = useState<{ scans: any[]; meals: any[]; fitness: any[] }>({ scans: [], meals: [], fitness: [] });
  const [loading, setLoading] = useState(true);
  
  const t = translations[language];

  useEffect(() => {
    if (user?.id) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      const data = await res.json();
      setHistoryData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Clock className="w-6 h-6 text-purple-600" />
          {t.history || 'Historique'}
        </h2>

        {/* Local Navigation */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button 
            onClick={() => setActiveTab('scans')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'scans' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Info className="w-4 h-4" />
            Scans
          </button>
          <button 
            onClick={() => setActiveTab('meals')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'meals' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Utensils className="w-4 h-4" />
            {t.meals || 'Repas'}
          </button>
          <button 
            onClick={() => setActiveTab('fitness')}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'fitness' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Dumbbell className="w-4 h-4" />
            {t.fitness || 'Fitness'}
          </button>
        </div>

        {/* Content Display */}
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Scans Tab */}
            {activeTab === 'scans' && (
              historyData.scans.length > 0 ? historyData.scans.map((scan, i) => (
                <div key={i} className="flex gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                  {scan.image ? (
                    <img src={scan.image} alt={scan.productName} className="w-16 h-16 object-cover rounded-xl bg-white" />
                  ) : <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-slate-100"><Info className="text-slate-300 w-8 h-8" /></div>}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800">{scan.productName || scan.barcode}</h3>
                      <span className="text-xs text-slate-400">{formatDate(scan.date)}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                       <span className={`px-2 py-1 text-xs font-bold rounded-lg uppercase ${
                         scan.nutriscore === 'A' || scan.nutriscore === 'B' ? 'bg-green-100 text-green-700' :
                         scan.nutriscore === 'C' ? 'bg-yellow-100 text-yellow-700' :
                         'bg-red-100 text-red-700'
                       }`}>
                         Score: {scan.nutriscore}
                       </span>
                    </div>
                    {scan.warnings && scan.warnings.length > 0 && (
                      <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4" /> {scan.warnings[0]}
                      </div>
                    )}
                  </div>
                </div>
              )) : <div className="text-center text-slate-500 py-10">Aucun scan enregistré.</div>
            )}

            {/* Meals Tab */}
            {activeTab === 'meals' && (
              historyData.meals.length > 0 ? historyData.meals.map((meal, i) => (
                <div key={i} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{formatDate(meal.date)}</span>
                     <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{meal.totalCostMAD} MAD</span>
                   </div>
                   <div className="space-y-3">
                     {meal.breakfast && meal.breakfast[0] && <div className="text-sm"><strong className="text-purple-700">Breakfast:</strong> {meal.breakfast[0].name}</div>}
                     {meal.lunch && meal.lunch[0] && <div className="text-sm"><strong className="text-emerald-700">Lunch:</strong> {meal.lunch[0].name}</div>}
                     {meal.dinner && meal.dinner[0] && <div className="text-sm"><strong className="text-indigo-700">Dinner:</strong> {meal.dinner[0].name}</div>}
                   </div>
                </div>
              )) : <div className="text-center text-slate-500 py-10">Aucun repas généré.</div>
            )}

            {/* Fitness Tab */}
            {activeTab === 'fitness' && (
              historyData.fitness.length > 0 ? historyData.fitness.map((plan, i) => (
                <div key={i} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{formatDate(plan.date)}</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.exercises?.slice(0, 3).map((ex: any, idx: number) => (
                      <li key={idx} className="text-sm flex justify-between">
                         <span className="text-slate-700">{ex.name}</span>
                         <span className="text-slate-500 font-medium">{ex.duration} min</span>
                      </li>
                    ))}
                    {plan.exercises?.length > 3 && <li className="text-xs text-slate-400 italic">...et +{plan.exercises.length - 3} autres</li>}
                  </ul>
                  {plan.note && <div className="mt-3 text-xs text-slate-500 bg-white p-2 rounded border border-slate-100">{plan.note}</div>}
                </div>
              )) : <div className="text-center text-slate-500 py-10">Aucun plan fitness généré.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
