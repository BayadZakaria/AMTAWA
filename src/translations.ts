export type Language = 'en' | 'fr' | 'ar' | 'zgh';

export const translations = {
  en: {
    appTitle: "mtawa",
    dashboard: "Dashboard",
    medical: "Medical Profile",
    scanner: "Food Scanner",
    meals: "Smart Meals",
    fitness: "Smart Fitness",
    history: "History",
    profile: "Profile",
    
    // Auth
    login: "Log In",
    signup: "Sign Up",
    continueAsUser: "Continue as Standard User",
    continueAsGoogle: "Continue with Google",
    
    // Token Store
    tokenStore: "Token Store",
    currentBalance: "Current Balance",
    tokens: "Tokens",
    buyPack: "Buy Pack",
    howItWorks: "How it works",
    tokensDesc: "Tokens are used to generate personalized AI Smart Meals and Fitness routines. You can buy more, or earn them for free by contributing community product reviews via the Scanner.",
    processing: "Processing...",
    
    // Dashboard
    dailyBudget: "Daily Budget",
    setBudget: "Set Budget",
    healthAlerts: "Health Alerts",
    noConditions: "No specific conditions mapped yet.",
    recentActivity: "Recent Activity",
    
    // Scanner
    scanProduct: "Scan Product",
    barcode: "Barcode (EAN)",
    ingredients: "Ingredients",
    additives: "Additives",
    reviews: "Community Reviews",
    submitReview: "Submit Review",
    reviewEarnToken: "Submit Review (+1 Token)",
    
    // Meals
    generateMeals: "Generate Smart Plan",
    regenerateMeals: "Regenerate Plan",
    readyForMeals: "Ready to plan your meals?",
    mealPlanTitle: "Optimized Meal Plan",
    
    // Fitness
    generateFitness: "Generate Smart Workout",
    regenerateFitness: "Regenerate Plan",
    readyForFitness: "Ready for your workout?",
    workoutTitle: "Today's Routine",
    
    // Medical
    uploadMedical: "Upload Medical Profile",
    scanDocument: "Scan Document",
    manualEntry: "Manual Entry",
    
    // Profile
    personalInfo: "Personal Info",
    logout: "Logout",
    
    // General
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    saved: "Saved!",
    back: "Back"
  },
  fr: {
    appTitle: "mtawa",
    dashboard: "Tableau de Bord",
    medical: "Profil Médical",
    scanner: "Scanner Alimentaire",
    meals: "Repas Intelligents",
    fitness: "Fitness",
    history: "Historique",
    profile: "Profil",
    
    // Auth
    login: "Connexion",
    signup: "S'inscrire",
    continueAsUser: "Continuer comme Utilisateur Standard",
    continueAsGoogle: "Continuer avec Google",
    
    // Token Store
    tokenStore: "Boutique de Jetons",
    currentBalance: "Solde Actuel",
    tokens: "Jetons",
    buyPack: "Acheter Pack",
    howItWorks: "Comment ça marche",
    tokensDesc: "Les jetons sont utilisés pour générer des repas et des entraînements intelligents. Vous pouvez en acheter ou les gagner en contribuant des avis via le Scanner.",
    processing: "Traitement...",
    
    // Dashboard
    dailyBudget: "Budget Quotidien",
    setBudget: "Définir le Budget",
    healthAlerts: "Alertes de Santé",
    noConditions: "Aucune condition mappée pour le moment.",
    recentActivity: "Activité Récente",
    
    // Scanner
    scanProduct: "Scanner Produit",
    barcode: "Code-barres (EAN)",
    ingredients: "Ingrédients",
    additives: "Additifs",
    reviews: "Avis de la Communauté",
    submitReview: "Soumettre Avis",
    reviewEarnToken: "Soumettre Avis (+1 Jeton)",
    
    // Meals
    generateMeals: "Générer un Plan",
    regenerateMeals: "Regénérer le Plan",
    readyForMeals: "Prêt à planifier ?",
    mealPlanTitle: "Plan Repas Optimisé",
    
    // Fitness
    generateFitness: "Générer Exercice",
    regenerateFitness: "Regénérer",
    readyForFitness: "Prêt pour l'entraînement ?",
    workoutTitle: "Programme d'Aujourd'hui",
    
    // Medical
    uploadMedical: "Ajouter Profil Médical",
    scanDocument: "Scanner Document",
    manualEntry: "Saisie Manuelle",
    
    // Profile
    personalInfo: "Infos Personnelles",
    logout: "Déconnexion",
    
    // General
    loading: "Chargement...",
    save: "Enregistrer",
    cancel: "Annuler",
    saved: "Enregistré !",
    back: "Retour"
  },
  ar: {
    appTitle: "mtawa",
    dashboard: "الرئيسية",
    medical: "الملف الطبي",
    scanner: "الماسح",
    meals: "وجبات ذكية",
    fitness: "لياقة ذكية",
    history: "السجل",
    profile: "الحساب",
    
    // Auth
    login: "تسجيل الدخول",
    signup: "حساب جديد",
    continueAsUser: "المتابعة كمستخدم عادي",
    continueAsGoogle: "المتابعة مع جوجل",
    
    // Token Store
    tokenStore: "متجر الرموز",
    currentBalance: "الرصيد الحالي",
    tokens: "رموز",
    buyPack: "شراء حزمة",
    howItWorks: "كيف يعمل النظام",
    tokensDesc: "تُستخدم الرموز لإنشاء خطط وجبات ولياقة بدنية ذكية. يمكنك الشراء أو كسب رموز مجانية عن طريق مشاركة تقييمات المنتجات عبر الماسح.",
    processing: "جاري المعالجة...",
    
    // Dashboard
    dailyBudget: "الميزانية اليومية",
    setBudget: "تحديد الميزانية",
    healthAlerts: "تنبيهات صحية",
    noConditions: "لا توجد أمراض مسجلة بعد.",
    recentActivity: "النشاط الأخير",
    
    // Scanner
    scanProduct: "فحص منتج",
    barcode: "الرمز الشريطي",
    ingredients: "المكونات",
    additives: "المواد المضافة",
    reviews: "تقييمات المجتمع",
    submitReview: "إرسال التقييم",
    reviewEarnToken: "إرسال تقييم (+1 رمز)",
    
    // Meals
    generateMeals: "إنشاء خطة ذكية",
    regenerateMeals: "إعادة إنشاء الخطة",
    readyForMeals: "جاهز لتخطيط وجباتك؟",
    mealPlanTitle: "خطة وجبات مثالية",
    
    // Fitness
    generateFitness: "إنشاء خطة لياقة ذكية",
    regenerateFitness: "إعادة إنشاء الخطة",
    readyForFitness: "جاهز للتمارين؟",
    workoutTitle: "تمارين اليوم",
    
    // Medical
    uploadMedical: "رفع الملف الطبي",
    scanDocument: "فحص مستند",
    manualEntry: "إدخال يدوي",
    
    // Profile
    personalInfo: "المعلومات الشخصية",
    logout: "تسجيل الخروج",
    
    // General
    loading: "جاري التحميل...",
    save: "حفظ",
    cancel: "إلغاء",
    saved: "تم الحفظ!",
    back: "رجوع"
  },
  zgh: {
    appTitle: "mtawa",
    dashboard: "ⵜⴰⴼⵍⵡⵉⵜ",
    medical: "ⴰⵎⵙⴰⵙⴼⴰⵔ",
    scanner: "ⴰⵙⴽⴰⵏⵉⵔ",
    meals: "ⵜⵉⵔⵎⵜ ⵉⵎⵖⵔⵏ",
    fitness: "ⵜⴰⴷⵓⵙⵉ",
    history: "ⴰⵎⵣⵔⵓⵢ",
    profile: "ⴰⵙⴰⵔⵓ",
    
    // Auth
    login: "ⴽⵛⵎ",
    signup: "ⵣⵎⵎⴻⵎ",
    continueAsUser: "ⴽⵎⵎⵍ ⵙ ⵓⵙⵎⵔⴰⵙ",
    continueAsGoogle: "ⴽⵎⵎⵍ ⵙ Google",
    
    // Token Store
    tokenStore: "ⵜⴰⵃⴰⵏⵓⵜ ⵏ ⵉⵜⵓⴽⵏ",
    currentBalance: "ⴰⵎⴹⴰⵏ",
    tokens: "ⵉⵜⵓⴽⵏ",
    buyPack: "ⵙⵖ ⵜⴰⴳⵔⵓⵎⵎⴰ",
    howItWorks: "ⵎⴰⵎⵏⴽ",
    tokensDesc: "ⵉⵜⵓⴽⵏ ⴰⵔ ⵜⵏ ⵏⵙⵎⵓⵔⴰⵙ ⵉ ⵓⵖⴰⵡⴰⵙ ⵏ ⵜⵉⵔⵎⵜ ⴷ ⵜⴰⴷⵓⵙⵉ. ⵜⵣⵎⵔⴷ ⴰⴷ ⵜⵙⵖⵜ ⵏⵖ ⴰⴷ ⵜⴰⵎⵣⵜ ⴼⴰⴱⵓⵔ ⵙ ⵓⵙⴽⴰⵏⵉⵔ.",
    processing: "ⴰⵣⵏ...",
    
    // Dashboard
    dailyBudget: "ⴰⵙⴰⵔⵓ ⵏ ⵡⴰⵙⵙ",
    setBudget: "ⵙⵔⵙ ⴰⵙⴰⵔⵓ",
    healthAlerts: "ⵜⵉⵏⴰⵖⵉⵏ ⵏ ⵜⴰⴷⵓⵙⵉ",
    noConditions: "ⵓⵔ ⵉⵍⵍⵉ ⵎⴰⵢⴷ ⵉⵜⵜⵓⵙⴽⴰⵔⵏ.",
    recentActivity: "ⵜⵉⵎⵙⴰⵔⵉⵏ",
    
    // Scanner
    scanProduct: "ⵙⴽⴰⵏⵉ ⴰⴼⴰⵔⵙ",
    barcode: "ⵜⴰⵏⴳⴰⵍⵜ",
    ingredients: "ⵉⵙⴰⴼⵉⴼⵏ",
    additives: "ⵜⵉⵎⵔⵏⵉⵡⵉⵏ",
    reviews: "ⵜⵉⵎⵏⵏⴰⵡⵉⵏ",
    submitReview: "ⴰⵣⵏ ⵜⴰⵎⵏⵏⴰⵡⵜ",
    reviewEarnToken: "ⴰⵣⵏ ⵜⴰⵎⵏⵏⴰⵡⵜ (+1 ⴰⵜⵓⴽⵏ)",
    
    // Meals
    generateMeals: "ⵙⴽⵔ ⴰⵖⴰⵡⴰⵙ",
    regenerateMeals: "ⴰⵍⵙ ⵙⴽⵔ",
    readyForMeals: "ⵜⵃⵢⵢⵍⴷ ⵉ ⵜⵉⵔⵎⵜ ⵏⵏⴽ?",
    mealPlanTitle: "ⴰⵖⴰⵡⴰⵙ ⵏ ⵜⵉⵔⵎⵜ",
    
    // Fitness
    generateFitness: "ⵙⴽⵔ ⴰⵖⴰⵡⴰⵙ",
    regenerateFitness: "ⴰⵍⵙ ⵙⴽⵔ",
    readyForFitness: "ⵜⵃⵢⵢⵍⴷ ⵉ ⵜⴰⴷⵓⵙⵉ?",
    workoutTitle: "ⵜⴰⴷⵓⵙⵉ ⵏ ⵡⴰⵙⵙ",
    
    // Medical
    uploadMedical: "ⴰⵣⵏ ⴰⵎⵙⴰⵙⴼⴰⵔ",
    scanDocument: "ⵙⴽⴰⵏⵉ ⴰArr",
    manualEntry: "ⵙⴽⵔ ⵙ ⵓⴼⵓⵙ",
    
    // Profile
    personalInfo: "ⵉⵏⵖⵎⵉⵙⵏ",
    logout: "ⴼⴼⵖ",
    
    // General
    loading: "ⴰⵣⵏ...",
    save: "ⵃⴹⵓ",
    cancel: "ⵙⵔⵙ",
    saved: "ⵉⵜⵜⵓⵃⴹⴰ!",
    back: "ⴰⵖⵓⵍ"
  }
};
