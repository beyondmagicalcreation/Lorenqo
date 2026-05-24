const OpenAI = require('openai');

// All languages including Darija ↔ all directions
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

async function translateAll(text, fromLang) {
  if (!text?.trim()) {
    return { content_nl: '', content_ma_arab: '', content_ma_franco: '', content_fr: '', content_en: '' };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    return { content_nl: null, content_ma_arab: null, content_ma_franco: null, content_fr: null, content_en: null };
  }

  const client = new OpenAI({ apiKey });

  const LANG_NAMES = { nl: 'Dutch', fr: 'French', ma: 'Moroccan Darija', en: 'English' };

  try {
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
      content_ma_franco: json.ma_franco || (fromLang === 'ma' ? text : null),
      content_fr: json.fr || (fromLang === 'fr' ? text : null),
      content_en: json.en || (fromLang === 'en' ? text : null),
    };
  } catch (err) {
    console.error(`Translation failed (${fromLang} → all):`, err.message);
    return { content_nl: null, content_ma_arab: null, content_ma_franco: null, content_fr: null, content_en: null };
  }
}

module.exports = { translateAll };
