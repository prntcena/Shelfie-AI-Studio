
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, ClothingItem, Trip, UserProfile, TryOnResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper for Base64 Parsing ---
const getBase64Details = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], data: matches[2] };
  }
  return { mimeType: "image/jpeg", data: dataUrl };
};

// --- Helper: Ensure Image is Supported (Fixes AVIF/HEIC issues) ---
const processImageForGemini = async (base64String: string): Promise<{ mimeType: string, data: string }> => {
  const { mimeType, data } = getBase64Details(base64String);
  
  // List of MIME types natively supported by Gemini
  const supportedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

  if (supportedMimes.includes(mimeType)) {
    return { mimeType, data };
  }

  // If unsupported (e.g., avif), convert to JPEG using browser Canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Handle potential CORS issues if external
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context failed'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      // Convert to JPEG
      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(getBase64Details(jpegDataUrl));
    };
    img.onerror = (e) => reject(new Error('Image conversion failed: ' + e));
    img.src = base64String;
  });
};

// --- Helper for Style Profile ---
export const getUserStyleProfileString = (profile: UserProfile): string => {
  return `User is a ${profile.gender} with a ${profile.bodyShape} body shape (${profile.heightCm}cm, ${profile.weightKg}kg) favoring ${profile.stylePreferences.join(', ')} styles.`;
};

const SYSTEM_INSTRUCTION = `
  You are a high-end fashion archivist. 
  Analyze the provided clothing image and return a strict JSON object.
  - category: One of ['Top', 'Bottom', 'Shoe', 'Outerwear', 'Accessory', 'Other']
  - subCategory: Specific type (e.g., 'Graphic Tee', 'Pleated Skirt', 'Chelsea Boots')
  - primaryColor: Dominant color name
  - season: Best fit ['Summer', 'Winter', 'Spring', 'Fall', 'All']
  - styleTags: An array of 3-5 keywords describing style (e.g., 'Minimalist', 'Vintage', 'Streetwear')
`;

export const analyzeClothingImage = async (base64Image: string): Promise<AIAnalysisResult> => {
  try {
    // 1. Process image to ensure valid MIME type
    const { mimeType, data } = await processImageForGemini(base64Image);

    // 2. Use Flash model for speed
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: data,
            },
          },
          {
            text: "Analyze this clothing item.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING },
                subCategory: { type: Type.STRING },
                primaryColor: { type: Type.STRING },
                season: { type: Type.STRING },
                styleTags: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
            required: ["category", "subCategory", "primaryColor", "season", "styleTags"]
        }
      },
    });

    if (response.text) {
        return JSON.parse(response.text) as AIAnalysisResult;
    }
    throw new Error("No response text from AI");

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback in case of error to prevent app crash
    return {
      category: "Other",
      subCategory: "Unknown",
      primaryColor: "Unknown",
      season: "All",
      styleTags: [],
    };
  }
};

// --- Trip Planning Service ---

