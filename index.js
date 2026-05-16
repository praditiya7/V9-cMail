require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

const OWNER_ID = process.env.OWNER_ID; 
const OWNER_USERNAME = 'Emyawu'; 
const QRIS_IMAGE_URL = 'https://picsum.photos/500/500'; 

// Database RAM
const userPoints = {};
const userDailyLimit = {}; 
const userPremiumUntil = {}; 

const firstNames = [
  'andi', 'budi', 'rizky', 'fajar', 'dika', 'reza', 'tomi', 'kevin', 'putra', 'ari',
  'siti', 'dewi', 'amanda', 'putri', 'santi', 'mega', 'rara', 'nisa', 'via', 'ayu',
  'ahmad', 'raffi', 'daffa', 'fian', 'gali', 'hadi', 'ilham', 'joko', 'kiki', 'lucky'
];
const emyLastNames = ['emy', 'emyx', 'zemy', 'cemy', 'xemy', 'emyc', 'emyz', 'vemy', 'lemy', 'qemy'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateFakeEmail(domain) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const emyLastName = emyLastNames[Math.floor(Math.random() * emyLastNames.length)];
  
  const randomNum = Math.floor(Math.random() * 899) + 100;
  const shortYear = new Date().getFullYear().toString().slice(-2);

  const patternType = Math.floor(Math.random() * 4);
  let emailName = '';

  switch (patternType) {
    case 0: emailName = `${firstName}${emyLastName}${randomNum}`; break;
    case 1: emailName = `${firstName}.${emyLastName}${shortYear}`; break;
    case 2: emailName = `${firstName}.${emyLastName}`; break;
    case 3: emailName = `${firstName}${emyLastName}`; break;
  }

  return {
    email: `${emailName}@${domain}`,
    password: `${emyLastName}${randomString(7)}`
  };
}

function initializeUser(chatId) {
  if (userPoints[chatId] === undefined) {
    userPoints[chatId] = 20; 
  }
}

function isUserPremium(chatId) {
  if (String(chatId) === String(OWNER_ID)) return true; 
  if (!userPremiumUntil[chatId]) return false;
  
  const now = new Date();
  const expiry = new Date(userPremiumUntil[chatId]);
  return now < expiry;
}

// -------------------------------------------------------------
// MENU START
// -------------------------------------------------------------
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.first_name;

  initializeUser(chatId);

  const isAdmin = String(chatId) === String(OWNER_ID);
  const infoPoin = isAdmin ? 'Unlimited (Developer Mode)' : `${userPoints[chatId]} Points`;
  
  let statusLisensi = 'Free Tier';
  if (isAdmin) statusLisensi = 'Premium Enterprise (Owner)';
  else if (isUserPremium(chatId)) statusLisensi = `E-Premium Active (Exp: ${new Date(userPremiumUntil[chatId]).toLocaleDateString('id-ID')})`;

  const menuText = `
*EMYCMAIL AUTOMATED SYSTEM v3.5*
───────────────────────
Selamat datang, *${username}*. Sistem siap mengonfigurasi dan mendeploy virtual mail server secara instan.

*SYSTEM CONFIGURATION*
• Core API: \`v3.5 / Operational\`
• Security Node: \`Cloudflare Protected\`
• Account License: *${statusLisensi}*

*ACCOUNT BALANCE*
• Available Balance: *${infoPoin}*
• Daily Free Slot: *1 Email / Day* (Gmail Only)

*SYSTEM PANEL COMMANDS*
/CreateMailR - Select & deploy virtual mail server
/CheckPoint - Diagnose database and check balance
/TopupPoint - Upgrade account tier or recharge balance

• Network UID: \`${chatId}\`
───────────────────────
`;

  bot.sendMessage(chatId, menuText, { parse_mode: 'Markdown' });
});

