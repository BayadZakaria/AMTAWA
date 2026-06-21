import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, Loader2, Image as ImageIcon, Edit3, Plus, X, Camera, FileText, Trash2 } from 'lucide-react';
import type { MedicalProfile } from '../types';
import { translations, Language } from '../translations';

interface MedicalUploadProps {
  medicalProfile?: MedicalProfile;
  onDataParsed: (data: MedicalProfile) => void;
  language?: Language;
}

export default function MedicalUpload({ medicalProfile, onDataParsed, language = 'en' }: MedicalUploadProps) {
  // If we already have data, default to manual mode to show it. Otherwise scan.
  const [activeMode, setActiveMode] = useState<'scan' | 'manual'>(
    medicalProfile && (medicalProfile.allergies.length > 0 || medicalProfile.conditions.length > 0) ? 'manual' : 'scan'
  );
  
  const t = translations[language];

  // OCR state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedicalProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual state
  const commonConditions = ['Type 2 Diabetes', 'Hypertension', 'High Cholesterol', 'Asthma'];
  const commonAllergies = ['Peanuts', 'Lactose', 'Gluten', 'Shellfish'];

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

  const saveManualProfile = () => {
    const profile = { 
      conditions: manualConditions, 
      allergies: manualAllergies,
      documents: medicalProfile?.documents || []
    };
    setResult(profile);
    onDataParsed(profile);
  };

  const simulateBase64Encode = (file: File): Promise<string> => {
       return new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.readAsDataURL(file);
         reader.onload = () => {
             const base64String = reader.result as string;
             // Remove the data:image/jpeg;base64, prefix
             const commaIndex = base64String.indexOf(',');
             resolve(base64String.substring(commaIndex + 1));
         };
         reader.onerror = error => reject(error);
       });
   };

  const deleteDocument = (id: string) => {
    if (!medicalProfile) return;
    const newDocs = (medicalProfile.documents || []).filter(d => d.id !== id);
    const newProfile = { ...medicalProfile, documents: newDocs };
    onDataParsed(newProfile);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64Data = await simulateBase64Encode(file);

      const response = await fetch('https://amtawa-1.onrender.com/api/parse-medical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
           image_base64: base64Data,
           mime_type: file.type,
           language: language
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server error during parsing');
      
      const newDoc = {
        id: crypto.randomUUID(),
        name: file.name || 'Scanned Document',
        date: new Date().toISOString()
      };

      const mergedProfile = {
        allergies: Array.from(new Set([...(medicalProfile?.allergies || []), ...(data.allergies || [])])),
        conditions: Array.from(new Set([...(medicalProfile?.conditions || []), ...(data.conditions || [])])),
        documents: [...(medicalProfile?.documents || []), newDoc]
      };

      setResult(mergedProfile);
      onDataParsed(mergedProfile);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Uploaded Documents */}
      {medicalProfile?.documents && medicalProfile.documents.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-sm font-bold uppercase text-slate-400 mb-4 block">Medical Documents</h2>
          <div className="space-y-3">
            {medicalProfile.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-500">{new Date(doc.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mb-6">
        <button
          onClick={() => setActiveMode('scan')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeMode === 'scan' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <UploadCloud className="w-4 h-4" /> {t.scanDocument}
        </button>
        <button
          onClick={() => setActiveMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeMode === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Edit3 className="w-4 h-4" /> {t.manualEntry}
        </button>
      </div>

      {activeMode === 'scan' ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center animate-[fadeIn_0.3s_ease-out]">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
             <UploadCloud className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{t.uploadMedical}</h2>
          <p className="text-slate-500 text-sm mb-8">
             Upload a prescription or medical record. The backend Gemini model will extract chronic conditions and allergies automatically using OCR + NLP.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="relative cursor-pointer group">
              <div className="w-full flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-slate-200 rounded-2xl group-hover:bg-slate-50 group-hover:border-blue-300 transition-all h-full">
                 {loading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                 ) : (
                    <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                 )}
                 <span className="text-sm font-medium text-slate-600">
                   {loading ? 'Analyzing...' : 'Upload Document'}
                 </span>
                 <span className="text-xs text-slate-400 mt-1">Image or PDF</span>
              </div>
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                className="hidden" 
                onChange={handleFileUpload} 
                disabled={loading}
              />
            </label>
            
            <label className="relative cursor-pointer group">
              <div className="w-full flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-slate-200 rounded-2xl group-hover:bg-slate-50 group-hover:border-blue-300 transition-all h-full">
                 {loading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                 ) : (
                    <Camera className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                 )}
                 <span className="text-sm font-medium text-slate-600">
                   {loading ? 'Analyzing...' : 'Take a Photo'}
                 </span>
                 <span className="text-xs text-slate-400 mt-1">Use your camera</span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                onChange={handleFileUpload} 
                disabled={loading}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-[fadeIn_0.3s_ease-out]">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Guided Manual Entry</h2>
            <p className="text-slate-500 text-sm">Select common conditions or add your own custom records.</p>
          </div>

          <div className="space-y-8">
            {/* Conditions Section */}
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 block">Conditions</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {[...new Set([...commonConditions, ...manualConditions])].map((cond, idx) => {
                  const isSelected = manualConditions.includes(cond);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleCondition(cond)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {cond}
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 inline ml-2" />}
                    </button>
                  );
                })}
              </div>
              <form onSubmit={addCustomCondition} className="flex gap-2">
                <input
                  type="text"
                  value={customCondition}
                  onChange={e => setCustomCondition(e.target.value)}
                  placeholder="e.g. Celiac Disease"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-sm"
                />
                <button type="submit" className="bg-slate-100 p-2.5 rounded-xl text-slate-600 hover:bg-slate-200" disabled={!customCondition.trim()}>
                  <Plus className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Allergies Section */}
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 block">Allergies & Intolerances</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {[...new Set([...commonAllergies, ...manualAllergies])].map((alg, idx) => {
                  const isSelected = manualAllergies.includes(alg);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleAllergy(alg)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                        isSelected 
                          ? 'bg-orange-50 border-orange-200 text-orange-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {alg}
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 inline ml-2" />}
                    </button>
                  );
                })}
              </div>
              <form onSubmit={addCustomAllergy} className="flex gap-2">
                <input
                  type="text"
                  value={customAllergy}
                  onChange={e => setCustomAllergy(e.target.value)}
                  placeholder="e.g. Soy"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 text-sm"
                />
                <button type="submit" className="bg-slate-100 p-2.5 rounded-xl text-slate-600 hover:bg-slate-200" disabled={!customAllergy.trim()}>
                  <Plus className="w-5 h-5" />
                </button>
              </form>
            </div>

            <button
              onClick={saveManualProfile}
              className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition"
            >
              Save Profile
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium text-center">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="text-purple-500 w-6 h-6" />
            <h3 className="font-bold text-slate-800">Extraction Successful</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold uppercase text-slate-400 block mb-2">Found Allergies</span>
              {result.allergies?.length > 0 ? (
                 <ul className="space-y-1">
                   {result.allergies.map((val, idx) => <li key={idx} className="font-medium text-slate-700 before:content-['•'] before:mr-2 before:text-blue-400">{val}</li>)}
                 </ul>
              ) : <span className="text-sm text-slate-400 italic">None detected</span>}
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold uppercase text-slate-400 block mb-2">Conditions</span>
              {result.conditions?.length > 0 ? (
                 <ul className="space-y-1">
                   {result.conditions.map((val, idx) => <li key={idx} className="font-medium text-slate-700 before:content-['•'] before:mr-2 before:text-orange-400">{val}</li>)}
                 </ul>
              ) : <span className="text-sm text-slate-400 italic">None detected</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
