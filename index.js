require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

const OWNER_ID = process.env.OWNER_ID;

// Database sederhana RAM
const userPoints = {};

// Generate random string
function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

// Generate fake email
function generateFakeEmail() {
  const prefixList = [
    'cemy',
    'vemy',
    'lemy',
    'xemy',
    'emyx',
    'zemy',
    'emyc',
    'qemy',
    'emyz'
  ];

  const randomPrefix = prefixList[Math.floor(Math.random() * prefixList.length)];
  const randomPart = randomString(6);
  
  const email = `${randomPrefix}${randomPart}@gmail.com`;
  const password = `${randomPrefix}${randomString(8)}`;

  return {
    email,
    password,
  };
}

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.first_name;

  // Default point
  if (!userPoints[chatId]) {
    userPoints[chatId] = 20;
  }

  const menu = `
🤖 FAKE EMAIL GENERATOR BOT

Halo ${username} 👋

📌 MENU:

/CreateMailR
/CheckPoint
/TopupPoint

⚠️ Bot ini hanya membuat email baru, gunakan secara bijak.
`;

  bot.sendMessage(chatId, menu);
});

// Create fake mail
bot.onText(/\/CreateMailR/, (msg) => {
  const chatId = msg.chat.id;

  if (!userPoints[chatId]) {
    userPoints[chatId] = 20;
  }

  // Cek point
  if (userPoints[chatId] < 5) {
    return bot.sendMessage(chatId, `
❌ POINT TIDAK CUKUP

Minimal 5 point untuk membuat email.
Gunakan /TopupPoint
`);
  }

  userPoints[chatId] -= 5;

  const fakeData = generateFakeEmail();

  const response = `
✅ EMAIL BERHASIL DIBUAT

📧 EMAIL: ${fakeData.email}
🔑 PASSWORD: ${fakeData.password}

💎 POINT DIGUNAKAN: 5
💰 SISA POINT: ${userPoints[chatId]}

⚠️ Fake Generator System
`;

  bot.sendMessage(chatId, response);
});

// Check point
bot.onText(/\/CheckPoint/, (msg) => {
  const chatId = msg.chat.id;

  if (!userPoints[chatId]) {
    userPoints[chatId] = 20;
  }

  bot.sendMessage(chatId, `💰 Sisa Point Kamu: ${userPoints[chatId]} Point.`);
});

// Contoh sederhana untuk TopupPoint (agar fitur di menu tidak kosong)
bot.onText(/\/TopupPoint/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `ℹ️ Untuk topup point, silakan hubungi admin/owner di ID: ${OWNER_ID || 'Belum diatur'}`);
});

console.log('Bot berjalan...');
