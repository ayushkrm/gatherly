import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  EVENT_PLAN_GEMINI_SCHEMA,
  PLANNER_SYSTEM_PROMPT,
  GEMINI_MODEL,
  CHAT_TOOLS,
  sanitizeUserInput,
} from './src/lib/gemini';
import {
  EventPlanSchema,
  PlanBResponseSchema,
  MoodBoardAnalysisSchema,
} from './src/lib/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));

// Client-side rate limiting tracker (server defense)
const requestRateMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    requestRateMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count > 30) {
    return false; // Exceeded 30 requests per minute
  }
  entry.count++;
  return true;
}

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/* -------------------------------------------------------------
 * 1. Plan Generation with Zod validation + 1 retry on error
 * ------------------------------------------------------------- */
app.post('/api/plan/generate', async (req: Request, res: Response): Promise<void> => {
  const clientIp = req.ip || 'local';
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
    return;
  }

  const {
    eventType,
    date,
    city,
    guestCount,
    totalBudget,
    currency,
    vibe,
    interests,
    dietary,
    culturalNeeds,
    moodBoardImageBase64,
    moodBoardMimeType,
  } = req.body;

  const safeCity = sanitizeUserInput(city || 'Jaipur');
  const safeEventType = sanitizeUserInput(eventType || 'Celebration');
  const safeVibe = sanitizeUserInput(vibe || 'Festive and memorable');
  const safeInterests = sanitizeUserInput(interests || 'Good food, music, photography');
  const safeCulturalNeeds = sanitizeUserInput(culturalNeeds || 'None specified');
  const safeDietary = Array.isArray(dietary) ? dietary.map((d: string) => sanitizeUserInput(d, 50)).join(', ') : 'None';
  const numericGuests = Math.max(1, parseInt(guestCount, 10) || 50);
  const numericBudget = Math.max(100, parseFloat(totalBudget) || 10000);
  const safeCurrency = sanitizeUserInput(currency || 'USD', 10);

  const promptText = `
Create an event plan for:
- Event Type: ${safeEventType}
- Event Date: ${date || 'Upcoming'}
- Host City: ${safeCity}
- Guest Count: ${numericGuests}
- Total Budget: ${safeCurrency} ${numericBudget}
- Aesthetic Vibe & Tone: ${safeVibe}
- Key Interests & Priorities: ${safeInterests}
- Dietary Accommodations: ${safeDietary}
- Cultural Traditions & Specific Needs: ${safeCulturalNeeds}

Important Planning Rules:
1. Budget categories must represent realistic industry-standard allocations for ${safeCity} and total exactly 100% with a 5-10% contingency included.
2. Timeline must count backward in weeksBefore from the event date down to weeksBefore: 0 (Day/Week of event).
3. Provide practical, high-value questions to ask prospective vendors and key checklist tasks.
4. Curate bespoke, memorable ideas deeply grounded in ${safeCity}'s culture and character.
5. All prices and amounts must be realistic estimates in ${safeCurrency}.
`;

  try {
    let contentsPayload: any = promptText;
    if (moodBoardImageBase64) {
      const cleanBase64 = moodBoardImageBase64.replace(/^data:[^;]+;base64,/, '');
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: moodBoardMimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: promptText + '\nNote: Also align the theme, decor suggestions, and ambiance with the attached mood board image.' },
        ],
      };
    }

    // Call Gemini with structured output
    let response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contentsPayload,
      config: {
        systemInstruction: PLANNER_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: EVENT_PLAN_GEMINI_SCHEMA,
        temperature: 0.7,
      },
    });

    let rawText = response.text || '{}';
    let parsedJson: any;

    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      // Retry once if JSON parse itself failed
      const retryResponse = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `${promptText}\n\nATTENTION: Your previous output was not valid JSON. You MUST return strictly valid JSON matching the schema.`,
        config: {
          systemInstruction: PLANNER_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: EVENT_PLAN_GEMINI_SCHEMA,
        },
      });
      parsedJson = JSON.parse(retryResponse.text || '{}');
    }

    // Validate with Zod
    const zodValidation = EventPlanSchema.safeParse(parsedJson);

    if (!zodValidation.success) {
      // Retry once with the specific Zod error fed back
      const errorDetails = JSON.stringify(zodValidation.error.format());
      const fixResponse = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `
Here is the previous event plan output that failed validation:
${JSON.stringify(parsedJson)}

Validation errors encountered:
${errorDetails}

Please fix these exact schema violations and output the corrected plan in valid JSON.
        `,
        config: {
          systemInstruction: PLANNER_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: EVENT_PLAN_GEMINI_SCHEMA,
        },
      });

      const fixedParsed = JSON.parse(fixResponse.text || '{}');
      const secondValidation = EventPlanSchema.safeParse(fixedParsed);
      if (secondValidation.success) {
        res.json({ plan: secondValidation.data });
        return;
      } else {
        // Fallback: fill defaults or report
        res.status(422).json({
          error: 'Event plan generation schema validation failed after retry.',
          details: secondValidation.error.format(),
        });
        return;
      }
    }

    res.json({ plan: zodValidation.data });
  } catch (err: any) {
    console.error('Plan generation error:', err?.message || err);
    res.status(500).json({
      error: 'Failed to generate event plan. Please check your inputs or try again.',
      details: err?.message || String(err),
    });
  }
});

