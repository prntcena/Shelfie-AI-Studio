
export interface ClothingItem {
  id: string;
  image: string; // Base64
  category: string;
  subCategory: string;
  primaryColor: string;
  season: string;
  tags: string[];
  createdAt: number;
}

export interface Outfit {
  id: string;
  name: string;
  items: ClothingItem[];
  createdAt: number;
}

export interface ScheduleEntry {
  date: string; // ISO YYYY-MM-DD
  outfitId: string;
}

export interface UserProfile {
  name: string;
  gender: 'Female' | 'Male' | 'Non-Binary' | 'Prefer not to say';
  heightCm: number;
  weightKg: number;
  bodyShape: 'Hourglass' | 'Pear' | 'Rectangle' | 'Inverted Triangle' | 'Athletic' | 'Apple';
  skinTone: string; // Hex or descriptive name
  stylePreferences: string[]; // e.g. Minimalist, Streetwear
  allowPersonalization: boolean;
  facePhoto?: string; // Base64 for VTO
  onboardingCompleted: boolean;
}

// Result expected from Gemini
export interface AIAnalysisResult {
  category: string;
  subCategory: string;
  primaryColor: string;
  season: string;
  styleTags: string[];
}

export type Season = 'Summer' | 'Winter' | 'Spring' | 'Fall' | 'All';
export type Category = 'Top' | 'Bottom' | 'Shoe' | 'Outerwear' | 'Accessory' | 'Other';

// --- Phase 4: Trip Planner Types (Refactored) ---

export interface TripDay {
  day: number;
  date: string; // ISO
  eventDescription: string; // e.g., "Conference Presentation"
  weatherForecast: string;  // e.g., "Rainy, 15°C"
  outfit: {
    topId?: string;
    bottomId?: string;
    shoeId?: string;
    outerwearId?: string; // Optional layer
    notes: string; // Styling advice
  };
}

export interface TripPackingCategories {
  clothes: string[];    // Generated list of item names
  toiletries: string[]; // Generic essentials
  misc: string[];       // Electronics, documents
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  eventsDescription: string;
  preferences: {
    strictCloset: boolean;
    allowRepeats: boolean;
  };
  // New Structure
  dailyPlan: TripDay[];
  packingList: TripPackingCategories;
  weatherSummary: string;
  createdAt: number;
}

// --- Phase 5: Virtual Try-On Types ---

export interface TryOnResult {
  id: string;
  frontUrl: string;       // The main image
  sideUrl?: string;       // Generated on demand
  backUrl?: string;       // Generated on demand
  criticVerdict: {
    identityMatchScore: number; // 0-100
    realismScore: number; // 0-100
    styleAdvice: string;
    colorAnalysis: string;
  };
}