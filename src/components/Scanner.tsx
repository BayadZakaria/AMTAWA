import React, { useState, useRef } from 'react';
import { Search, ShieldAlert, ShieldCheck, Tag, Star, Upload, Plus, MessageSquare, Camera } from 'lucide-react';
import type { MedicalProfile, ProductScanResult, UserProfile } from '../types';
import { translations, Language } from '../translations';

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
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to read barcode from image');
      
      setBarcode(data.barcode);
      executeScan(data.barcode);
    } catch (err: any) {
      setError('Impossible de lire le code-barres. Essayez de bien le cadrer.');
    } finally {
      setScanningImage(false);
    }
  };

  const executeScan = async (barcodeToScan: string) => {
    if (!barcodeToScan.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setShowAddForm(false);

    try {
      const response = await fetch('/api/scan-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: barcodeToScan,
          userAllergies: medicalProfile.allergies
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404) {
          setShowAddForm(true);
        }
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddCustomProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingProduct(true);
    try {
      const res = await fetch('/api/add-custom-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode,
          productName: newProductName,
          ingredients: newIngredients,
          imageBase64: newImageBase64
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
          user: user.name || 'Current User',
          text: reviewText,
          rating: reviewRating,
          language: language
        })
      });
      const data = await res.json();
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

  const getAdditivesImpact = (count: number) => {
    if (count === 0) return { label: 'No additives', color: 'text-[#038141]', bg: 'bg-green-50', border: 'border-green-200' };
    if (count <= 2) return { label: 'Low additives impact', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    if (count <= 4) return { label: 'Moderate impact', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { label: 'High additives impact', color: 'text-[#E63E11]', bg: 'bg-red-50', border: 'border-red-200' };
  };

  let finalScore = 0;
  let finalScoreColor = 'text-slate-400';
  let nutriscoreColor = 'bg-slate-200 text-slate-600';
  let additiveImpact = { label: '', color: '', bg: '', border: '' };
  let additivesCount = 0;

  if (result) {
    nutriscoreColor = getNutriColor(result.nutriscore);
    additivesCount = result.additives?.length || 0;
    additiveImpact = getAdditivesImpact(additivesCount);

    let baseScore = 50;
    switch(result.nutriscore?.toUpperCase()) {
      case 'A': baseScore = 90; break;
      case 'B': baseScore = 75; break;
      case 'C': baseScore = 50; break;
      case 'D': baseScore = 25; break;
      case 'E': baseScore = 10; break;
    }
    finalScore = Math.max(0, baseScore - (additivesCount * 5));
    if (finalScore >= 75) finalScoreColor = 'text-[#038141]';
    else if (finalScore >= 50) finalScoreColor = 'text-[#85BB2F]';
    else if (finalScore >= 25) finalScoreColor = 'text-[#EE8100]';
    else finalScoreColor = 'text-[#E63E11]';
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {showLiveCamera && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-black rounded-2xl overflow-hidden relative shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-[400px] object-cover bg-slate-900" />
            
            <div className="absolute inset-0 pointer-events-none border-[4px] border-white/20 m-8 rounded-xl flex items-center justify-center">
               <div className="w-full h-0.5 bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6">
              <button 
                onClick={stopLiveCamera}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold backdrop-blur-md transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={captureLiveImage}
                className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-colors flex-1"
              >
                Capturer & Scanner
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.scanProduct}</h2>
        <p className="text-slate-500 text-sm mb-6">
           Enter a barcode to query the Open Food Facts API. The backend evaluates exact ingredients against your OCR-detected health constraints.
        </p>

        <form onSubmit={handleScan} className="flex gap-2">
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
        <div className="bg-white p-0 rounded-3xl shadow-sm border border-slate-100 animate-[fadeIn_0.3s_ease-out] overflow-hidden">
          {/* Yuka-like Header Section */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-6 items-center bg-white">
            <div className="flex-1 flex flex-col md:flex-row items-center gap-6 text-center md:text-left w-full">
              {result.image && (
                <img src={result.image} alt={result.productName} className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-2xl shadow-sm bg-slate-50" />
              )}
              
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-800">{result.productName}</h3>
                <div className="flex items-center gap-2 mt-3 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold flex items-center gap-1 group relative">
                    Nutriscore: 
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs tracking-wider uppercase ml-1 ${nutriscoreColor}`}>
                      {result.nutriscore || '?'}
                    </span>
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm font-bold flex items-center gap-1">
                     <Tag className="w-4 h-4" /> EST {result.estimatedCostMAD} MAD
                  </span>
                </div>
              </div>
            </div>

            {/* Health Score Gauge */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full md:w-auto mt-4 md:mt-0 shadow-inner">
               <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                   <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                     <path
                       className="text-slate-200"
                       strokeWidth="3.5"
                       stroke="currentColor"
                       fill="none"
                       d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                     />
                     <path
                       className={`stroke-current ${finalScoreColor}`}
                       strokeWidth="3.5"
                       strokeDasharray={`${finalScore}, 100`}
                       strokeLinecap="round"
                       fill="none"
                       d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                     />
                   </svg>
                   <div className="absolute flex flex-col items-center justify-center">
                     <span className={`text-3xl font-black ${finalScoreColor}`}>{finalScore}</span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">/ 100</span>
                   </div>
               </div>
               <div className="flex flex-col gap-2 min-w-[140px]">
                  <div className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center text-center leading-snug ${additiveImpact.bg} ${additiveImpact.border} ${additiveImpact.color} shadow-sm`}>
                     {additiveImpact.label}<br/>({additivesCount} count)
                  </div>
               </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* Profile Match Safety */}
              {result.isSafeForUser ? (
                 <div className="bg-purple-50 text-purple-700 p-4 rounded-xl border border-purple-100 flex items-center gap-3">
                   <ShieldCheck className="w-8 h-8 text-purple-500 flex-shrink-0" />
                   <div>
                     <span className="text-sm font-bold block">Safe for your profile</span>
                     <span className="text-xs opacity-90 block">No conflicting allergens detected.</span>
                   </div>
                 </div>
              ) : (
                 <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                   <ShieldAlert className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
                   <div>
                     <span className="text-sm font-bold block">WARNING! Allergen Match</span>
                     <ul className="text-xs mt-1 space-y-1 opacity-90 list-disc ml-4">
                       {result.warnings?.map((w,i)=><li key={i}>{w}</li>)}
                     </ul>
                   </div>
                 </div>
              )}

              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-3">Ingredients Analysis</p>
                {result.ingredientsDetailed && result.ingredientsDetailed.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.ingredientsDetailed.map((ing, idx) => (
                      <span key={idx} className={`px-2 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 ${
                        ing.isAllergen 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : ing.isAdditive 
                            ? 'bg-orange-50 text-orange-700 border-orange-200' 
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {ing.name.charAt(0).toUpperCase() + ing.name.slice(1)} {ing.percent ? <span className="opacity-60 text-[10px]">({Math.round(ing.percent)}%)</span> : null}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl leading-relaxed">{result.ingredients}</p>
                )}
                
                {result.additives && result.additives.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      <span className="text-xs font-bold text-amber-800 w-full mb-1">Detected Additives ({result.additives.length})</span>
                      {result.additives.map((add, i) => (
                        <span key={i} className="text-xs font-bold bg-white px-2 py-1 rounded-md text-amber-600 shadow-sm border border-amber-100">
                          {add}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-slate-400" />
                  <h4 className="font-bold text-slate-800">Community Reviews</h4>
                </div>

                {result.consensus && (
                  <div className={`p-4 rounded-2xl mb-6 border ${
                    result.consensus.status === 'Recommended' ? 'bg-purple-50 border-purple-200 text-purple-800' :
                    result.consensus.status === 'Not Recommended' ? 'bg-red-50 border-red-200 text-red-800' :
                    'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-5 h-5" />
                      <h5 className="font-bold">AI Community Consensus</h5>
                    </div>
                    <p className="text-sm opacity-90">{result.consensus.summary}</p>
                  </div>
                )}
                
                {result.reviews && result.reviews.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {result.reviews.map(review => (
                      <div key={review.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-slate-700">{review.user}</span>
                          <span className="flex items-center text-amber-400 text-sm">
                            <Star className="w-4 h-4 fill-current mr-1" /> {review.rating}/5
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{review.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mb-6">No reviews yet. Be the first to review!</p>
                )}

                <form onSubmit={handleSubmitReview} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h5 className="text-sm font-bold text-slate-700 mb-3">Add a Review</h5>
                  <div className="flex gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`p-1 ${reviewRating >= star ? 'text-amber-400' : 'text-slate-300'}`}
                      >
                        <Star className={`w-6 h-6 ${reviewRating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 mb-3"
                    rows={3}
                    placeholder="Write you feedback based on how it impacted your health goals..."
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={submittingReview || !reviewText.trim()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>

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
