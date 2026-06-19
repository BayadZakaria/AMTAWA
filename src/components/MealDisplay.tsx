import React, { useState, useEffect, useRef } from 'react';
import { Network, Utensils, Receipt, CheckCircle, ChevronRight } from 'lucide-react';
import type { MedicalProfile, MealPlan, UserProfile } from '../types';
import { translations, Language } from '../translations';

interface MealDisplayProps {
  budget: number;
  medicalProfile: MedicalProfile;
  user: Partial<UserProfile>;
  onUpdateUser: (user: Partial<UserProfile>) => void;
  language?: Language;
}

export default function MealDisplay({ budget, medicalProfile, user, onUpdateUser, language = 'en' }: MealDisplayProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<MealPlan | null>(user.mealPlan || null);
  const [error, setError] = useState<string | null>(null);
  const [needsOptimization, setNeedsOptimization] = useState(false);
  
  const t = translations[language];
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setNeedsOptimization(true);
  }, [medicalProfile]);

  const generateMeals = async () => {
    if ((user.tokens || 0) < 1) {
       setError("Not enough tokens to generate a new meal plan. Please earn tokens by reviewing products or purchase more in the Token Store.");
       return;
    }

    setLoading(true);
    setError(null);
    setNeedsOptimization(false);
    try {
      const response = await fetch('/api/generate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          budgetMAD: budget,
          conditions: [...medicalProfile.allergies, ...medicalProfile.conditions],
          userBiometrics: user ? {
            age: user.age,
            weightKg: user.weightKg,
            heightCm: user.heightCm
          } : null,
          language
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setPlan(data);
      
      onUpdateUser({
         ...user,
         tokens: (user.tokens || 0) - 1,
         mealPlan: data
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMealSection = (title: string, items: {name: string, costMAD: number, calories: number}[]) => (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
        <h4 className="font-bold text-slate-700 capitalize flex items-center gap-2 mb-4">
           {title} <ChevronRight className="w-4 h-4 text-slate-300" />
        </h4>
        <div className="space-y-3">
          {items?.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
               <div>
                  <span className="block font-semibold text-slate-800 text-sm">{item.name}</span>
                  <span className="text-xs text-slate-500">{item.calories} kcal</span>
               </div>
               <span className="text-purple-700 font-bold bg-purple-100 px-3 py-1 rounded-lg text-sm">
                  {item.costMAD} MAD
               </span>
            </div>
          ))}
        </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div className="bg-gradient-to-br from-purple-800 to-purple-950 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10">
           <Network className="w-32 h-32" />
         </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">{t.readyForMeals}</h2>
            <p className="text-purple-100 text-sm max-w-md opacity-90 leading-relaxed mb-6">
              Emulating the Python mathematical optimization. 
              Finds the optimal set of local Moroccan market items strictly under your budget limit and fulfilling health criteria.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-purple-900/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-purple-700 flex items-center gap-3">
                 <Receipt className="w-5 h-5 text-purple-300" />
                 <div>
                    <span className="block text-xs uppercase tracking-widest text-purple-400 font-bold">Hard Limit</span>
                    <span className="text-xl font-mono font-bold">{budget} MAD</span>
                 </div>
              </div>
              <button 
                onClick={generateMeals}
                disabled={loading}
                className={`text-purple-900 font-bold px-8 py-4 rounded-2xl hover:bg-purple-50 transition shadow-xl disabled:opacity-75 flex items-center gap-2 ${
                  needsOptimization && !loading 
                    ? 'bg-purple-100 animate-pulse ring-4 ring-purple-400/50' 
                    : 'bg-white'
                }`}
              >
                {loading ? <Network className="w-5 h-5 animate-spin" /> : <Utensils className="w-5 h-5" />}
                {loading ? t.processing : t.generateMeals}
              </button>
            </div>
         </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center text-sm font-medium">{error}</div>
      )}

      {plan && (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
           
           <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-bold text-slate-800">{t.mealPlanTitle}</h3>
              <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl">
                 <span className="text-xs uppercase font-bold text-slate-400">Final Cost</span>
                 <span className="font-mono font-bold tracking-tight">{plan.totalCostMAD} MAD</span>
              </div>
           </div>

           <div className="grid md:grid-cols-3 gap-4">
             {renderMealSection('breakfast', plan.breakfast)}
             {renderMealSection('lunch', plan.lunch)}
             {renderMealSection('dinner', plan.dinner)}
           </div>

           {plan.totalCostMAD <= budget ? (
             <div className="flex items-center gap-2 text-purple-600 justify-center pb-8 pt-4">
               <CheckCircle className="w-5 h-5" />
               <span className="font-bold text-sm">Constraint satisfied constraint: Output {plan.totalCostMAD} &lt;= {budget} MAD</span>
             </div>
           ) : (
             <div className="text-center text-red-500 font-bold pt-4 text-sm">
                Optimization warning: Estimated cost exceeded budget. Try adjusting values.
             </div>
           )}
        </div>
      )}
    </div>
  );
}