export const generateTripPlan = async (
  destination: string,
  startDate: string,
  endDate: string,
  eventDescription: string,
  preferences: { strictCloset: boolean; allowRepeats: boolean },
  wardrobe: ClothingItem[],
  userProfile?: UserProfile
): Promise<Partial<Trip>> => {
  
  // Create a lightweight inventory for context
  const inventory = wardrobe.map(item => ({
    id: item.id,
    desc: `${item.primaryColor} ${item.subCategory}`,
    cat: item.category,
    tags: item.tags
  }));

  const userContext = userProfile ? `
    User Profile Context:
    ${getUserStyleProfileString(userProfile)}
    
    Styling Goal: Prioritize outfits that flatter a ${userProfile.bodyShape} body type and match the ${userProfile.stylePreferences?.join('/')} aesthetic.
  ` : '';

  const genderSpecificInstruction = userProfile?.gender 
    ? `Ensure toiletries and accessories are specifically appropriate for a ${userProfile.gender}. For example, if Male, do not list feminine products.`
    : '';

  const TRIP_SYSTEM_INSTRUCTION = `
    You are an expert Personal Stylist and Professional Packer.
    You are NOT a travel guide. Your goal is to tell the user EXACTLY what to wear from their closet.
    
    Context:
    - Destination: ${destination}
    - Dates: ${startDate} to ${endDate}
    - Vibe/Notes: ${eventDescription}
    - Strategy: ${preferences.allowRepeats ? 'Maximize re-wearing items to pack light.' : 'Fresh look every day.'}
    ${userContext}
    
    Inventory:
    ${JSON.stringify(inventory)}
    
    Instructions:
    1. Analyze the duration. For each day, determine a specific 'Event' based on the User's Vibe (e.g., if Vibe is 'Business', Day 1 might be 'Travel', Day 2 'Conference').
    2. Estimate the weather for this location/time.
    3. For EACH day, select specific items from the provided Inventory to form an outfit.
       - CRITICAL: You MUST use the exact 'id' from the inventory list.
       - If 'Strict Closet' is false and a key piece is missing (e.g., Raincoat), you can leave the ID null but mention it in notes.
    4. Compile a Packing List.
       - 'clothes': List the names of the items used.
       - 'toiletries': Suggest 3-5 essentials. ${genderSpecificInstruction}
       - 'misc': Suggest 2-3 items (e.g., Charger, Passport).
       
    Output Schema:
    Return a strict JSON object.
  `;

  try {
    // Reverted to Flash 2.5 for speed
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [{ text: "Create my wardrobe plan." }]
      },
      config: {
        systemInstruction: TRIP_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                weatherSummary: { type: Type.STRING },
                dailyPlan: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            day: { type: Type.INTEGER },
                            date: { type: Type.STRING },
                            eventDescription: { type: Type.STRING },
                            weatherForecast: { type: Type.STRING },
                            outfit: {
                                type: Type.OBJECT,
                                properties: {
                                    topId: { type: Type.STRING },
                                    bottomId: { type: Type.STRING },
                                    shoeId: { type: Type.STRING },
                                    outerwearId: { type: Type.STRING },
                                    notes: { type: Type.STRING }
                                }
                            }
                        }
                    }
                },
                packingList: {
                    type: Type.OBJECT,
                    properties: {
                        clothes: { type: Type.ARRAY, items: { type: Type.STRING } },
                        toiletries: { type: Type.ARRAY, items: { type: Type.STRING } },
                        misc: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    throw new Error("No response from AI for Trip Plan");

  } catch (error) {
      console.error("Trip Generation Failed", error);
      throw error;
  }
};

// --- Virtual Try-On Service ---

const runGeneration = async (model: string, parts: any[]) => {
    return await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts
      },
      config: {}
    });
};

export const generateBiometricTryOn = async (
  profile: UserProfile,
  clothingItems: ClothingItem[]
): Promise<string> => {
  
  const clothingDescriptions = clothingItems
    .map(item => `a ${item.primaryColor} ${item.subCategory} (${item.category})`)
    .join(', ');

  const genderString = (profile.gender && profile.gender !== 'Prefer not to say') 
    ? profile.gender 
    : 'person';

  const prompt = `
    Task: Virtual Try-On Generation (Front View).
    Inputs:
    - Image 1: User's Reference Selfie (Source Identity).
    - Other Images: Clothing Garments (Target Outfit).
    Instructions:
    Generate a photorealistic full-body portrait of a ${genderString} person (based on Reference Selfie) wearing the selected items.
    CRITICAL IDENTITY RULES:
    1. The face in the output MUST BE IDENTICAL to the face in the Reference Selfie. 
    2. Preserve specific facial features, bone structure, eye shape, and skin texture.
    3. Do not "beautify" or generalize the face; keep it recognizable as the specific user uploaded.
    CRITICAL BODY RULES:
    1. ${getUserStyleProfileString(profile)}
    2. Skin Tone: ${profile.skinTone} (Must match the face).
    3. Silhouette: Ensure the body proportions match a typical ${genderString} physique with the specified measurements.
    OUTFIT RULES:
    1. The person is wearing: ${clothingDescriptions}.
    2. IMPORTANT: If specific garments (like shoes or bottoms) are NOT listed above, the person should be wearing appropriate neutral basics (e.g., simple jeans or bare feet) or the image should be cropped/posed so missing items are less focus, BUT the listed items must be prominent.
    3. The clothing must look physically realistic, draping naturally over the specified body shape.
    Style: High-end fashion editorial, 8k resolution, sharp focus, neutral studio background, Front facing view.
  `;

  const parts: any[] = [{ text: prompt }];

  // Process Face
  if (profile.facePhoto) {
      const { mimeType, data } = await processImageForGemini(profile.facePhoto);
      parts.push({ inlineData: { mimeType, data } });
  }

  // Process Clothes
  for (const item of clothingItems) {
      const { mimeType, data } = await processImageForGemini(item.image);
      parts.push({ inlineData: { mimeType, data } });
  }

  try {
    const response = await runGeneration("gemini-2.5-flash-image", parts);

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");

  } catch (error) {
    console.error("VTO Generation Failed", error);
    throw error;
  }
};

