import { openai } from './openai.js';
import gtts from 'google-tts-api';
import franc from 'franc';

export const INITIAL_SESSION = {
  messages: [],
};

export async function initCommand(ctx) {
  ctx.session = INITIAL_SESSION;
  await ctx.reply('Запишите голосовое или текстовое сообщение');
}

export async function processTextToChat(ctx, content) {
  try {
    // Добавляем сообщение пользователя в сессию
    ctx.session.messages.push({ role: openai.roles.USER, content });

    // Получаем ответ от OpenAI GPT
    const response = await openai.chat(ctx.session.messages);

    // Добавляем ответ от GPT в сессию
    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });

    // Определяем язык введенного текста с помощью библиотеки franc
    const language = franc(content, { minLength: 3, whitelist: ['eng', 'rus', 'fra', 'spa', 'ita', 'deu', 'zho', 'jpn', 'kor', 'ara', 'por', 'nld', 'tur', 'hin', 'ind', 'ben'] });
    let audioOptions;

    // Устанавливаем параметры для озвучки текста
    switch (language) {
      case 'rus':
        audioOptions = { lang: 'ru', slow: false, speed: 2, voice: 'ru-RU-Wavenet-D' }; // Russian voice
        break;
      case 'fra':
        audioOptions = { lang: 'fr', slow: false, speed: 2, voice: 'fr-FR-Wavenet-D' }; // French voice
        break;
      case 'spa':
        audioOptions = { lang: 'es', slow: false, speed: 2, voice: 'es-ES-Wavenet-D' }; // Spanish voice
        break;
      case 'ita':
        audioOptions = { lang: 'it', slow: false, speed: 2, voice: 'it-IT-Wavenet-D' }; // Italian voice
        break;
      case 'deu':
        audioOptions = { lang: 'de', slow: false, speed: 2, voice: 'de-DE-Wavenet-D' }; // German voice
        break;
      // Additional languages
      case 'zho':
        audioOptions = { lang: 'zh-CN', slow: false, speed: 2, voice: 'cmn-CN-Wavenet-D' }; // Simplified Chinese voice
        break;
      case 'jpn':
        audioOptions = { lang: 'ja', slow: false, speed: 2, voice: 'ja-JP-Wavenet-D' }; // Japanese voice
        break;
      case 'kor':
        audioOptions = { lang: 'ko', slow: false, speed: 2, voice: 'ko-KR-Wavenet-D' }; // Korean voice
        break;
      case 'ara':
        audioOptions = { lang: 'ar', slow: false, speed: 2, voice: 'ar-XA-Wavenet-D' }; // Arabic voice
        break;
      case 'por':
        audioOptions = { lang: 'pt', slow: false, speed: 2, voice: 'pt-BR-Wavenet-D' }; // Portuguese voice
        break;
      case 'nld':
        audioOptions = { lang: 'nl', slow: false, speed: 2, voice: 'nl-NL-Wavenet-D' }; // Dutch voice
        break;
      case 'tur':
        audioOptions = { lang: 'tr', slow: false, speed: 2, voice: 'tr-TR-Wavenet-D' }; // Turkish voice
        break;
      case 'hin':
        audioOptions = { lang: 'hi', slow: false, speed: 2, voice: 'hi-IN-Wavenet-D' }; // Hindi voice
        break;
      case 'ind':
        audioOptions = { lang: 'id', slow: false, speed: 2, voice: 'id-ID-Wavenet-D' }; // Indonesian voice
        break;
      case 'ben':
        audioOptions = { lang: 'bn', slow: false, speed: 2, voice: 'bn-BD-Wavenet-D' }; // Bengali voice
        break;
      default:
        audioOptions = { lang: 'en', slow: false, speed: 2, voice: 'en-US-Wavenet-D' }; // Default to English voice
    }

    // Получаем аудио-данные с помощью Google TTS API
    const audioData = await gtts.getAllAudioBase64(response.content, audioOptions);

    // Отправка текстового сообщения пользователю
    await ctx.reply(response.content);

    // Отправка аудио сообщения пользователю
    for (const { base64 } of audioData) {
      await ctx.replyWithVoice({ source: Buffer.from(base64, 'base64') });
    }
  } catch (error) {
    console.log('Ошибка при обработке текста в речь или GPT', error.message);
  }
}
