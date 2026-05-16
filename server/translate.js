const OpenAI = require('openai');

const LANG_NAMES = { nl: 'Dutch', fr: 'French', ma: 'Moroccan Darija', en: 'English' };

// Darija → other language (already working well)
function buildDarijaPrompt(text, targetLanguage) {
  return `You are an expert translator specializing in Moroccan Darija dialect.
Moroccan Darija uses many French loanwords and Arabic roots.

Translate this Moroccan Darija phrase to ${targetLanguage}:
"${text}"

Rules:
- NEVER return the original Darija text
- Always return a natural translation in ${targetLanguage}
- "finki?" = "where are you?" in English = "waar ben je?" in Dutch = "tu es où?" in French
- "labas?" = "are you ok?" = "gaat het?" in Dutch = "ça va?" in French = "are you ok?" in English
- If unsure, make your best translation attempt

Return ONLY the translated text, nothing else.`;
}

// NL/FR/EN → all languages including Darija
const MULTI_SYSTEM_PROMPT = `You are an expert translator for Moroccan Darija dialect and European languages.

CRITICAL RULES FOR DARIJA (ma_arab and ma_franco):
- NEVER transliterate — always translate the MEANING into natural Darija
- Dutch 'vandaag' → Darija 'lyoma' (ليوما), NEVER 'فونداغ'
- Dutch 'bellen' → Darija 'ntiyfu' (نطيفو) or 'nsewwel'
- Dutch 'gaan' → Darija 'nmshiw' (نمشيو)
- Dutch 'morgen' → Darija 'ghda' (غدا)
- Dutch 'dank je' / French 'merci' → Darija 'shokran' (شكران)
- Dutch 'ja' / French 'oui' → Darija 'iyeh' (إيه)
- Dutch 'nee' / French 'non' → Darija 'la' (لا)
- Dutch 'hoe gaat het' → Darija 'kidayr/kidayra' (كيداير)
- Dutch 'goedemorgen' → Darija 'sbah l-khir' (صباح الخير)
- For ma_arab: write in proper Moroccan Darija Arabic script, NOT phonetic Dutch/French words
- For ma_franco: use natural Darija romanization (3=ع, 7=ح, 9=ق, gh=غ, sh=ش, kh=خ)
- Always return what a native Darija speaker would naturally say

Return ONLY a valid JSON object with exactly these 5 keys:
{"nl": "Dutch text", "ma_arab": "Moroccan Darija in Arabic script", "ma_franco": "Moroccan Darija in Latin", "fr": "French text", "en": "English text"}`;

// Darija text → Arabic script + Franco (for when source is already Darija)
const DARIJA_SCRIPT_PROMPT = `You are an expert in Moroccan Darija writing systems.

The input text is already in Moroccan Darija. Convert it to both writing systems:
- ma_arab: proper Moroccan Darija in Arabic script (NOT phonetic transcription of any European language)
- ma_franco: Darija in Franco/Latin notation (3=ع, 7=ح, 9=ق, gh=غ, sh=ش)

IMPORTANT: The input is already Darija. Just write the same meaning in the two scripts.
Return ONLY a JSON object: {"ma_arab": "...", "ma_franco": "..."}`;

async function translateAll(text, fromLang) {
  if (!text?.trim()) {
    return { content_nl: '', content_ma_arab: '', content_ma_franco: '', content_fr: '', content_en: '' };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    return { content_nl: null, content_ma_arab: null, content_ma_franco: null, content_fr: null, content_en: null };
  }

  const client = new OpenAI({ apiKey });

  try {
    if (fromLang === 'ma') {
      const [nlRes, frRes, enRes, scriptRes] = await Promise.all([
        client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: buildDarijaPrompt(text, 'Dutch') }],
        }),
        client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: buildDarijaPrompt(text, 'French') }],
        }),
        client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: buildDarijaPrompt(text, 'English') }],
        }),
        client.chat.completions.create({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: DARIJA_SCRIPT_PROMPT },
            { role: 'user', content: text },
          ],
        }),
      ]);

      const scripts = JSON.parse(scriptRes.choices[0].message.content);
      return {
        content_nl: nlRes.choices[0].message.content?.trim() || null,
        content_fr: frRes.choices[0].message.content?.trim() || null,
        content_en: enRes.choices[0].message.content?.trim() || null,
        content_ma_arab: scripts.ma_arab || null,
        content_ma_franco: scripts.ma_franco || text,
      };
    } else {
      const fromName = LANG_NAMES[fromLang] || fromLang;
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: MULTI_SYSTEM_PROMPT },
          { role: 'user', content: `Source language: ${fromName}\nText: ${text}` },
        ],
      });

      const json = JSON.parse(completion.choices[0].message.content);
      return {
        content_nl: json.nl || (fromLang === 'nl' ? text : null),
        content_ma_arab: json.ma_arab || null,
        content_ma_franco: json.ma_franco || null,
        content_fr: json.fr || (fromLang === 'fr' ? text : null),
        content_en: json.en || (fromLang === 'en' ? text : null),
      };
    }
  } catch (err) {
    console.error(`Translation failed (${fromLang} → all):`, err.message);
    return { content_nl: null, content_ma_arab: null, content_ma_franco: null, content_fr: null, content_en: null };
  }
}

module.exports = { translateAll };
