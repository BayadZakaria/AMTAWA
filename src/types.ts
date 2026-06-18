export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  dailyBudgetMAD: number;
  fitnessGoal?: 'Weight Loss' | 'Muscle Gain' | 'Maintenance';
  tokens: number;
  mealPlan?: MealPlan;
  fitnessPlan?: any;
}

export interface MedicalDocument {
  id: string;
  name: string;
  date: string;
}

export interface MedicalProfile {
  allergies: string[];
  conditions: string[];
  documents?: MedicalDocument[];
}

export interface ProductScanResult {
  barcode: string;
  productName: string;
  ingredients: string;
  allergens: string;
  nutriscore: string;
  image: string;
  isSafeForUser?: boolean;
  warnings?: string[];
  estimatedCostMAD?: number;
  ingredientsDetailed?: {
    name: string;
    isAllergen: boolean;
    isAdditive: boolean;
    percent?: number;
  }[];
  additives?: string[];
  reviews?: {
    id: number;
    user: string;
    text: string;
    rating: number;
    date: string;
  }[];
}

export interface MealItem {
  name: string;
  costMAD: number;
  calories: number;
}

export interface MealPlan {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  totalCostMAD: number;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  takeWithFood: boolean;
}
