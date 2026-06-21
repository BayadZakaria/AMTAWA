import React, { useState } from 'react';
import { Coins, CheckCircle2, ChevronLeft, CreditCard, ShieldCheck } from 'lucide-react';
import type { UserProfile } from '../types';

import { Language, translations } from '../translations';

interface TokenStoreProps {
  user: Partial<UserProfile>;
  onUpdateUser: (user: Partial<UserProfile>) => void;
  onBack: () => void;
  language?: Language;
}

export default function TokenStore({ user, onUpdateUser, onBack, language = 'en' }: TokenStoreProps) {
  const [buying, setBuying] = useState<number | null>(null);
  const t = translations[language];

  const tokenPacks = [
    { tokens: 10, priceMAD: 10, bonus: 0 },
    { tokens: 50, priceMAD: 45, bonus: 5 },
    { tokens: 100, priceMAD: 80, bonus: 20, popular: true },
    { tokens: 500, priceMAD: 350, bonus: 150 },
  ];

  const handleBuy = async (tokens: number, priceMAD: number) => {
    if (window.self !== window.top) {
      alert("La page de paiement Stripe ne peut pas s'ouvrir à l'intérieur de cet aperçu.\n\nVeuillez cliquer sur l'icône 'Ouvrir dans un nouvel onglet' (en haut à droite de l'écran) pour tester l'achat.");
      return;
    }

    setBuying(tokens);
    try {
      const response = await fetch('https://amtawa-1.onrender.com/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens, price_mad: priceMAD, origin: window.location.origin }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      alert(error.message);
      setBuying(null);
    }
  };

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium"
      >
        <ChevronLeft className="w-5 h-5" />
        {t.back}
      </button>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden mb-8 shadow-lg">
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="text-amber-100 font-medium text-sm border-r border-white/20 pr-3 mr-1">{t.currentBalance}</span>
              <span className="font-bold text-lg">{user.tokens || 0} {t.tokens}</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">{t.tokenStore}</h2>
            <p className="text-slate-300 max-w-md">{t.tokensDesc}</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm self-stretch flex flex-col justify-center max-w-sm w-full">
             <h3 className="font-bold mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                {t.howItWorks}
             </h3>
             <ul className="text-sm space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                   <div className="mt-0.5 text-amber-400 font-bold">-1</div>
                   <span>Jeton pour la génération d'un menu intelligent</span>
                </li>
                <li className="flex items-start gap-2">
                   <div className="mt-0.5 text-amber-400 font-bold">-1</div>
                   <span>Jeton pour la génération d'un programme d'entraînement</span>
                </li>
                <li className="flex items-start gap-2 pt-2 border-t border-white/10 text-purple-300">
                   <div className="mt-0.5 font-bold">+1</div>
                   <span>Jeton gagné pour chaque produit scanné dont vous donnez votre avis</span>
                </li>
             </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tokenPacks.map((pack, idx) => (
          <div 
            key={idx} 
            className={`bg-white p-6 rounded-3xl border transition-all flex flex-col ${
               pack.popular 
                ? 'border-amber-300 shadow-md ring-1 ring-amber-100 relative mt-4 md:mt-0' 
                : 'border-slate-100 hover:border-amber-200 hover:shadow-md'
            }`}
          >
            {pack.popular && (
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                 Le Plus Populaire
               </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${pack.popular ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                <Coins className="w-8 h-8" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-800">{pack.priceMAD}</div>
                <div className="text-xs text-slate-400 font-medium">MAD</div>
              </div>
            </div>
            
            <div className="mb-6 flex-1">
              <h3 className="text-2xl font-black text-slate-800">{pack.tokens} Jetons</h3>
              {pack.bonus > 0 && (
                <p className="text-purple-500 font-bold text-sm mt-1 flex items-center gap-1">
                   <CheckCircle2 className="w-4 h-4" />
                   Inclus {pack.bonus} jetons gratuits !
                </p>
              )}
            </div>
            
            <button
               onClick={() => handleBuy(pack.tokens, pack.priceMAD)}
               disabled={buying !== null}
               className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                 buying === pack.tokens
                  ? 'bg-slate-100 text-slate-400'
                  : pack.popular
                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
               }`}
            >
              {buying === pack.tokens ? (
                <>En cours...</>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Acheter le pack
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
