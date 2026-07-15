import React, { useState } from 'react';
import { User, Activity, Edit2, Save, Scale, ArrowUpCircle, Calendar } from 'lucide-react';
import type { UserProfile } from '../types';
import { translations, Language } from '../translations';

interface ProfileProps {
  user: Partial<UserProfile>;
  onUpdate: (user: Partial<UserProfile>) => void;
  language?: Language;
}

export default function Profile({ user, onUpdate, language = 'en' }: ProfileProps) {
  const t = translations[language];
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    age: user.age || '',
    weightKg: user.weightKg || '',
    heightCm: user.heightCm || '',
  });

  React.useEffect(() => {
    setFormData({
      name: user.name || '',
      age: user.age || '',
      weightKg: user.weightKg || '',
      heightCm: user.heightCm || '',
    });
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...user,
      name: formData.name,
      age: formData.age ? Number(formData.age) : undefined,
      weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
      heightCm: formData.heightCm ? Number(formData.heightCm) : undefined,
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">My Profile</h2>
          <p className="text-slate-500 text-sm">
            Keep your biometric data updated. The AI uses this information to personalize your nutrition boundaries and adjust daily caloric needs.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-bold hover:bg-purple-100 transition"
          >
            <Edit2 className="w-4 h-4" /> Edit
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl">
              {formData.name.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold focus:border-purple-500 outline-none"
                />
              ) : (
                <p className="font-bold text-lg text-slate-800">{formData.name || 'Not specified'}</p>
              )}
              <p className="text-sm text-slate-500 mt-1">{user.email}</p>
            </div>
          </div>

          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> Biometrics
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Age */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
              <Calendar className="w-5 h-5 text-slate-400 absolute top-4 right-4" />
              <label className="block text-xs uppercase font-bold text-slate-400 mb-2">Age</label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-1 font-bold focus:border-purple-500 outline-none"
                  />
                  <span className="text-sm text-slate-500">years</span>
                </div>
              ) : (
                <p className="font-bold text-xl text-slate-800">
                  {formData.age ? `${formData.age} yrs` : '-'}
                </p>
              )}
            </div>

            {/* Weight */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
              <Scale className="w-5 h-5 text-slate-400 absolute top-4 right-4" />
              <label className="block text-xs uppercase font-bold text-slate-400 mb-2">Weight</label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.weightKg}
                    onChange={e => setFormData({ ...formData, weightKg: e.target.value })}
                    className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1 font-bold focus:border-purple-500 outline-none"
                    step="0.1"
                  />
                  <span className="text-sm text-slate-500">kg</span>
                </div>
              ) : (
                <p className="font-bold text-xl text-slate-800">
                  {formData.weightKg ? `${formData.weightKg} kg` : '-'}
                </p>
              )}
            </div>

            {/* Height */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
              <ArrowUpCircle className="w-5 h-5 text-slate-400 absolute top-4 right-4" />
              <label className="block text-xs uppercase font-bold text-slate-400 mb-2">Height</label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.heightCm}
                    onChange={e => setFormData({ ...formData, heightCm: e.target.value })}
                    className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1 font-bold focus:border-purple-500 outline-none"
                  />
                  <span className="text-sm text-slate-500">cm</span>
                </div>
              ) : (
                <p className="font-bold text-xl text-slate-800">
                  {formData.heightCm ? `${formData.heightCm} cm` : '-'}
                </p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {t.save}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
