import React, { useMemo, useState } from 'react';
import { Target, Activity, Flame, Dumbbell, CalendarDays, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { UserProfile, MedicalProfile } from '../types';
import { translations, Language } from '../translations';

interface FitnessProps {
  user: Partial<UserProfile>;
  medicalProfile: MedicalProfile;
  onUpdateUser: (user: Partial<UserProfile>) => void;
  language?: Language;
}

export default function Fitness({ user, medicalProfile, onUpdateUser, language = 'en' }: FitnessProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<{ exercises: any[], note?: string } | null>(user.fitnessPlan || null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  
  const t = translations[language];

  const bmi = useMemo(() => {
    if (user.weightKg && user.heightCm) {
      const heightM = user.heightCm / 100;
      return (user.weightKg / (heightM * heightM)).toFixed(1);
    }
    return null;
  }, [user.weightKg, user.heightCm]);

  const hasConstraints = useMemo(() => {
    const allConditions = [...medicalProfile.allergies, ...medicalProfile.conditions];
    const constraints = ['hypertension', 'diabetes', 'asthma', 'diabète'];
    return allConditions.some(cond => 
      constraints.some(c => cond.toLowerCase().includes(c))
    );
  }, [medicalProfile]);

  const handleGenerateFitness = async () => {
    if ((user.tokens || 0) < 1) {
       setError("Not enough tokens to generate a new fitness plan. Please earn tokens by reviewing products or purchase more in the Token Store.");
       return;
    }

    setLoading(true);
    setError(null);
    setGeneratedPlan(null);
    setCompletedExercises(new Set());

    try {
      const res = await fetch('/api/generate-fitness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: user,
          medical_profile: medicalProfile,
          language: language
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate fitness plan');
      }

      const data = await res.json();
      setGeneratedPlan(data);
      
      // Deduct token on success and save the plan
      onUpdateUser({
         ...user,
         tokens: (user.tokens || 0) - 1,
         fitnessPlan: data
      });
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating your fitness plan.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = (idx: number) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  const getDefaultIcon = (intensity: string) => {
    if (intensity === 'Low') return Activity;
    if (intensity === 'High') return Flame;
    return Dumbbell;
  };

  const getIntensityColor = (intensity: string) => {
    if (intensity === 'Low') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (intensity === 'Moderate') return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-800 p-8 rounded-3xl text-white shadow-lg overflow-hidden relative">
        <Target className="absolute top-8 right-8 w-24 h-24 text-slate-700 opacity-50" />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Smart Fitness Plan</h2>
          <p className="text-slate-300 text-sm max-w-md">
            AI-adapted workouts based on your BMI, medical constraints, and personal fitness goals.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <h3 className="text-sm font-bold uppercase text-slate-400 mb-2">Body Mass Index (BMI)</h3>
          {bmi ? (
            <div>
              <span className="text-4xl font-bold text-slate-800">{bmi}</span>
              <span className="text-sm text-slate-500 ml-2">kg/m²</span>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Update weight and height in Profile to calculate BMI.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold uppercase text-slate-400 mb-3">Primary Goal</h3>
          <div className="flex flex-col gap-2">
            {['Weight Loss', 'Muscle Gain', 'Maintenance'].map((goal) => (
              <button
                key={goal}
                onClick={() => onUpdateUser({ ...user, fitnessGoal: goal as any })}
                className={`py-2 px-4 rounded-xl text-sm font-bold transition-all text-left border ${
                  user.fitnessGoal === goal
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
             <h3 className="text-xl font-bold text-slate-800">{t.workoutTitle}</h3>
             {generatedPlan?.note && (
                <p className="text-sm text-slate-500 mt-1 max-w-md">{generatedPlan.note}</p>
             )}
          </div>
          {hasConstraints && !generatedPlan && (
            <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-lg text-xs font-bold border border-yellow-200">
              Adapted for Medical Profile
            </span>
          )}
        </div>

        {!generatedPlan && !loading && (
           <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                 <Sparkles className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 mb-2">{t.readyForFitness}</h4>
              <p className="text-slate-500 text-sm max-w-sm mb-6">
                 Click the button below to let our AI generate a personalized, safe, and effective workout plan for today based on your profile.
              </p>
              <button 
                onClick={handleGenerateFitness}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition flex items-center gap-2"
              >
                 {t.generateFitness}
              </button>
           </div>
        )}

        {loading && (
           <div className="py-12 flex flex-col items-center justify-center text-center animate-pulse">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">{t.processing}</p>
           </div>
        )}

        {error && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
        )}

        {generatedPlan && !loading && (
            <div className="space-y-4">
              {generatedPlan.exercises.map((ex, idx) => {
                const isCompleted = completedExercises.has(idx);
                const Icon = getDefaultIcon(ex.intensity);
                
                return (
                  <div 
                     key={idx} 
                     onClick={() => toggleExercise(idx)}
                     className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                        isCompleted ? 'bg-indigo-50 border-indigo-200 opacity-70' : 'bg-slate-50 border-slate-100 hover:border-indigo-300'
                     }`}
                  >
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${
                       isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold transition-colors ${isCompleted ? 'text-indigo-900 line-through' : 'text-slate-800'}`}>
                         {ex.name}
                      </h4>
                      <p className="text-sm text-slate-500">{ex.duration} minutes</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getIntensityColor(ex.intensity)}`}>
                      {ex.intensity}
                    </span>
                  </div>
                );
              })}
              
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleGenerateFitness}
                  className="text-indigo-600 font-bold text-sm hover:underline"
                >
                   {t.regenerateFitness}
                </button>
              </div>
            </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Workout History</h3>
            <p className="text-sm text-slate-500">Last 7 Days Activity</p>
          </div>
        </div>

        <div className="flex items-end justify-between h-40 mt-8 mb-2 px-2">
          {[
            { day: 'Mon', minutes: 45, completed: true },
            { day: 'Tue', minutes: 30, completed: true },
            { day: 'Wed', minutes: 0, completed: false },
            { day: 'Thu', minutes: 60, completed: true },
            { day: 'Fri', minutes: 45, completed: true },
            { day: 'Sat', minutes: 0, completed: false },
            { day: 'Sun', minutes: 20, completed: true }
          ].map((item, idx) => {
            const maxHeight = 60;
            const heightPercent = item.minutes > 0 ? Math.max((item.minutes / maxHeight) * 100, 15) : 0;
            
            return (
              <div key={idx} className="flex flex-col items-center gap-2 group">
                <div className="relative flex justify-center w-10 h-32 bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className={`absolute bottom-0 w-full rounded-full transition-all duration-500 ${item.completed ? 'bg-indigo-500 group-hover:bg-indigo-400' : 'bg-slate-200'}`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className={`text-xs font-bold ${item.completed ? 'text-slate-700' : 'text-slate-400'}`}>
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