/* -------------------------------------------------------------
 * 2. Rebalance Budget with AI
 * ------------------------------------------------------------- */
app.post('/api/plan/rebalance', async (req: Request, res: Response): Promise<void> => {
  const { budgetItems, totalBudget, currency, city, reason } = req.body;

  try {
    const prompt = `
Given the current event budget items in ${currency || 'USD'} (Total budget limit: ${totalBudget}):
${JSON.stringify(budgetItems, null, 2)}

Context / Reason for rebalance: "${sanitizeUserInput(reason || 'Actual spend adjustments or budget optimization')}".
Location: "${sanitizeUserInput(city || 'General')}".

Task:
Rebalance the budget items so that:
1. The percentages of all categories sum to exactly 100%.
2. A healthy contingency reserve (5-10%) is maintained.
3. Realistic amounts are recalculated based on the total budget of ${totalBudget}.
4. Provide an updated insider saving or negotiation tip for any category adjusted.
5. Return the revised budget array.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: PLANNER_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            budget: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  percent: { type: Type.NUMBER },
                  amount: { type: Type.NUMBER },
                  tip: { type: Type.STRING },
                  priority: { type: Type.STRING },
                },
                required: ['category', 'percent', 'amount', 'tip', 'priority'],
              },
            },
            rebalanceNotes: { type: Type.STRING },
          },
          required: ['budget', 'rebalanceNotes'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Rebalance error:', err);
    res.status(500).json({ error: 'Failed to rebalance budget with AI', details: err?.message });
  }
});

/* -------------------------------------------------------------
 * 3. Plan B Contingency Generator
 * ------------------------------------------------------------- */
app.post('/api/plan/plan-b', async (req: Request, res: Response): Promise<void> => {
  const { eventType, city, date, totalBudget, currency } = req.body;

  try {
    const prompt = `
Generate comprehensive contingency plans (Plan B) for a ${sanitizeUserInput(eventType)} scheduled on ${date} in ${sanitizeUserInput(city)} with a budget of ${currency} ${totalBudget}.

Provide 3 distinct contingency protocols:
1. "weather": Sudden extreme weather (rainstorm, extreme heat/cold, or windstorm).
2. "vendorNoShow": Critical vendor fails to show up on the day (e.g., caterer, photographer, DJ/band).
3. "budgetCut": A 20% budget reduction required midway through planning.

For each scenario, provide:
- scenario: Scenario title
- impact: Concrete operational impact
- actionSteps: 3-4 immediate step-by-step actions to execute
- budgetAdjustmentSummary: Financial consequence or reallocation recommendation
- alternativeOptions: 2-3 specific backup workarounds
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: PLANNER_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weather: {
              type: Type.OBJECT,
              properties: {
                scenario: { type: Type.STRING },
                impact: { type: Type.STRING },
                actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                budgetAdjustmentSummary: { type: Type.STRING },
                alternativeOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['scenario', 'impact', 'actionSteps'],
            },
            vendorNoShow: {
              type: Type.OBJECT,
              properties: {
                scenario: { type: Type.STRING },
                impact: { type: Type.STRING },
                actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                budgetAdjustmentSummary: { type: Type.STRING },
                alternativeOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['scenario', 'impact', 'actionSteps'],
            },
            budgetCut: {
              type: Type.OBJECT,
              properties: {
                scenario: { type: Type.STRING },
                impact: { type: Type.STRING },
                actionSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                budgetAdjustmentSummary: { type: Type.STRING },
                alternativeOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['scenario', 'impact', 'actionSteps'],
            },
          },
          required: ['weather', 'vendorNoShow', 'budgetCut'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const valid = PlanBResponseSchema.safeParse(parsed);
    if (valid.success) {
      res.json(valid.data);
    } else {
      res.json(parsed);
    }
  } catch (err: any) {
    console.error('Plan B generation error:', err);
    res.status(500).json({ error: 'Failed to generate Plan B contingency options', details: err?.message });
  }
});

/* -------------------------------------------------------------
 * 4. Real Vendor Search with Google Search Grounding
 * ------------------------------------------------------------- */
app.post('/api/vendors/search', async (req: Request, res: Response): Promise<void> => {
  const { category, city, currency, budgetLimit } = req.body;

  const safeCategory = sanitizeUserInput(category || 'Venues and Vendors');
  const safeCity = sanitizeUserInput(city || 'Jaipur');

  try {
    const prompt = `
Find top-rated real, verified ${safeCategory} in or near ${safeCity}.
Approximate budget guidance: ${currency || 'USD'} ${budgetLimit || 'Flexible'}.

List 3 to 5 real options. For each option, include:
- Name and specialty
- Approximate neighborhood or address in ${safeCity}
- Why they are reputable (e.g. awards, client feedback)
- Estimated price range or package level
- Direct web link or verified source citation

IMPORTANT: Never fabricate business names or details. Only recommend real businesses found via Google Search.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    
    // Extract grounding sources from candidate metadata
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks || [];
    const webSearchQueries = groundingMetadata?.webSearchQueries || [];

    const sources = groundingChunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({
        title: c.web.title,
        uri: c.web.uri,
      }));

    res.json({
      text,
      sources,
      searchQueries: webSearchQueries,
    });
  } catch (err: any) {
    console.error('Vendor search grounding error:', err);
    res.status(500).json({
      error: 'Could not fetch live grounded vendor recommendations.',
      details: err?.message,
    });
  }
});

/* -------------------------------------------------------------
 * 5. Ideas: Make Cheaper
 * ------------------------------------------------------------- */
app.post('/api/ideas/cheaper', async (req: Request, res: Response): Promise<void> => {
  const { idea, city, currency } = req.body;

  try {
    const prompt = `
Given this event idea:
Title: "${sanitizeUserInput(idea.title)}"
Description: "${sanitizeUserInput(idea.description)}"
Current Est Cost: "${idea.estCost}"
Location: "${sanitizeUserInput(city || 'General')}"

Propose a creative, low-cost or DIY alternative that achieves 90% of the same charm and delight for 30-50% less cost in ${currency || 'USD'}.
Provide:
- title: A revised title highlighting the clever/DIY angle
- description: Clear execution instructions
- estCost: Realistic lower estimated cost
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            estCost: { type: Type.STRING },
          },
          required: ['title', 'description', 'estCost'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ idea: parsed });
  } catch (err: any) {
    console.error('Make cheaper error:', err);
    res.status(500).json({ error: 'Failed to create budget-friendly idea', details: err?.message });
  }
});

/* -------------------------------------------------------------
 * 6. Ideas: Regenerate
 * ------------------------------------------------------------- */
app.post('/api/ideas/regenerate', async (req: Request, res: Response): Promise<void> => {
  const { vibe, city, eventType, existingTitles } = req.body;

  try {
    const prompt = `
Generate 1 brand new, creative idea for an event:
- Event: ${sanitizeUserInput(eventType || 'Celebration')}
- City: ${sanitizeUserInput(city || 'Jaipur')}
- Vibe: ${sanitizeUserInput(vibe || 'Festive and warm')}
- Exclude already existing ideas: ${(existingTitles || []).join(', ')}

Provide:
- title: Punchy, evocative idea title
- description: 2-3 sentence engaging concept description
- estCost: Estimated cost with currency symbol
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            estCost: { type: Type.STRING },
          },
          required: ['title', 'description', 'estCost'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ idea: parsed });
  } catch (err: any) {
    console.error('Regenerate idea error:', err);
    res.status(500).json({ error: 'Failed to regenerate idea', details: err?.message });
  }
});

/* -------------------------------------------------------------
 * 7. Mood Board Multimodal Analysis
 * ------------------------------------------------------------- */
app.post('/api/moodboard/analyze', async (req: Request, res: Response): Promise<void> => {
  const { imageBase64, mimeType } = req.body;

  if (!imageBase64) {
    res.status(400).json({ error: 'Missing imageBase64' });
    return;
  }

  try {
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const prompt = `
Analyze this mood board or venue image for an upcoming celebration.
Extract:
1. A refined color palette of 5 harmonious colors (exact Hex code #RRGGBB, color name, and role e.g. "Primary", "Vibrant Accent", "Warm Neutral", "Metallic Trim", "Deep Base").
2. An evocative style descriptor phrase (e.g. "Regal Rajasthani Opulence with Modern Minimalist Florals").
3. 5 aesthetic keywords (e.g., "Hand-blocked prints", "Floating urlis", "Brass accents").
4. 4 concrete decor suggestions directly inspired by this visual inspiration.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            palette: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hex: { type: Type.STRING },
                  name: { type: Type.STRING },
                  role: { type: Type.STRING },
                },
                required: ['hex', 'name', 'role'],
              },
            },
            styleDescriptor: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            decorSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['palette', 'styleDescriptor', 'keywords', 'decorSuggestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const valid = MoodBoardAnalysisSchema.safeParse(parsed);
    if (valid.success) {
      res.json(valid.data);
    } else {
      res.json(parsed);
    }
  } catch (err: any) {
    console.error('Moodboard analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze mood board image', details: err?.message });
  }
});

