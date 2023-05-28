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
    ctx.session.messages.push({ role: openai.roles.USER, content });
    const response = await openai.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });

    const language = franc(content);
    let audioOptions;

    if (language === 'rus') {
      audioOptions = {
        lang: 'ru',
        slow: false,
        speed: 2,
        voice: 'ru-RU-Wavenet-D',
      };
    } else {
      audioOptions = {
        lang: 'en',
        slow: false,
        speed: 2,
        voice: 'en-US-Wavenet-D',
      };
    }

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