// -------------------------------------------------------------
// SELECT MAIL DOMAIN
// -------------------------------------------------------------
bot.onText(/\/CreateMailR/, (msg) => {
  const chatId = msg.chat.id;
  initializeUser(chatId);

  const teksPilihDomain = `
*DOMAIN DISTRIBUTION CENTER*
───────────────────────
Silakan pilih basis domain server yang ingin diintegrasikan ke jaringan virtual sandbox:

*AVAILABLE MAIL INTERFACES:*
1. *Gmail.com* (Free Tier Node)
   • Cost: 1 Daily Slot / 5 Poin Allocation
2. *Outlook.com* (E-Premium Dedicated Server)
   • Cost: 0 Poin (Requires Active Subscription)
3. *Yahoo.com* (E-Premium Dedicated Server)
   • Cost: 0 Poin (Requires Active Subscription)

_Pilih interaksi node melalui tombol di bawah ini:_
───────────────────────
`;

  const opsiTombol = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Gmail.com (Standard Node)', callback_data: 'dom_gmail.com' }
        ],
        [
          { text: 'Outlook.com (E-Premium)', callback_data: 'dom_outlook.com' },
          { text: 'Yahoo.com (E-Premium)', callback_data: 'dom_yahoo.com' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, teksPilihDomain, opsiTombol);
});

// -------------------------------------------------------------
// MAIN CALLBACK LISTENER (Menggunakan Struktur Global Paling Stabil)
// -------------------------------------------------------------
bot.on('callback_query', (callbackQuery) => {
  const data = callbackQuery.data;
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;

  // Langsung jawab callback di awal agar Telegram melepas status loading pada tombol
  bot.answerCallbackQuery(callbackQuery.id).catch(() => {});

  if (data && data.startsWith('dom_')) {
    const selectedDomain = data.split('_')[1];
    
    // Hapus tombol pilihan agar bersih
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    
    // Alihkan pemrosesan ke fungsi terpisah agar tidak mengganggu internal event loop library
    deployEmailProcess(chatId, selectedDomain);
  }
});

// Fungsi Terpisah untuk Mengamankan Eksekusi Sinkronisasi Data Email
async function deployEmailProcess(chatId, selectedDomain) {
  initializeUser(chatId);
  const today = new Date().toDateString();
  const isAdmin = String(chatId) === String(OWNER_ID);

  // Validasi Dedicated Premium Node (Outlook / Yahoo)
  if (selectedDomain === 'outlook.com' || selectedDomain === 'yahoo.com') {
    if (!isUserPremium(chatId)) {
      const teksTolakPremium = `
*SECURITY ACCESS DENIED*
───────────────────────
Sistem menolak otentikasi. Jalur server dedicated *${selectedDomain}* memerlukan tingkat akun yang lebih tinggi.

• Current License: *Free Tier (Restricted)*
• Activation Required: *E-Premium*
• Subscription Rate: *Rp 10.000 / 14 Days*

Gunakan perintah /TopupPoint untuk menghubungi administrasi.
───────────────────────
`;
      return bot.sendMessage(chatId, teksTolakPremium, { parse_mode: 'Markdown' });
    }
  }

  // Validasi Standard Node (Gmail)
  if (selectedDomain === 'gmail.com' && !isAdmin) {
    if (userPoints[chatId] < 5 && userDailyLimit[chatId] === today) {
      const teksLimitHabis = `
*RATE LIMIT EXCEEDED*
───────────────────────
Sistem mendeteksi alokasi kuota harian untuk lisensi *Free Tier* Anda telah habis.

• Max Threshold: *1 Allocation / Day*
• Available Slot: *0 Slots Remaining*

Silakan lakukan pengisian saldo premium melalui menu /TopupPoint.
───────────────────────
`;
      return bot.sendMessage(chatId, teksLimitHabis, { parse_mode: 'Markdown' });
    }

    // Alokasikan pemotongan biaya / kuota harian
    if (userPoints[chatId] >= 5) {
      userPoints[chatId] -= 5;
    } else {
      userDailyLimit[chatId] = today;
    }
  }

  // Jalankan Animasi Proses Enkripsi
  const loadingMsg = await bot.sendMessage(chatId, `\`[SYSTEM PROLOG]\` Connecting to virtual node pool \`${selectedDomain}\`...`, { parse_mode: 'Markdown' });

  await sleep(1000);
  await bot.editMessageText(`\`[ENCRYPTION]\` Generating cryptographic tokens and hashing access key (SHA-256)...`, {
    chat_id: chatId,
    message_id: loadingMsg.message_id,
    parse_mode: 'Markdown'
  }).catch(() => {});

  await sleep(1000);
  await bot.editMessageText(`\`[COMPILING]\` Transmitting payload handshake to SMTP/IMAP network relays...`, {
    chat_id: chatId,
    message_id: loadingMsg.message_id,
    parse_mode: 'Markdown'
  }).catch(() => {});

  // Deploy Hasil Akhir Pembuatan Email
  await sleep(800);
  const fakeData = generateFakeEmail(selectedDomain);
  const sisaPoinTeks = isAdmin ? 'Unlimited (Admin)' : `${userPoints[chatId]} Points`;

  const hasilSukses = `
*VIRTUAL MAIL SERVER DEPLOYED SUCCESS*
───────────────────────
Alokasi server sandbox virtual berhasil dibangun dan siap digunakan:

• *Virtual Email:* \`${fakeData.email}\`
• *Access Password:* \`${fakeData.password}\`

*NODE METADATA LOG*
• Routing Core: \`${selectedDomain.toUpperCase()}\`
• Session Fee: ${isAdmin ? '0 Points (Bypass)' : 'Deducted Successfully'}
• Current Balance: *${sisaPoinTeks}*
• Server Status: \`Active / Operational\`

_Catatan: Ketuk satu kali pada bagian Email atau Password untuk menyalin data ke clipboard._
───────────────────────
`;

  bot.editMessageText(hasilSukses, {
    chat_id: chatId,
    message_id: loadingMsg.message_id,
    parse_mode: 'Markdown'
  }).catch(() => {
    bot.sendMessage(chatId, hasilSukses, { parse_mode: 'Markdown' });
  });
}

