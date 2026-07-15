import React, { useState, useRef } from 'react';
import { Search, ShieldAlert, ShieldCheck, Tag, Star, Upload, Plus, MessageSquare, Camera, ArrowLeft, FlaskConical, Box, Flame, Fish, Wheat, Droplets, Info } from 'lucide-react';
import type { MedicalProfile, ProductScanResult, UserProfile } from '../types';
import { translations, Language } from '../translations';
import { supabase } from '../lib/supabase';

interface ScannerProps {
  medicalProfile: MedicalProfile;
  user: Partial<UserProfile>;
  onUpdateUser: (user: Partial<UserProfile>) => void;
  language?: Language;
}

export default function Scanner({ medicalProfile, user, onUpdateUser, language = 'en' }: ScannerProps) {
  const [barcode, setBarcode] = useState('3017620422003'); // Default Nutella barcode as mock
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProductScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language];
  
  // Custom Product Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newIngredients, setNewIngredients] = useState('');
  const [newImageBase64, setNewImageBase64] = useState('');
  const [addingProduct, setAddingProduct] = useState(false);
  const [isExtractingOCR, setIsExtractingOCR] = useState(false);

  // Review Form State
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanningImage, setScanningImage] = useState(false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startLiveCamera = async () => {
    setShowLiveCamera(true);
    setTimeout(async () => {
      try {
        let stream;
        try {
           stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'environment' } } });
        } catch (e) {
           stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        alert("Camera access error: " + err.message);
        setShowLiveCamera(false);
      }
    }, 100);
  };

  const stopLiveCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
         videoRef.current.srcObject = null;
    }
    setShowLiveCamera(false);
  };

  const captureLiveImage = () => {
    if (!videoRef.current) return;
    setScanningImage(true);
    
    // Create base canvas
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Scale it down
        const MAX_WIDTH = 1000;
        const scaleSize = Math.min(1, MAX_WIDTH / canvas.width);
        const outCanvas = document.createElement('canvas');
        outCanvas.width = canvas.width * scaleSize;
        outCanvas.height = canvas.height * scaleSize;
        const outCtx = outCanvas.getContext('2d');
        
        if (outCtx) {
           outCtx.drawImage(canvas, 0, 0, outCanvas.width, outCanvas.height);
           const compressedBase64 = outCanvas.toDataURL('image/jpeg', 0.8);
           processImageBase64(compressedBase64);
        } else {
           setScanningImage(false);
        }
    } else {
       setScanningImage(false);
    }
    stopLiveCamera();
  };

  const processImageBase64 = async (compressedBase64: string) => {
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/scan-barcode-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: compressedBase64 })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         throw new Error("Le serveur est en pause (Vercel/Render). Veuillez patienter 30 secondes et réessayer.");
      }

      const _text = await response.text();
      let data;
      try { data = JSON.parse(_text); } catch(e) { throw new Error(_text.slice(0, 50)); }
      if (!response.ok) throw new Error(data.error || 'Failed to read barcode from image');
      
      setBarcode(data.barcode);
      executeScan(data.barcode);
    } catch (err: any) {
      setError('Impossible de lire le code-barres. Essayez de bien le cadrer.');
    } finally {
      setScanningImage(false);
    }
  };

  const executeScan = async (barcodeToScan: string, silent = false) => {
    if (!barcodeToScan.trim()) return;

    if (!silent) {
      setLoading(true);
      setError(null);
      setResult(null);
      setShowAddForm(false);
    }

    try {
      // Pointing to Render backend for Hybrid Routing (V2)
      const response = await fetch('/api/scan-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: barcodeToScan,
          user_id: user.id,
          language: language
        })
      });

      const _text = await response.text();
      let data;
      try { data = JSON.parse(_text); } catch(e) { throw new Error(_text.slice(0, 50)); }
      if (!response.ok) {
        throw new Error(data.detail || data.error || "Erreur du serveur d'analyse.");
      }

      setResult(data);
      if (user.isMock || !supabase) {
        const hist = JSON.parse(localStorage.getItem(`mock_history_${user.id}`) || `{"scans":[],"meals":[],"fitness":[]}`);
        hist.scans.push({ ...data, date: new Date().toISOString() });
        localStorage.setItem(`mock_history_${user.id}`, JSON.stringify(hist));
      } else {
        await supabase.from('activity_history').insert({
          user_id: user.id,
          activity_type: 'scan',
          details: data
        });
      }
    } catch (err: any) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  React.useEffect(() => {
    if (result && result.barcode && !loading) {
      executeScan(result.barcode, true);
    }
  }, [language]);

  const handleBarcodeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningImage(true);
    setError(null);
    setResult(null);

    // Compress image client side to speed up and avoid 413 payload limits
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1000;
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      processImageBase64(compressedBase64);
    };
    
    img.onerror = () => {
      setError('Erreur de lecture image');
      setScanningImage(false);
    };
  };

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeScan(barcode);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractOCR = async () => {
    if (!newImageBase64) return;
    setIsExtractingOCR(true);
    try {
      const res = await fetch('/api/ocr-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: newImageBase64, language })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.productName) setNewProductName(data.productName);
        if (data.ingredients) setNewIngredients(data.ingredients);
      }
    } catch (e) {
      console.error("OCR Failed:", e);
    } finally {
      setIsExtractingOCR(false);
    }
  };

  const handleAddCustomProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingProduct(true);
    try {
      const res = await fetch('/api/add-custom-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode,
          product_name: newProductName,
          ingredients: newIngredients,
          image_base64: newImageBase64
        })
      });
      if (!res.ok) throw new Error('Failed to add product');
      
      // Auto-scan newly added product
      await handleScan();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || !result) return;
    
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/product-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: result.barcode,
          user_name: user.name || 'Current User',
          text: reviewText,
          rating: reviewRating,
          language: language
        })
      });
      const _text = await res.text();
      let data;
      try { data = JSON.parse(_text); } catch(e) { throw new Error(_text.slice(0, 50)); }
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      
      setResult({ ...result, reviews: data.reviews, consensus: data.consensus });
      setReviewText('');
      setReviewRating(5);
      
      // Earn token 
      onUpdateUser({
         ...user,
         tokens: (user.tokens || 0) + 1
      });
      alert('Review submitted! You earned +1 Token.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getNutriColor = (grade?: string) => {
    switch(grade?.toUpperCase()) {
        case 'A': return 'bg-[#038141] text-white';
        case 'B': return 'bg-[#85BB2F] text-white';
        case 'C': return 'bg-[#FECB02] text-slate-800';
        case 'D': return 'bg-[#EE8100] text-white';
        case 'E': return 'bg-[#E63E11] text-white';
        default: return 'bg-slate-200 text-slate-600';
    }
  };

  let finalScore = 0;
  let finalScoreColor = 'text-slate-400';
  let nutriscoreColor = 'bg-slate-200 text-slate-600';
  let additiveImpact = { label: '', color: '', bg: '', border: '' };
  let additivesCount = 0;

  if (result) {
    if (result.aiAnalysis) {
      finalScore = result.aiAnalysis.aiScore || 50;
      additivesCount = result.additives?.length || 0;
      nutriscoreColor = getNutriColor(result.nutriscore);
    } else {
      nutriscoreColor = getNutriColor(result.nutriscore);
      additivesCount = result.additives?.length || 0;
      
      const highRiskCount = result.ingredientsDetailed?.filter(i => i.isAdditive && i.risk === 'high').length || 0;
      const moderateRiskCount = result.ingredientsDetailed?.filter(i => i.isAdditive && i.risk === 'moderate').length || 0;

      const getEnhancedAdditivesImpact = () => {
        if (highRiskCount > 0) return { 
          label: language === 'fr' ? 'Risque élevé' : 'High risk additives', 
          color: 'text-[#E63E11]', bg: 'bg-red-50', border: 'border-red-200' 
        };
        if (moderateRiskCount > 0) return { 
          label: language === 'fr' ? 'Risque modéré' : 'Moderate risk additives', 
          color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' 
        };
        if (additivesCount > 0) return { 
          label: language === 'fr' ? 'Sans risque' : 'No major risk', 
          color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' 
        };
        return { 
          label: language === 'fr' ? 'Aucun additif' : 'No additives', 
          color: 'text-[#038141]', bg: 'bg-green-50', border: 'border-green-200' 
        };
      };

      additiveImpact = getEnhancedAdditivesImpact();

      let baseScore = 50;
      switch(result.nutriscore?.toUpperCase()) {
        case 'A': baseScore = 90; break;
        case 'B': baseScore = 75; break;
        case 'C': baseScore = 50; break;
        case 'D': baseScore = 25; break;
        case 'E': baseScore = 10; break;
      }
      
      // Yuka-style deduction: high risk is very heavy
      const highRiskAdditives = result.ingredientsDetailed?.filter(i => i.isAdditive && i.risk === 'high').length || 0;
      const modRiskAdditives = result.ingredientsDetailed?.filter(i => i.isAdditive && i.risk === 'moderate').length || 0;
      const lowRiskAdditives = result.ingredientsDetailed?.filter(i => i.isAdditive && i.risk === 'low').length || 0;
      
      finalScore = Math.max(0, baseScore - (highRiskAdditives * 20) - (modRiskAdditives * 8) - (lowRiskAdditives * 2));
    }
    
    if (finalScore >= 75) finalScoreColor = 'text-[#038141]';
    else if (finalScore >= 50) finalScoreColor = 'text-[#85BB2F]';
    else if (finalScore >= 25) finalScoreColor = 'text-[#EE8100]';
    else finalScoreColor = 'text-[#E63E11]';
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {showLiveCamera && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center supports-[min-height:100dvh]:h-[100dvh]">
          <div className="w-full h-full relative bg-slate-900 flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover w-full h-full" />
            
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center px-8">
               <div className="w-full aspect-[4/3] max-w-[300px] border-2 border-white/30 rounded-2xl relative shadow-[0_0_0_4000px_rgba(0,0,0,0.5)]">
                 <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl -mt-1 -ml-1" />
                 <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl -mt-1 -mr-1" />
                 <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl -mb-1 -ml-1" />
                 <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl -mb-1 -mr-1" />
                 <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/70 -translate-y-1/2 animate-pulse shadow-[0_0_12px_rgba(239,68,68,1)]" />
               </div>
               <p className="text-white font-medium mt-12 bg-black/50 backdrop-blur-sm px-6 py-2.5 rounded-full shadow-lg">
                 {language === 'fr' ? 'Cadrez le code-barres' : language === 'ar' ? 'قم بتوجيه الكاميرا إلى الرمز الشريطي' : 'Frame the barcode'}
               </p>
            </div>

            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 px-8 z-10 w-full max-w-md mx-auto">
              <button 
                onClick={stopLiveCamera}
                className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md flex items-center justify-center transition-all border border-white/20"
              >
                <div className="w-4 h-4 rounded-sm bg-white" />
              </button>
              <button 
                onClick={captureLiveImage}
                disabled={scanningImage}
                className="h-16 w-16 rounded-full bg-white text-black font-bold hover:scale-105 active:scale-95 transition-transform flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] disabled:opacity-50"
              >
                {scanningImage ? <div className="w-6 h-6 border-4 border-slate-300 border-t-black rounded-full animate-spin" /> : <Camera className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.scanProduct}</h2>
        <p className="text-slate-500 text-sm mb-6">
           Saisissez un code-barres pour interroger la base de données AMTAWA. L'IA vérifiera les ingrédients selon votre profil santé.
        </p>

        <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 text-slate-400 flex items-center">#</span>
             <input 
               type="text" 
               className="w-full bg-slate-50 rounded-xl px-10 py-3 font-mono border-2 border-transparent focus:border-purple-500 focus:outline-none transition-colors"
               placeholder={t.barcode}
               value={barcode}
               onChange={e => setBarcode(e.target.value)}
             />
             <button 
               type="button" 
               onClick={startLiveCamera}
               className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-slate-400 hover:text-purple-500 transition-colors z-10" 
               title="Scan with Camera"
             >
                {scanningImage ? <Search className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
             </button>
          </div>
          <button 
            type="submit" 
            disabled={loading || scanningImage}
            className="bg-slate-800 text-white rounded-xl px-6 py-3 font-semibold hover:bg-slate-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Search className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {loading ? t.processing : t.scanProduct}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center text-sm font-medium">{error}</div>
      )}

      {result && (
        <div className="flex justify-between items-center mb-4 px-2">
           <button 
             onClick={() => {setResult(null); setBarcode('');}}
             className="text-slate-400 hover:text-slate-600 text-sm font-bold flex items-center gap-1.5 transition-colors"
           >
             <ArrowLeft className="w-4 h-4" />
             {language === 'fr' ? 'Nouveau scan' : 'New scan'}
           </button>
        </div>
      )}

      {result && (
        <div className="bg-[#F8F8F8] rounded-[40px] overflow-hidden animate-[fadeIn_0.3s_ease-out] shadow-xl border border-white">
          {/* Header Section */}
          <div className="bg-white px-6 py-8 flex items-center gap-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="w-28 h-28 bg-white rounded-2xl overflow-hidden shadow-md flex-shrink-0 border border-slate-100 p-2">
              <img 
                src={result.image || 'https://images.unsplash.com/photo-1510004586912-58837491d908?q=80&w=200&h=200&fit=crop'} 
                alt={result.productName}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">
                {result.product_name || result.productName}
              </h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                {result.barcode.startsWith('30') ? 'LU' : 'MARQUE'}
              </p>
              
              <div className="mt-4 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full shadow-inner ${
                  finalScore >= 75 ? 'bg-[#038141]' : 
                  finalScore >= 50 ? 'bg-[#85BB2F]' : 
                  finalScore >= 25 ? 'bg-[#EE8100]' : 'bg-[#E63E11]'
                }`} />
                <div className="flex flex-col leading-none">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800 tracking-tighter">
                      {finalScore}
                    </span>
                    <span className="text-xs text-slate-300 font-bold">/100</span>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    finalScore >= 75 ? 'text-[#038141]' : 
                    finalScore >= 50 ? 'text-[#85BB2F]' : 
                    finalScore >= 25 ? 'text-[#EE8100]' : 'text-[#E63E11]'
                  }`}>
                    {finalScore >= 75 ? (language === 'fr' ? 'Excellent' : 'Excellent') :
                     finalScore >= 50 ? (language === 'fr' ? 'Bon' : 'Good') :
                     finalScore >= 25 ? (language === 'fr' ? 'Médiocre' : 'Mediocre') :
                     (language === 'fr' ? 'Mauvais' : 'Bad')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Sections */}
          <div className="p-4 flex flex-col gap-6">
            
            {/* Profile Match Safety Section */}
            {result.isSafeForUser !== undefined && (
              <div className="mt-2">
                <h3 className="text-sm font-black text-slate-900 mb-3 px-2 uppercase tracking-widest opacity-80">
                  {language === 'fr' ? 'Compatibilité Profil' : 'Profile Compatibility'}
                </h3>
                <div className={`p-5 rounded-[24px] border shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex items-start gap-4 ${
                  result.isSafeForUser 
                    ? 'bg-emerald-50 border-emerald-100/50 text-emerald-800' 
                    : 'bg-red-50 border-red-100/50 text-red-800'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    result.isSafeForUser ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {result.isSafeForUser ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">
                      {result.isSafeForUser 
                        ? (language === 'fr' ? 'Sûr pour votre profil' : 'Safe for your profile')
                        : (language === 'fr' ? 'Attention : Allergène !' : 'Warning: Allergen Match')
                      }
                    </p>
                    <p className="text-[11px] mt-1 font-bold opacity-70 leading-relaxed">
                      {result.isSafeForUser 
                        ? (language === 'fr' ? 'Aucun ingrédient en conflit avec vos critères de santé.' : 'No ingredients match your allergy profile.')
                        : (result.warnings?.join(', '))
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Sections (Dynamic Defauts/Qualites) */}
            {(() => {
              let defects = [];
              let qualities = [];

              if (result.aiAnalysis) {
                const getIcon = (id: string) => {
                  switch(id.toLowerCase()) {
                    case 'additives': case 'additifs': return <FlaskConical className="w-5 h-5" />;
                    case 'sugar': case 'sucre': return <Box className="w-5 h-5" />;
                    case 'calories': return <Flame className="w-5 h-5" />;
                    case 'saturatedfat': case 'graisses': return <Droplets className="w-5 h-5" />;
                    case 'salt': case 'sel': return <Info className="w-5 h-5" />;
                    case 'proteins': case 'protéines': return <Fish className="w-5 h-5" />;
                    case 'fiber': case 'fibres': return <Wheat className="w-5 h-5" />;
                    default: return <Info className="w-5 h-5" />;
                  }
                };

                defects = (result.aiAnalysis.defects || []).map((d: any) => ({ ...d, icon: getIcon(d.id || d.label) }));
                qualities = (result.aiAnalysis.qualities || []).map((q: any) => ({ ...q, icon: getIcon(q.id || q.label) }));
              } else {
                const items = [
                  { 
                    id: 'additives', 
                    label: language === 'fr' ? 'Additifs' : 'Additives', 
                    sublabel: additivesCount > 0 ? (language === 'fr' ? `Présence d'additifs à éviter` : 'Additives to avoid') : (language === 'fr' ? 'Aucun additif à éviter' : 'No harmful additives'),
                    value: additivesCount.toString(),
                    unit: '',
                    level: additivesCount === 0 ? 'low' : (additivesCount < 3 ? 'moderate' : 'high'),
                    icon: <FlaskConical className="w-5 h-5" />,
                    isGood: additivesCount === 0
                  },
                  { 
                    id: 'sugar', 
                    label: language === 'fr' ? 'Sucre' : 'Sugar', 
                    sublabel: result.nutritionDetails?.sugar?.impact,
                    value: result.nutritionDetails?.sugar?.value != null ? Number((result.nutritionDetails?.sugar?.value).toFixed(2)).toString() : '?',
                    unit: 'g',
                    level: result.nutritionDetails?.sugar?.level,
                    icon: <Box className="w-5 h-5" />,
                    isGood: result.nutritionDetails?.sugar?.level === 'low'
                  },
                  { 
                    id: 'calories', 
                    label: language === 'fr' ? 'Calories' : 'Calories', 
                    sublabel: result.nutritionDetails?.calories?.impact,
                    value: result.nutritionDetails?.calories?.value != null ? Number((result.nutritionDetails?.calories?.value).toFixed(2)).toString() : '?',
                    unit: ' kCal',
                    level: result.nutritionDetails?.calories?.level,
                    icon: <Flame className="w-5 h-5" />,
                    isGood: result.nutritionDetails?.calories?.level === 'low'
                  },
                  { 
                    id: 'saturatedFat', 
                    label: language === 'fr' ? 'Graisses saturées' : 'Saturated Fat', 
                    sublabel: result.nutritionDetails?.saturatedFat?.impact,
                    value: result.nutritionDetails?.saturatedFat?.value != null ? Number((result.nutritionDetails?.saturatedFat?.value).toFixed(2)).toString() : '?',
                    unit: 'g',
                    level: result.nutritionDetails?.saturatedFat?.level,
                    icon: <Droplets className="w-5 h-5" />,
                    isGood: result.nutritionDetails?.saturatedFat?.level === 'low'
                  },
                  { 
                    id: 'salt', 
                    label: language === 'fr' ? 'Sel' : 'Salt', 
                    sublabel: result.nutritionDetails?.salt?.impact,
                    value: result.nutritionDetails?.salt?.value != null ? Number((result.nutritionDetails?.salt?.value).toFixed(2)).toString() : '?',
                    unit: 'g',
                    level: result.nutritionDetails?.salt?.level,
                    icon: <Info className="w-5 h-5" />,
                    isGood: result.nutritionDetails?.salt?.level === 'low'
                  },
                  { 
                    id: 'proteins', 
                    label: language === 'fr' ? 'Protéines' : 'Proteins', 
                    sublabel: result.nutritionDetails?.proteins?.impact,
                    value: result.nutritionDetails?.proteins?.value != null ? Number((result.nutritionDetails?.proteins?.value).toFixed(2)).toString() : '?',
                    unit: 'g',
                    level: result.nutritionDetails?.proteins?.level,
                    icon: <Fish className="w-5 h-5" />,
                    isGood: result.nutritionDetails?.proteins?.level === 'low' // low 'risk' means high protein
                  },
                  { 
                    id: 'fiber', 
                    label: language === 'fr' ? 'Fibres' : 'Fiber', 
                    sublabel: result.nutritionDetails?.fiber?.impact,
                    value: result.nutritionDetails?.fiber?.value != null ? Number((result.nutritionDetails?.fiber?.value).toFixed(2)).toString() : '?',
                    unit: 'g',
                    level: result.nutritionDetails?.fiber?.level,
                    icon: <Wheat className="w-5 h-5" />,
                    isGood: result.nutritionDetails?.fiber?.level === 'low'
                  }
                ];
                defects = items.filter(i => !i.isGood);
                qualities = items.filter(i => i.isGood);
              }

              const renderItem = (item: any) => (
                <div key={item.id || item.label} className="p-4 flex items-center gap-4 border-b border-slate-50 last:border-0">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-[15px] leading-tight">
                      {item.label}
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5 font-bold">
                      {item.sublabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-300 font-black text-sm">{item.value}<span className="text-[10px] font-bold ml-0.5">{item.unit}</span></span>
                    <div className={`w-4 h-4 rounded-full shadow-sm ${
                      item.level === 'high' ? 'bg-[#E63E11]' : 
                      item.level === 'moderate' ? 'bg-[#EE8100]' : 
                      item.level === 'low' ? 'bg-[#038141]' : 'bg-[#85BB2F]'
                    }`} />
                  </div>
                </div>
              );

              return (
                <>
                  {defects.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-black text-slate-900 mb-3 px-2 uppercase tracking-widest opacity-40 flex justify-between items-center">
                        <span>{language === 'fr' ? 'Défauts' : 'Negatives'}</span>
                        {result.aiAnalysis && <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded">AI Analysis</span>}
                      </h3>
                      <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50">
                        {defects.map(renderItem)}
                      </div>
                    </div>
                  )}

                  {qualities.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-black text-slate-900 mb-3 px-2 uppercase tracking-widest opacity-40 flex justify-between items-center">
                        <span>{language === 'fr' ? 'Qualités' : 'Positives'}</span>
                        {result.aiAnalysis && <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded">AI Analysis</span>}
                      </h3>
                      <div className="bg-white rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50">
                        {qualities.map(renderItem)}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Ingredients Analysis Section */}
            <div className="mt-2">
              <div className="flex justify-between items-center mb-3 px-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest opacity-80">
                  {language === 'fr' ? 'Analyse des ingrédients' : 'Ingredients'}
                </h3>
                <span className="text-[10px] font-bold text-slate-300 bg-slate-100 px-2 py-0.5 rounded-full uppercase">Yuka Analysis</span>
              </div>
              <div className="bg-white p-5 rounded-[24px] shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-50">
                {result.ingredientsDetailed && result.ingredientsDetailed.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.ingredientsDetailed.map((ing: any, idx: number) => {
                      const getRiskStyles = () => {
                        switch(ing.risk) {
                          case 'high': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-500' };
                          case 'moderate': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', dot: 'bg-orange-500' };
                          case 'low': return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100', dot: 'bg-yellow-500' };
                          default: return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-50', dot: 'bg-emerald-500' };
                        }
                      };
                      
                      const styles = getRiskStyles();
                      const name = ing.name || 'Unknown';
                      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
                      
                      return (
                        <div 
                          key={idx} 
                          className={`px-3 py-2 rounded-xl text-[10px] font-bold border flex items-center gap-2.5 transition-all active:scale-95 ${styles.bg} ${styles.text} ${styles.border}`}
                        >
                          <div className={`w-2 h-2 rounded-full ${styles.dot} shadow-sm`} />
                          <div className="flex flex-col leading-tight">
                            <div className="flex items-center gap-1.5">
                              <span>{displayName}</span>
                              {ing.id && <span className="font-mono opacity-40 text-[8px] bg-black/5 px-1 rounded">{ing.id}</span>}
                            </div>
                            {ing.percent ? <span className="opacity-40 text-[8px] font-normal mt-0.5">{ing.percent < 1 ? (ing.percent < 0.1 ? '< 0.1' : ing.percent.toFixed(1).replace(/\.0$/, '')) : Math.round(ing.percent)}%</span> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic text-center py-2">
                    {language === 'fr' ? 'Analyse détaillée non disponible' : 'Detailed analysis unavailable'}
                  </p>
                )}
              </div>
            </div>

            {/* AI Review Consensus */}
            {result.analysis && (
              <div className="mt-2 p-5 bg-purple-50 rounded-[24px] border border-purple-100/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                    <Star className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-purple-900 uppercase tracking-widest">{language === 'fr' ? 'Analyse Personnalisée' : 'Personalized Analysis'}</h4>
                </div>
                <div className="text-[11px] text-purple-800/80 leading-relaxed font-medium whitespace-pre-wrap">
                  {result.analysis}
                </div>
              </div>
            )}

            {result.consensus && (
              <div className="mt-2 p-5 bg-indigo-50 rounded-[24px] border border-indigo-100/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Consensus IA</h4>
                </div>
                <p className="text-[11px] text-indigo-800/80 leading-relaxed font-medium">
                  {result.consensus.summary}
                </p>
              </div>
            )}

            {/* Community Reviews Section */}
            <div className="mt-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest opacity-80 mb-3 px-2">
                {language === 'fr' ? 'Avis de la communauté' : 'Community Reviews'}
              </h3>
              
              {/* Form to submit review */}
              <div className="bg-white p-5 rounded-[24px] shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-slate-50 mb-3">
                <form onSubmit={handleSubmitReview} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">{language === 'fr' ? 'Votre note' : 'Your rating'}</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} type="button" onClick={() => setReviewRating(star)} className={`p-1 ${reviewRating >= star ? 'text-yellow-400' : 'text-slate-200'}`}>
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    required
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder={language === 'fr' ? 'Ajouter un commentaire...' : 'Add a comment...'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-sm"
                    rows={2}
                  />
                  <button type="submit" disabled={submittingReview || !reviewText.trim()} className="w-full bg-indigo-600 text-white rounded-xl px-4 py-3 font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                    {submittingReview ? <Search className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                    {language === 'fr' ? 'Publier' : 'Submit Review'}
                  </button>
                </form>
              </div>

              {/* Display existing reviews */}
              {result.reviews && result.reviews.length > 0 ? (
                <div className="space-y-3">
                  {result.reviews.map((rev: any, idx: number) => (
                    <div key={rev.id || idx} className="bg-white p-4 rounded-[20px] border border-slate-50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">{rev.user}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} className={`w-3 h-3 ${rev.rating >= star ? 'text-yellow-400 fill-current' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{rev.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4 bg-white rounded-[24px] border border-slate-50">
                  {language === 'fr' ? 'Aucun avis pour le moment. Soyez le premier !' : 'No reviews yet. Be the first!'}
                </p>
              )}
            </div>

          </div>
        </div>
      )}

      {showAddForm && !result && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center gap-3 mb-6 block bg-indigo-50 p-4 rounded-xl text-indigo-800">
            <ShieldAlert className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-medium">Product not found. You can add it here and AI will automatically evaluate its safety and nutriscore.</p>
          </div>
          
          <form onSubmit={handleAddCustomProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Product Name</label>
              <input 
                type="text" required
                value={newProductName} onChange={e => setNewProductName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                placeholder="E.g., Local Moroccan Mint Tea"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Ingredients</label>
              <textarea 
                required rows={3}
                value={newIngredients} onChange={e => setNewIngredients(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                placeholder="E.g., Water, Green Tea, Fresh Mint, Sugar"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Product Image (Optional)</label>
              <input 
                type="file" accept="image/*" className="hidden"
                ref={fileInputRef} onChange={handleImageUpload}
              />
              <button 
                type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl hover:bg-slate-100 hover:border-slate-300 transition"
              >
                {newImageBase64 ? (
                  <img src={newImageBase64} alt="Preview" className="h-24 object-contain mb-2 rounded-xl" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                )}
                <span className="text-sm font-medium text-slate-500">
                  {newImageBase64 ? 'Change Image file' : 'Click to upload image'}
                </span>
              </button>
              {newImageBase64 && (
                <button
                  type="button"
                  onClick={handleExtractOCR}
                  disabled={isExtractingOCR}
                  className="w-full mt-3 bg-slate-800 text-white rounded-xl px-4 py-3 font-bold hover:bg-slate-900 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {isExtractingOCR ? <Search className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {isExtractingOCR 
                    ? (language === 'fr' ? 'Extraction en cours...' : 'Extracting text...') 
                    : (language === 'fr' ? 'Extraire nom & ingrédients (OCR)' : 'Auto-fill from photo (OCR)')}
                </button>
              )}
            </div>

            <button
              type="submit" disabled={addingProduct}
              className="w-full bg-indigo-600 text-white rounded-xl px-6 py-4 font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {addingProduct ? <Search className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {addingProduct ? 'AI is evaluating product...' : 'Add & Evaluate Product'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
