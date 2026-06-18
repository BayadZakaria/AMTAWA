import React from 'react';
import { Medal, Wallet, Activity, CalendarDays, CheckCircle2 } from 'lucide-react';
import type { UserProfile, MedicalProfile } from '../types';

interface AchievementCardProps {
  user?: Partial<UserProfile>;
  medicalProfile: MedicalProfile;
}

export default function AchievementCard({ user, medicalProfile }: AchievementCardProps) {
  // Determine earned badges logic
  const hasBudgetBadge = user?.dailyBudgetMAD && user.dailyBudgetMAD > 0;
  const hasFitnessBadge = user?.fitnessGoal;
  const hasHealthProfileBadge = medicalProfile.allergies.length > 0 || medicalProfile.conditions.length > 0;

  const badges = [
    {
      id: 'budget',
      title: 'Budget Planner',
      description: 'Set a daily meal budget.',
      icon: Wallet,
      earned: hasBudgetBadge,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'fitness',
      title: 'Consistent Exerciser',
      description: 'Selected a fitness goal.',
      icon: CalendarDays,
      earned: hasFitnessBadge,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      id: 'health',
      title: 'Health Aware',
      description: 'Tracked medical profile.',
      icon: Activity,
      earned: hasHealthProfileBadge,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
          <Medal className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-800">Your Achievements</h3>
          <p className="text-sm text-slate-500">Milestones unlocked towards a healthier life.</p>
        </div>
      </div>
      
      <div className="grid gap-3">
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div 
              key={badge.id}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                badge.earned 
                  ? `bg-white border-slate-200 shadow-sm` 
                  : 'bg-slate-50 border-slate-100 opacity-60 grayscale'
              }`}
            >
              <div className={`p-3 rounded-xl flex-shrink-0 ${badge.earned ? `${badge.bgColor} ${badge.color}` : 'bg-slate-200 text-slate-400'}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-bold ${badge.earned ? 'text-slate-800' : 'text-slate-500'}`}>
                  {badge.title}
                </h4>
                <p className="text-xs text-slate-500">{badge.description}</p>
              </div>
              {badge.earned && (
                <div className="text-amber-500">
                  <CheckCircle2 className="w-5 h-5 fill-current text-white bg-amber-500 rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