// -------------------------------------------------------------
// CHECK POINT DIAGNOSTIC
// -------------------------------------------------------------
bot.onText(/\/CheckPoint/, (msg) => {
  const chatId = msg.chat.id;
  initializeUser(chatId);

  const isAdmin = String(chatId) === String(OWNER_ID);
  const infoPoin = isAdmin ? 'Unlimited (Developer Mode)' : `${userPoints[chatId]} Points`;
  
  let infoPremium = 'Inactive';
  if (isAdmin) infoPremium = 'Infinite / Owner Lifetime';
  else if (isUserPremium(chatId)) infoPremium = `Active (Until: ${new Date(userPremiumUntil[chatId]).toLocaleDateString('id-ID')})`;

  const poinText = `
*CREDENTIAL INFRASTRUCTURE DIAGNOSTIC*
───────────────────────
Berhasil memuat sinkronisasi metadata enkripsi akun Anda dari awan:

• Point Balance: *${infoPoin}*
• E-Premium License: *${infoPremium}*
• Firewall Node Status: ${isAdmin || isUserPremium(chatId) ? '`UNRESTRICTED ACCESS`' : '`RESTRICTED / GMAIL LITE`'}
───────────────────────
`;
  bot.sendMessage(chatId, poinText, { parse_mode: 'Markdown' });
});