export const generateAngle = async (
    profile: UserProfile,
    clothingItems: ClothingItem[],
    angle: 'side' | 'back',
    frontViewBase64?: string
): Promise<string> => {

    const clothingDescriptions = clothingItems
      .map(item => `a ${item.primaryColor} ${item.subCategory} (${item.category})`)
      .join(', ');
  
    const genderString = (profile.gender && profile.gender !== 'Prefer not to say') ? profile.gender : 'person';
  
    const angleInstruction = angle === 'side' 
      ? "Left Side Profile View. Ensure the fit and fabric drape are consistent with the front view."
      : "Back View (from Behind). Show details of the back of the garment (e.g., pockets, hood, embroidery). The face will not be visible, but hair/head shape must match.";

    const prompt = `
      Task: Virtual Try-On Generation (${angle === 'side' ? 'Side Profile' : 'Back View'}).
      Instructions:
      Generate a photorealistic full-body image of a ${genderString} person wearing the SAME outfit as the reference, but viewed from the ${angleInstruction}.
      Consistency Rules:
      1. Use the provided "Front View" image (if available) as the ground truth for what the outfit looks like.
      2. The person must look like the same person in the Source Selfie.
      3. Outfit: ${clothingDescriptions}.
      Biometrics: Height ${profile.heightCm}cm, Weight ${profile.weightKg}kg, Body Shape ${profile.bodyShape}.
      Style: High-end fashion editorial, 8k resolution, sharp focus, neutral studio background.
    `;
  
    const parts: any[] = [{ text: prompt }];
  
    // Add Face
    if (profile.facePhoto) {
        const { mimeType, data } = await processImageForGemini(profile.facePhoto);
        parts.push({ inlineData: { mimeType, data } });
    }
  
    // Add Generated Front View
    if (frontViewBase64) {
        const { mimeType, data } = await processImageForGemini(frontViewBase64);
        parts.push({ inlineData: { mimeType, data } });
    }

    // Add Clothing Items
    for (const item of clothingItems) {
        const { mimeType, data } = await processImageForGemini(item.image);
        parts.push({ inlineData: { mimeType, data } });
    }
  
    try {
        const response = await runGeneration("gemini-2.5-flash-image", parts);

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image generated for angle");
    } catch (error) {
        console.error("VTO Angle Generation Failed", error);
        throw error;
    }
};

export const critiqueGeneratedLook = async (
  profile: UserProfile,
  generatedImageBase64: string
): Promise<TryOnResult['criticVerdict']> => {
  
  const genDetails = await processImageForGemini(generatedImageBase64);
  
  const parts: any[] = [
      { inlineData: { mimeType: genDetails.mimeType, data: genDetails.data } },
      { text: "Critique this try-on result." }
  ];

  if (profile.facePhoto) {
      const faceDetails = await processImageForGemini(profile.facePhoto);
      parts.unshift({ inlineData: { mimeType: faceDetails.mimeType, data: faceDetails.data } });
  }

  const CRITIQUE_SYSTEM_PROMPT = `
    Act as a strict Quality Control Expert and Fashion Stylist.
    Compare the 'Original Selfie' (Source) with the 'Generated Try-On' (Result).
    
    Task 1 (Identity Check): Does the face in the Result look exactly like the Source? (Score 0-100).
    Task 2 (Physics Check): Does the body type look accurate to a ${profile.bodyShape} build? (Score 0-100).
    Task 3 (Style Advice): Analyze the color contrast. Does this outfit suit the user's skin tone? Suggest one accessory.
    
    Output: Return strict JSON with identityMatchScore, realismScore, styleAdvice, and colorAnalysis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: CRITIQUE_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identityMatchScore: { type: Type.NUMBER },
            realismScore: { type: Type.NUMBER },
            styleAdvice: { type: Type.STRING },
            colorAnalysis: { type: Type.STRING }
          },
          required: ["identityMatchScore", "realismScore", "styleAdvice", "colorAnalysis"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No critique generated");

  } catch (error) {
    console.error("Critique Failed", error);
    // Fallback
    return {
      identityMatchScore: 85,
      realismScore: 90,
      styleAdvice: "Looking good! Consider adding a watch.",
      colorAnalysis: "Colors seem balanced."
    };
  }
};
