
const API_BASE_URL = 'https://api.pro-talk.ru/api/v1.0';
const BOT_ID = 49241;
const BOT_TOKEN = 'sl8Rzc0upUuwuymkRPzHJXGJONwUwusZ';

interface ProTalkResponse {
  done: string;
}

export const sendMessageToBot = async (ticketId: string, message: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ask/${BOT_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bot_id: BOT_ID,
        chat_id: ticketId,
        message: message,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) return "Ошибка авторизации бота (401).";
      if (response.status === 400) return "Некорректный запрос к боту (400).";
      return `Ошибка API Pro-Talk: ${response.status}`;
    }

    const data: ProTalkResponse = await response.json();
    return data.done || "Бот не вернул текстового ответа.";
  } catch (error) {
    console.error("Pro-Talk connection failed:", error);
    return "Не удалось соединиться с сервером Pro-Talk.";
  }
};