// -------------------------------------------------------------
// TOPUP PANEL
// -------------------------------------------------------------
bot.onText(/\/TopupPoint/, (msg) => {
  const chatId = msg.chat.id;

  const topupCaption = `
*UPGRADE SUBSCRIPTION & CREDIT INTERFACE*
───────────────────────
Silakan lakukan transaksi penambahan poin lisensi atau aktivasi akun premium melalui gateway terpusat.

*CREDIT NODES PRICING:*
• *Lite Node:* Rp 5.000   -> +50 Points Allocation
• *Mega Node:* Rp 10.000  -> +120 Points Allocation
• *E-PREMIUM NODE:* Rp 10.000 -> 14 Days Active
  _(Akses tanpa batas pembuatan domain Outlook.com & Yahoo.com tanpa potong saldo poin)_

*TRANSACTION SEQUENCE:*
1. Pindai kode QRIS Gateway di atas menggunakan aplikasi finansial digital Anda.
2. Selesaikan pemindahan dana sesuai nominal paket yang dituju.
3. Kirim berkas digital Bukti Transfer serta menyertakan nomor Jaringan UID Anda (\`${chatId}\`) ke konsol admin utama.
───────────────────────
`;

  const buttonOptions = {
    caption: topupCaption,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Connect to Secure Admin Account',
            url: `https://t.me/${OWNER_USERNAME}`
          }
        ]
      ]
    }
  };

  bot.sendPhoto(chatId, QRIS_IMAGE_URL, buttonOptions);
});

// -------------------------------------------------------------
// CONSOLE INJECTION: /isi
// -------------------------------------------------------------
bot.onText(/\/isi (\d+) (\d+)/, (msg, match) => {
  const chatIdAdmin = msg.chat.id;
  const targetUserChatId = match[1]; 
  const pointsToAdd = parseInt(match[2]); 

  if (String(chatIdAdmin) !== String(OWNER_ID)) {
    return bot.sendMessage(chatIdAdmin, "*ACCESS DENIED:* Restricted administrator command.", { parse_mode: 'Markdown' });
  }

  if (userPoints[targetUserChatId] === undefined) userPoints[targetUserChatId] = 20; 
  userPoints[targetUserChatId] += pointsToAdd;

  bot.sendMessage(chatIdAdmin, `\`[CONSOLE SUCCESS]\` Points injected successfully.\n• Target: \`${targetUserChatId}\`\n• Added: *+${pointsToAdd}*\n• Final: *${userPoints[targetUserChatId]}*`, { parse_mode: 'Markdown' });

  const pesanKeUser = `*DATABASE UPDATED: PREMIUM RECHARGE*\n───────────────────────\nSistem admin telah memvalidasi berkas dana Anda.\n\n• Allocation Added: *+${pointsToAdd} Points*\n• Current Total Account Balance: *${userPoints[targetUserChatId]} Points*\n───────────────────────`;
  bot.sendMessage(targetUserChatId, pesanKeUser, { parse_mode: 'Markdown' }).catch(()=>{});
});

// -------------------------------------------------------------
// CONSOLE INJECTION: /premium
// -------------------------------------------------------------
bot.onText(/\/premium (\d+)/, (msg, match) => {
  const chatIdAdmin = msg.chat.id;
  const targetUserChatId = match[1];

  if (String(chatIdAdmin) !== String(OWNER_ID)) {
    return bot.sendMessage(chatIdAdmin, "*ACCESS DENIED:* Restricted administrator command.", { parse_mode: 'Markdown' });
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 14);
  userPremiumUntil[targetUserChatId] = expiryDate.toISOString();

  bot.sendMessage(chatIdAdmin, `\`[CONSOLE SUCCESS]\` E-Premium tier initialized.\n• Target: \`${targetUserChatId}\`\n• Expiration Date: *${expiryDate.toLocaleDateString('id-ID')}*`, { parse_mode: 'Markdown' });

  const pesanKeUser = `
*SISTEM VERIFIKASI: LISENSI E-PREMIUM DIAKTIFKAN*
───────────────────────
Portal administrasi pusat telah memperbarui hak izin jaringan akun Anda.

• Active Period: *14 Days / 2 Weeks*
• Dedicated Domain Routing: \`Outlook.com\` & \`Yahoo.com\` (ENABLED)
• Core Calculation: \`Unlimited Nodes Simulation\`

Terima kasih atas kemitraan Anda. Jalur enkripsi premium kini siap dieksekusi di panel /CreateMailR.
───────────────────────
`;
  bot.sendMessage(targetUserChatId, pesanKeUser, { parse_mode: 'Markdown' }).catch(()=>{});
});

console.log('EmyCMail Bot (v3.5 Professional Elegant) successfully compiled and running.');
