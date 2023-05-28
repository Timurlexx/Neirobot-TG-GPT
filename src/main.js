import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { code } from 'telegraf/format';
import config from 'config';
import { ogg } from './ogg.js';
import { openai } from './openai.js';
import { removeFile } from './utils.js';
import { initCommand, processTextToChat, INITIAL_SESSION } from './logic.js';

// Создание экземпляра бота с использованием токена Telegram из конфигурации
const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));

// Использование сессий для хранения данных о сеансе с каждым пользователем
bot.use(session());

// Обработчик команды /new
bot.command('new', initCommand);

// Обработчик команды /start
bot.command('start', initCommand);

// Обработчик голосовых сообщений
bot.on(message('voice'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code('Сообщение принял. Жду ответ от сервера...'));

    // Получение ссылки на файл голосового сообщения
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);

    // Создание ogg-файла из голосового сообщения
    const oggPath = await ogg.create(link.href, userId);

    // Преобразование ogg-файла в mp3
    const mp3Path = await ogg.toMp3(oggPath, userId);

    // Удаление временного ogg-файла
    removeFile(oggPath);

    // Получение текстовой транскрипции из mp3-файла с помощью OpenAI
    const text = await openai.transcription(mp3Path);
    await ctx.reply(code(`Ваш запрос: ${text}`));

    // Обработка текстовой транскрипции
    await processTextToChat(ctx, text);
  } catch (e) {
    console.log(`Ошибка при голосовом сообщении`, e.message);
  }
});

// Обработчик текстовых сообщений
bot.on(message('text'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code('Сообщение отправлено. Ждем ответ от сервера...'));

    // Обработка текстового сообщения
    await processTextToChat(ctx, ctx.message.text);
  } catch (e) {
    console.log(`Ошибка при текстовом сообщении`, e.message);
  }
});

// Запуск бота
bot.launch();

// Обработка сигналов SIGINT и SIGTERM для остановки бота
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
