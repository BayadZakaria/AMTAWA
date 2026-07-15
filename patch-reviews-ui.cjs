const fs = require('fs');
let content = fs.readFileSync('src/components/Scanner.tsx', 'utf8');

const target = `            {result.consensus && (
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
            )}`;

const replacement = target + `

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
                        <button key={star} type="button" onClick={() => setReviewRating(star)} className={\`p-1 \${reviewRating >= star ? 'text-yellow-400' : 'text-slate-200'}\`}>
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
                            <Star key={star} className={\`w-3 h-3 \${rev.rating >= star ? 'text-yellow-400 fill-current' : 'text-slate-200'}\`} />
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
            </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/Scanner.tsx', content, 'utf8');
  console.log("Success reviews UI patch");
} else {
  console.log("Target reviews UI not found!");
}