/* -------------------------------------------------------------
 * 8. Invitation Generator (3 tones, multilingual)
 * ------------------------------------------------------------- */
app.post('/api/invitations/generate', async (req: Request, res: Response): Promise<void> => {
  const { eventTitle, date, city, language, vibe, customNote } = req.body;

  const safeLang = ['English', 'Hindi', 'Spanish', 'French'].includes(language) ? language : 'English';

  try {
    const prompt = `
Generate event invitation wording in ${safeLang} for:
Event: "${sanitizeUserInput(eventTitle || 'Our Celebration')}"
Date: "${date || 'Soon'}"
City / Venue: "${sanitizeUserInput(city || 'Jaipur')}"
Vibe: "${sanitizeUserInput(vibe || 'Warm and celebratory')}"
Custom Note / Hosts: "${sanitizeUserInput(customNote || '')}"

Create 3 distinct tones:
1. "formal": Poetic, elegant, timeless, etiquette-conscious.
2. "celebratory": Warm, joyful, heartfelt, family-centered.
3. "casual": Modern, upbeat, crisp, fun.

For each tone, provide:
- headline: Catchy invitation headline
- body: Beautifully structured invitation message (with placeholder lines for RSVP by date and dress code)
- rsvpCallout: Friendly RSVP instruction line
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            formal: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                body: { type: Type.STRING },
                rsvpCallout: { type: Type.STRING },
              },
              required: ['headline', 'body', 'rsvpCallout'],
            },
            celebratory: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                body: { type: Type.STRING },
                rsvpCallout: { type: Type.STRING },
              },
              required: ['headline', 'body', 'rsvpCallout'],
            },
            casual: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                body: { type: Type.STRING },
                rsvpCallout: { type: Type.STRING },
              },
              required: ['headline', 'body', 'rsvpCallout'],
            },
          },
          required: ['formal', 'celebratory', 'casual'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Invitation generator error:', err);
    res.status(500).json({ error: 'Failed to generate invitations', details: err?.message });
  }
});

/* -------------------------------------------------------------
 * 9. Refine Chat Panel with Function Calling Tools
 * ------------------------------------------------------------- */
app.post('/api/chat/refine', async (req: Request, res: Response): Promise<void> => {
  const { message, planSummary } = req.body;

  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  const safeMessage = sanitizeUserInput(message, 500);

  try {
    const prompt = `
You are the Gatherly Event Assistant. The user wants to adjust their event plan.
Current Plan Context:
${JSON.stringify(planSummary)}

User Request: "${safeMessage}"

If the user wants to adjust budget numbers, add timeline tasks, add vendor diligence questions/checklist items, or remove ideas, USE THE PROVIDED TOOLS:
- updateBudget(category, newAmount, reason)
- addTimelineTask(task, weeksBefore, category)
- addVendorItem(category, item, type)
- removeIdea(ideaTitle)

If no tool action is needed, reply directly with friendly advice and pro tips. Keep responses concise and focused on high-quality event planning.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: PLANNER_SYSTEM_PROMPT,
        tools: [{ functionDeclarations: CHAT_TOOLS }],
      },
    });

    const functionCalls = response.functionCalls || [];
    const text = response.text || '';

    res.json({
      reply: text,
      toolCalls: functionCalls.map((fc: any) => ({
        name: fc.name,
        args: fc.args,
      })),
    });
  } catch (err: any) {
    console.error('Chat refine error:', err);
    res.status(500).json({ error: 'Assistant processing failed', details: err?.message });
  }
});

/* -------------------------------------------------------------
 * Start Server & Vite dev middleware / static serving
 * ------------------------------------------------------------- */
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Gatherly server running on http://0.0.0.0:${port}`);
  });
}

startServer();
