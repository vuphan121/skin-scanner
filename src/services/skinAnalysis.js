/**
 * Validates a single photo: checks for a visible human face and acceptable image quality.
 * Uses gpt-4o with detail:high for reliable human-vs-animal detection.
 *
 * @param {string} dataUrl - base64 data URL of the photo
 * @returns {Promise<{ valid: boolean, reason: string }>}
 */
export async function validatePhoto(dataUrl) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('No API key — set VITE_OPENAI_API_KEY in .env')

  const prompt = `You are a strict gatekeeper for a human skin-analysis app. Your only job is to decide whether this photo shows a real human face.

FIRST, identify what the main subject of the photo is.
- If it is a human face → ACCEPT (even with glasses, blur, shadows, angle, or low light)
- If it is ANYTHING else → REJECT

REJECT immediately if the subject is:
- A cat, dog, bird, or any other animal (even if the animal looks humanlike or is wearing clothes)
- A cartoon, drawing, painting, illustration, or CGI face
- A doll, mannequin, or mask
- An object, background, food, or scene with no face
- A completely black, white, or featureless image

Do NOT be fooled by animal faces that have human-like features (e.g. a cat with big eyes). Animal fur, snout, whiskers, or non-human ear placement are all automatic rejections.

Respond ONLY with valid JSON, no markdown:
{ "valid": true }
or
{ "valid": false, "reason": "<one short sentence>" }`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    // If parsing fails, assume valid (fail-open so a parse glitch doesn't block the user)
    return { valid: true }
  }
}

/**
 * Calls the OpenAI GPT-4o vision API with 3 face photos + form data.
 *
 * @param {string[]} photos   - [center, left, right] data URLs
 * @param {object}   formData - { age, skinType, concerns, routine, sleep, hydration }
 * @returns {Promise<{
 *   faceDetected: boolean,
 *   faceReason?: string,
 *   skinType?: string,
 *   detectedConcerns?: string[],
 *   headline?: string,
 *   description?: string,
 *   issues?: string[],
 *   advice?: string,
 *   scores?: { hydration: number, firmness: number, radiance: number, evenness: number, clarity: number }
 * }>}
 */
export async function analyzeWithAI(photos, formData, lang = 'vi') {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('No API key — set VITE_OPENAI_API_KEY in .env')

  const prompt = `You are a professional dermatology AI assistant. You will receive THREE photos of the same person's face: center, left angle, and right angle.

STEP 1 — FACE VALIDATION
Check whether ALL THREE photos show a human face. Be LENIENT — real-world selfies are often slightly blurry, imperfectly lit, or at an angle. That is fine.

Only reject a photo if it CLEARLY has NO face at all:
- The photo shows an object, wall, background, or non-human subject
- The face is so small it is basically invisible (less than 10% of the frame)
- It is completely black or completely white with nothing visible

DO NOT reject for: slight blur, low light, imperfect angle, uneven lighting, shadows, motion blur, glasses, or partial hair covering. These are acceptable.

If ANY photo has truly no face, respond ONLY with:
{ "faceDetected": false, "faceReason": "<which photo and what is shown instead of a face>" }

STEP 2 — SKIN ANALYSIS (only if all photos pass)
User profile:
- Age range: ${formData?.age || 'not provided'}
- Self-reported skin type: ${formData?.skinType || 'not provided'}
- Self-reported concerns: ${formData?.concerns?.join(', ') || 'none'}
- Current routine: ${formData?.routine || 'not provided'}
- Sleep & stress: ${formData?.sleep || 'not provided'}
- Hydration: ${formData?.hydration || 'not provided'}

SKIN TYPE — assign exactly one:
• oily        — visibly shiny/greasy, enlarged pores, prone to breakouts
• dry         — tight, flaky, rough or dull texture, lacks glow
• combination — oily T-zone, dry or normal cheeks
• sensitive   — redness, visible capillaries, reactive-looking skin
• normal      — balanced, even texture

DETECTABLE CONCERNS — only what you can see in the photos OR is confirmed by form:
acne | excess oil | clogged pores | blackheads | dark spots | hyperpigmentation | melasma | post-acne dark spots | dryness | dehydration | sensitive skin | irritation | redness | anti-aging | fine lines | wrinkles | dull skin | uneven skin tone | large pores | UV protection

SKIN AGE — estimate the visible cosmetic skin age as an integer (may differ from chronological age based on visible signs of aging, hydration, texture, and radiance).

AI CONFIDENCE — your confidence in this assessment as a percentage (0–100), based on photo quality and visibility.

MAIN CONCERN — provide the user's single most notable skin concern as two translations:
- primaryConcernVi: short phrase in Vietnamese (max 8 words)
- primaryConcernEn: short phrase in English (max 8 words)

BILINGUAL TEXT — always return BOTH Vietnamese and English for headline, description, and advice so the app can switch languages without re-calling the API:
- headlineVi / headlineEn: 6–10 words summarising the skin condition
- descriptionVi / descriptionEn: 2–3 sentences about visible skin characteristics
- adviceVi / adviceEn: one specific, actionable skincare tip

SKIN SCORES — rate each dimension 0–100:
- hydration (0–100, higher = better): moisture level visible in skin plumpness and texture
- firmness  (0–100, higher = better): skin elasticity and absence of sagging
- radiance  (0–100, higher = better): overall glow, brightness and complexion evenness
- texture   (0–100, higher = MORE concern): roughness, unevenness of skin surface
- fineLines (0–100, higher = MORE concern): visibility of fine lines and wrinkles
- darkSpots (0–100, higher = MORE concern): presence of dark spots, hyperpigmentation, uneven tone
- barrierHealth (0–100, higher = better): skin barrier strength — absence of redness, sensitivity, or irritation

Respond ONLY with valid JSON (no markdown):
{
  "faceDetected": true,
  "skinAge": <integer>,
  "confidence": <0-100>,
  "skinType": "<one of: oily | dry | combination | sensitive | normal>",
  "primaryConcernVi": "<short phrase in Vietnamese>",
  "primaryConcernEn": "<short phrase in English>",
  "detectedConcerns": ["<concern1>", "<concern2>"],
  "headlineVi": "<6–10 words in Vietnamese>",
  "headlineEn": "<6–10 words in English>",
  "descriptionVi": "<2–3 sentences in Vietnamese about visible characteristics>",
  "descriptionEn": "<2–3 sentences in English about visible characteristics>",
  "adviceVi": "<one actionable tip in Vietnamese>",
  "adviceEn": "<one actionable tip in English>",
  "scores": {
    "hydration": <0-100>,
    "firmness": <0-100>,
    "radiance": <0-100>,
    "texture": <0-100>,
    "fineLines": <0-100>,
    "darkSpots": <0-100>,
    "barrierHealth": <0-100>
  }
}`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1400,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: photos[0], detail: 'low' } },
          { type: 'image_url', image_url: { url: photos[1], detail: 'low' } },
          { type: 'image_url', image_url: { url: photos[2], detail: 'low' } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}
