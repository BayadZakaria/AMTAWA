import React, { useState } from 'react';
import { CheckCircle2, Edit3, Plus } from 'lucide-react';
import type { MedicalProfile } from '../types';
import { translations, Language } from '../translations';

interface MedicalUploadProps {
  medicalProfile?: MedicalProfile;
  onDataParsed: (data: MedicalProfile) => void;
  language?: Language;
}

export default function MedicalUpload({ medicalProfile, onDataParsed, language = 'en' }: MedicalUploadProps) {
  const t = translations[language];

  // Manual state
  const commonConditions = [
    'Type 2 Diabetes', 'Hypertension', 'High Cholesterol', 'Asthma', 
    'Heart Disease', 'Thyroid Disorder', 'Arthritis', 'Celiac Disease',
    'Chronic Kidney Disease', 'COPD'
  ];
  const commonAllergies = [
    'Peanuts', 'Lactose', 'Gluten', 'Shellfish', 'Soy', 
    'Tree Nuts', 'Eggs', 'Fish', 'Wheat', 'Sesame', 'Penicillin'
  ];

  const [manualConditions, setManualConditions] = useState<string[]>(medicalProfile?.conditions || []);
  const [manualAllergies, setManualAllergies] = useState<string[]>(medicalProfile?.allergies || []);
  const [customCondition, setCustomCondition] = useState('');
  const [customAllergy, setCustomAllergy] = useState('');

  // Re-sync if the props update
  React.useEffect(() => {
    if (medicalProfile) {
      setManualConditions(medicalProfile.conditions || []);
      setManualAllergies(medicalProfile.allergies || []);
    }
  }, [medicalProfile]);

  const toggleCondition = (cond: string) => {
    setManualConditions(prev => prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]);
  };

  const toggleAllergy = (alg: string) => {
    setManualAllergies(prev => prev.includes(alg) ? prev.filter(c => c !== alg) : [...prev, alg]);
  };

  const addCustomCondition = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (customCondition.trim() && !manualConditions.includes(customCondition.trim())) {
      setManualConditions([...manualConditions, customCondition.trim()]);
    }
    setCustomCondition('');
  };

  const addCustomAllergy = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (customAllergy.trim() && !manualAllergies.includes(customAllergy.trim())) {
      setManualAllergies([...manualAllergies, customAllergy.trim()]);
    }
    setCustomAllergy('');
  };

  const [saved, setSaved] = useState(false);

  const saveManualProfile = () => {
    const profile = { 
      conditions: manualConditions, 
      allergies: manualAllergies,
      documents: medicalProfile?.documents || []
    };
    onDataParsed(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const texts = {
    en: {
      title: "Guided Manual Entry",
      desc: "Select common conditions or add your own custom records to build your medical profile.",
      conditions: "Conditions",
      allergies: "Allergies & Intolerances",
      condPlaceholder: "e.g. Migraine",
      algPlaceholder: "e.g. Cinnamon",
      save: "Save Profile"
    },
    fr: {
      title: "Saisie Manuelle Guidée",
      desc: "Sélectionnez des conditions courantes ou ajoutez vos propres dossiers pour créer votre profil médical.",
      conditions: "Conditions Médicales",
      allergies: "Allergies & Intolérances",
      condPlaceholder: "ex: Migraine",
      algPlaceholder: "ex: Cannelle",
      save: "Enregistrer le Profil"
    },
    ar: {
      title: "إدخال يدوي موجه",
      desc: "حدد الحالات الشائعة أو أضف سجلاتك الخاصة لبناء ملفك الطبي.",
      conditions: "الحالات الطبية",
      allergies: "الحساسية وعدم التحمل",
      condPlaceholder: "مثال: الصداع النصفي",
      algPlaceholder: "مثال: القرفة",
      save: "حفظ الملف"
    },
    zgh: {
      title: "ⴰⵙⴽⵛⵎ ⵙ ⵓⴼⵓⵙ",
      desc: "ⵙⵜⵉ ⵜⵉⵏⴰⵖⵉⵏ ⵏⵖ ⵔⵏⵓ ⵜⵉⵏⵏⴽ ⴰⴼⴰⴷ ⴰⴷ ⵜⵙⴽⵔⴷ ⴰⵎⵙⴰⵙⴼⴰⵔ ⵏⵏⴽ.",
      conditions: "ⵜⵉⵏⴰⵖⵉⵏ",
      allergies: "ⴰⵍⵉⵔⵊⵉ ⴷ ⵓⵔⵎⵙ",
      condPlaceholder: "ⴰⵎⴷⵢⴰ: ⴰⵣⴰⵜⵉ ⵏ ⵓⴳⴰⵢⵢⵓ",
      algPlaceholder: "ⴰⵎⴷⵢⴰ: ⴽⴰⵏⴻⵍ",
      save: "ⵃⴹⵓ ⴰⵙⴰⵔⵓ"
    }
  };

  const currentText = texts[language] || texts.en;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-[fadeIn_0.3s_ease-out]">
        <div className="mb-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <Edit3 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-1">{currentText.title}</h2>
            <p className="text-slate-500 text-sm">{currentText.desc}</p>
          </div>
        </div>

        <div className="space-y-10 mt-8">
          {/* Conditions Section */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 block flex items-center gap-2">
              <span className="w-6 h-px bg-slate-200"></span>
              {currentText.conditions}
              <span className="flex-1 h-px bg-slate-200"></span>
            </h3>
            <div className="flex flex-wrap gap-2.5 mb-5">
              {[...new Set([...commonConditions, ...manualConditions])].map((cond, idx) => {
                const isSelected = manualConditions.includes(cond);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleCondition(cond)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {cond}
                    {isSelected && <CheckCircle2 className="w-4 h-4 inline ml-2 text-blue-100" />}
                  </button>
                );
              })}
            </div>
            <form onSubmit={addCustomCondition} className="flex gap-3">
              <input
                type="text"
                value={customCondition}
                onChange={e => setCustomCondition(e.target.value)}
                placeholder={currentText.condPlaceholder}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-medium transition-all"
              />
              <button type="submit" className="bg-slate-100 px-5 rounded-xl text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors font-bold flex items-center gap-2" disabled={!customCondition.trim()}>
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Allergies Section */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 block flex items-center gap-2">
              <span className="w-6 h-px bg-slate-200"></span>
              {currentText.allergies}
              <span className="flex-1 h-px bg-slate-200"></span>
            </h3>
            <div className="flex flex-wrap gap-2.5 mb-5">
              {[...new Set([...commonAllergies, ...manualAllergies])].map((alg, idx) => {
                const isSelected = manualAllergies.includes(alg);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleAllergy(alg)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      isSelected 
                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {alg}
                    {isSelected && <CheckCircle2 className="w-4 h-4 inline ml-2 text-orange-100" />}
                  </button>
                );
              })}
            </div>
            <form onSubmit={addCustomAllergy} className="flex gap-3">
              <input
                type="text"
                value={customAllergy}
                onChange={e => setCustomAllergy(e.target.value)}
                placeholder={currentText.algPlaceholder}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-sm font-medium transition-all"
              />
              <button type="submit" className="bg-slate-100 px-5 rounded-xl text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors font-bold flex items-center gap-2" disabled={!customAllergy.trim()}>
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={saveManualProfile}
              className={`w-full text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-slate-900/20 ${saved ? 'bg-green-600 hover:bg-green-700 shadow-lg' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-lg'}`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {saved ? t.saved : currentText.save}
            </button>
            
            {(manualConditions.length > 0 || manualAllergies.length > 0) && (
              <div className="mt-6 pt-6 border-t border-slate-100 text-sm">
                {manualConditions.length > 0 && (
                  <div className="mb-3">
                    <strong className="text-slate-600 block mb-1">{currentText.conditions}:</strong> 
                    <span className="text-slate-800 font-medium">{manualConditions.join(', ')}</span>
                  </div>
                )}
                {manualAllergies.length > 0 && (
                  <div>
                    <strong className="text-slate-600 block mb-1">{currentText.allergies}:</strong> 
                    <span className="text-slate-800 font-medium">{manualAllergies.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
