require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

const OWNER_ID = process.env.OWNER_ID;

// Database sederhana RAM
const userPoints = {};

// Daftar nama depan yang cocok dikombinasikan dengan unsur "Emy"
const firstNames = [
  'andi', 'budi', 'rizky', 'fajar', 'dika', 'reza', 'tomi', 'kevin', 'putra', 'ari',
  'siti', 'dewi', 'amanda', 'putri', 'santi', 'mega', 'rara', 'nisa', 'via', 'ayu',
  'ahmad', 'raffi', 'daffa', 'fian', 'gali', 'hadi', 'ilham', 'joko', 'kiki', 'lucky'
];

// Variasi unsur "Emy" untuk nama belakang (Last Name) sesuai request
const emyLastNames = ['emy', 'emyx', 'zemy', 'cemy', 'xemy', 'emyc', 'emyz', 'vemy', 'lemy', 'qemy'];

// Daftar domain email variatif
const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

// Generate random string untuk password yang kuat
function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate fake email dengan format nama + unsur Emy yang realistis
function generateFakeEmail() {
  // 1. Pilih nama depan, variasi emy, dan domain secara acak
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const emyLastName = emyLastNames[Math.floor(Math.random() * emyLastNames.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  
  // 2. Buat angka acak dan format tahun untuk tambahan variasi manis
  const randomNum = Math.floor(Math.random() * 899) + 100; // Angka acak 3 digit (100-999)
  const shortYear = new Date().getFullYear().toString().slice(-2); // Dua angka belakang tahun saat ini

  // 3. Struktur variasi pola email (4 kombinasi berbeda)
  const patternType = Math.floor(Math.random() * 4);
  let emailName = '';

  switch (patternType) {
    case 0:
      // Pola langsung menyambung + angka acak: andiemy999
      emailName = `${firstName}${emyLastName}${randomNum}`;
      break;
    case 1:
      // Pola menggunakan titik + tahun: budi.zemy26
      emailName = `${firstName}.${emyLastName}${shortYear}`;
      break;
    case 2:
      // Pola bersih dengan titik: rizky.cemy
      emailName = `${firstName}.${emyLastName}`;
      break;
    case 3:
      // Pola langsung tanpa angka: fajaremyx
      emailName = `${firstName}${emyLastName}`;
      break;
  }

  const email = `${emailName}@${domain}`;
  const password = `${emyLastName}${randomString(8)}`;

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
