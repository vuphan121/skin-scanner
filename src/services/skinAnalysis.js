/**
 * Validates a single photo: checks for a visible face and acceptable image quality.
 * Uses gpt-4o-mini (cheap) — only a yes/no check.
 *
 * @param {string} dataUrl - base64 data URL of the photo
 * @returns {Promise<{ valid: boolean, reason: string }>}
 */
export async function validatePhoto(dataUrl) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('No API key — set VITE_OPENAI_API_KEY in .env')

  const prompt = `You are checking whether a selfie is usable for skin analysis.

ACCEPT the photo if it shows a human face — even if it is slightly blurry, dimly lit, has motion blur, uneven lighting, glasses, or is taken at an angle. Real selfies are rarely perfect; that is fine.

REJECT the photo ONLY if:
1. There is clearly NO human face in the image (e.g. a wall, object, pet, or completely blank image)
2. The face is so severely blurry or dark that NO facial features (eyes, nose, mouth) can be distinguished at all

Respond ONLY with valid JSON, no markdown:
{ "valid": true }
or
{ "valid": false, "reason": "<one short sentence explaining what is wrong>" }`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
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
export async function analyzeWithAI(photos, formData) {
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

SKIN SCORES — rate each dimension 0–100 (higher = better skin health):
- hydration:  moisture level visible in skin plumpness and texture
- firmness:   skin elasticity and absence of sagging or fine lines
- radiance:   overall glow, brightness and evenness of complexion
- evenness:   uniformity of skin tone, absence of dark spots or redness
- clarity:    absence of blemishes, acne, clogged pores, and breakouts

Respond ONLY with valid JSON (no markdown):
{
  "faceDetected": true,
  "skinType": "<skin type>",
  "detectedConcerns": ["<concern1>", "<concern2>"],
  "headline": "<6–10 words describing this person's skin>",
  "description": "<2–3 sentences about visible characteristics across all three angles>",
  "issues": ["<visible issue 1>", "<visible issue 2>", "<visible issue 3>"],
  "advice": "<one specific, actionable tip based on photo + profile>",
  "scores": {
    "hydration": <0-100>,
    "firmness": <0-100>,
    "radiance": <0-100>,
    "evenness": <0-100>,
    "clarity": <0-100>
  }
}`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 800,
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
