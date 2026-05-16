require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

const OWNER_ID = process.env.OWNER_ID; 
const OWNER_USERNAME = 'Emyawu'; 

const QRIS_IMAGE_URL = 'https://qu.ax/g1eRh'; 

// Database sederhana berbasis RAM
const userPoints = {};
const userDailyLimit = {}; 
const userPremiumUntil = {}; // Menyimpan tanggal kedaluwarsa E-Premium user

// Daftar data nama untuk generator email
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

// Fungsi generator email dengan input domain dinamis
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

// Mengecek apakah user memiliki status E-Premium aktif
function isUserPremium(chatId) {
  if (String(chatId) === String(OWNER_ID)) return true; // Admin otomatis selalu premium
  if (!userPremiumUntil[chatId]) return false;
  
  const now = new Date();
  const expiry = new Date(userPremiumUntil[chatId]);
  return now < expiry;
}

// -------------------------------------------------------------
// COMMAND: /start
// -------------------------------------------------------------
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.first_name;

  initializeUser(chatId);

  const isAdmin = String(chatId) === String(OWNER_ID);
  const infoPoin = isAdmin ? '♾️ UNLIMITED (ADMIN)' : `${userPoints[chatId]} Poin`;
  
  // Tampilan status premium
  let statusLisensi = '*FREE TIER*';
  if (isAdmin) statusLisensi = '*PREMIUM PARTNER (OWNER)*';
  else if (isUserPremium(chatId)) statusLisensi = `*E-PREMIUM ACTIVE* (Exp: ${new Date(userPremiumUntil[chatId]).toLocaleDateString('id-ID')})`;

  const menuText = `
⚡ *EMYCMAIL AUTOMATED CORE SYSTEM v3.5*
───────────────────────
Halo *${username}* 👋. Selamat datang di portal enkripsi otomatis pembuatan virtual mail server.

💻 *SYSTEM STATUS:*
• API Status: \`ONLINE / OPERATIONAL\`
• Server Security: \`Cloudflare SSL Protected\`
• Lisensi Akun Anda: ${statusLisensi}

💰 *STATUS DOMPET:*
• Saldo Poin Anda: *${infoPoin}*
• Kuota Gratisan Harian: *1 Slot / Hari* (Khusus Gmail)

📌 *COMMANDS MENU PANEL:*
🔹 /CreateMailR  🏼 Pilih & Deploy Domain Email Baru
🔹 /CheckPoint   🏼 Cek Saldo Dompet Poin & Masa Premium
🔹 /TopupPoint   🏼 Upgrade Lisensi / Pengisian Poin & E-Premium

🆔 *UID Jaringan:* \`${chatId}\`
───────────────────────
`;

  bot.sendMessage(chatId, menuText, { parse_mode: 'Markdown' });
});

// -------------------------------------------------------------
// COMMAND: /CreateMailR (Memunculkan Pilihan Menu Domain)
// -------------------------------------------------------------
bot.onText(/\/CreateMailR/, (msg) => {
  const chatId = msg.chat.id;
  initializeUser(chatId);

  const teksPilihDomain = `
🌐 *PORTAL SELEKSI MAIL DOMAIN*
───────────────────────
Silakan pilih basis domain server yang ingin Anda integrasikan ke dalam sistem virtual sandbox:

📧 *DOMAIN LIST AVAILABLE:*
1️⃣ *Gmail.com* -> \`FREE TIER\` (Gunakan 1 Kuota Harian atau 5 Poin)
2️⃣ *Outlook.com* -> 👑 \`E-PREMIUM LISENSI\` (Akses Tanpa Potong Poin)
3️⃣ *Yahoo.com* -> 👑 \`E-PREMIUM LISENSI\` (Akses Tanpa Potong Poin)

👇 *Ketuk tombol di bawah ini untuk memilih:*
───────────────────────
`;

  const opsiTombol = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔴 Gmail.com (Free Tier)', callback_data: 'dom_gmail.com' }
        ],
        [
          { text: '🔵 Outlook.com (E-Premium)', callback_data: 'dom_outlook.com' },
          { text: '🟣 Yahoo.com (E-Premium)', callback_data: 'dom_yahoo.com' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, teksPilihDomain, opsiTombol);
});

// -------------------------------------------------------------
// HANDLING SELEKSI DOMAIN (Callback Query)
// -------------------------------------------------------------
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  // Hapus pesan seleksi agar chat rapi
  bot.deleteMessage(chatId, msg.message_id).catch(() => {});

  if (data.startsWith('dom_')) {
    const selectedDomain = data.split('_')[1];
    const today = new Date().toDateString();
    const isAdmin = String(chatId) === String(OWNER_ID);

    // LOGIKA JIKA PILIH OUTLOOK / YAHOO (WAJIB E-PREMIUM)
    if (selectedDomain === 'outlook.com' || selectedDomain === 'yahoo.com') {
      if (!isUserPremium(chatId)) {
        const teksTolakPremium = `
❌ *AKSES DITOLAK: REQUIRE E-PREMIUM LISENSI*
───────────────────────
Domain *${selectedDomain}* merupakan jalur server dedicated berkecepatan tinggi. 

• Status Akun Anda: *FREE TIER (Tidak Diizinkan)*
• Biaya Aktivasi: *Rp 10.000 / 2 Minggu*

👑 *Keuntungan Lisensi E-Premium:*
• Bebas generate domain \`outlook.com\` & \`yahoo.com\` sepuasnya.
• Bypass pembatasan limit harian bot.
• Server prioritas tanpa antrean enkripsi database.

👉 Ketik /TopupPoint untuk petunjuk aktivasi paket E-Premium melalui Admin.
───────────────────────
`;
        return bot.sendMessage(chatId, teksTolakPremium, { parse_mode: 'Markdown' });
      }
    }

    // LOGIKA JIKA PILIH GMAIL (MENGGUNAKAN LIMIT HARIAN ATAU POIN)
    if (selectedDomain === 'gmail.com' && !isAdmin) {
      if (userPoints[chatId] < 5 && userDailyLimit[chatId] === today) {
        const teksLimitHabis = `
⚠️ *SECURITY LOG: LIMIT HARIAN TERCAPAI*
───────────────────────
Sistem mendeteksi lisensi *FREE TIER* Anda telah menggunakan kuota generator otomatis untuk hari ini.

• Batasan Akun: *1 Email / Hari*
• Status Hari Ini: *0 Slot Tersisa*

👉 Silakan lakukan pengisian ulang poin premium untuk mem-bypass limit harian: /TopupPoint
───────────────────────
`;
        return bot.sendMessage(chatId, teksLimitHabis, { parse_mode: 'Markdown' });
      }

      // Potong saldo/kuota harian
      if (userPoints[chatId] >= 5) {
        userPoints[chatId] -= 5;
      } else {
        userDailyLimit[chatId] = today;
      }
    }

    // 🎬 PROSES PRANK ANIMASI DEPLOY EMAIL REALISTIS
    const loadingMsg = await bot.sendMessage(chatId, `🌀 *[⚡ 15%]* Mengontak DNS Virtual Server untuk cluster \`${selectedDomain}\`...`, { parse_mode: 'Markdown' });

    await sleep(1200);
    await bot.editMessageText('⚙️ *[⚡ 52%]* Menyinkronkan enkapsulasi data privasi dan menyusun sandi acak...', {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });

    await sleep(1200);
    await bot.editMessageText('🚀 *[⚡ 90%]* Menembus sistem keamanan SMTP gateway global mail...', {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });

    // Selesai Pembuatan
    await sleep(1000);
    const fakeData = generateFakeEmail(selectedDomain);
    const sisaPoinTeks = isAdmin ? '♾️ UNLIMITED (ADMIN)' : `${userPoints[chatId]} Poin`;

    const hasilSukses = `
✨ *VIRTUAL MAIL SERVER DEPLOYED SUCCESS*
───────────────────────
Sistem Cloud berhasil mengaktifkan server email tiruan baru Anda:

📧 *VIRTUAL EMAIL:* \`${fakeData.email}\`
🔑 *KEY ACCESS/PW:* \`${fakeData.password}\`

📈 *METADATA STATUS:*
• Jalur Domain: \`${selectedDomain.toUpperCase()}\`
• Sisa Saldo Poin: *${sisaPoinTeks}*
• Akses Node: \`SECURE / INJECTED\`

💡 _Tips Teknis: Klik sekali pada teks Alamat Email atau Password di atas untuk menyalin otomatis._
───────────────────────
`;

    bot.editMessageText(hasilSukses, {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
});

// -------------------------------------------------------------
// COMMAND: /CheckPoint
// -------------------------------------------------------------
bot.onText(/\/CheckPoint/, (msg) => {
  const chatId = msg.chat.id;
  initializeUser(chatId);

  const isAdmin = String(chatId) === String(OWNER_ID);
  const infoPoin = isAdmin ? '♾️ UNLIMITED (ADMIN MODE)' : `${userPoints[chatId]} Poin`;
  
  let infoPremium = '`TIDAK AKTIF`';
  if (isAdmin) infoPremium = '`PERMANEN DEVELOPER`';
  else if (isUserPremium(chatId)) infoPremium = `\`AKTIF\` (Sampai: ${new Date(userPremiumUntil[chatId]).toLocaleDateString('id-ID')})`;

  const poinText = `
🔑 *SECURITY DATABASE: ENKRIPSI CREDENTIALS*
───────────────────────
Hasil sinkronisasi data akun pada cloud:

• Alokasi Saldo Poin: *${infoPoin}*
• Status Paket E-Premium: ${infoPremium}
• Jalur Akses Premium: ${isAdmin || isUserPremium(chatId) ? '`UNLIMITED NODE`' : '`RESTRICTED / GMAIL ONLY`'}
───────────────────────
`;
  bot.sendMessage(chatId, poinText, { parse_mode: 'Markdown' });
});

// -------------------------------------------------------------
// COMMAND: /TopupPoint
// -------------------------------------------------------------
bot.onText(/\/TopupPoint/, (msg) => {
  const chatId = msg.chat.id;

  const topupCaption = `
💳 *PORTAL RECHARGE POIN & LISENSI E-PREMIUM*
───────────────────────
Lakukan peningkatan akun untuk membuka batasan limit harian dan membuka jalur domain premium eksklusif.

📊 *DAFTAR HARGA LISENSI SERVER:*
• 🟢 *Lite Node:* Rp 5.000   🏼 +50 Poin Premium (Gmail Only)
• 🔵 *Mega Node:* Rp 10.000  🏼 +120 Poin Premium (Gmail Only)
• 👑 *E-PREMIUM NODE:* Rp 10.000 🏼 Masa Aktif 2 Minggu (Bebas Generate domain Outlook.com & Yahoo.com Sepuasnya Tanpa Potong Poin!)

📌 *PROSEDUR TRANSAKSI:*
1. Scan *QRIS Gateway* di atas lewat OVO/Dana/GoPay/LinkAja Anda.
2. Kirim berkas gambar Bukti Transfer beserta nomor UID Anda (\`${chatId}\`) ke Jaringan Admin Utama untuk proses injeksi instan.
───────────────────────
`;

  const buttonOptions = {
    caption: topupCaption,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '💬 Hubungi Secure Admin (@Emyawu)',
            url: `https://t.me/${OWNER_USERNAME}`
          }
        ]
      ]
    }
  };

  bot.sendPhoto(chatId, QRIS_IMAGE_URL, buttonOptions);
});

// -------------------------------------------------------------
// COMMAND ADMIN: /isi [Chat_ID_User] [Jumlah_Poin]
// -------------------------------------------------------------
bot.onText(/\/isi (\d+) (\d+)/, (msg, match) => {
  const chatIdAdmin = msg.chat.id;
  const targetUserChatId = match[1]; 
  const pointsToAdd = parseInt(match[2]); 

  if (String(chatIdAdmin) !== String(OWNER_ID)) {
    return bot.sendMessage(chatIdAdmin, "❌ *ACCESS DENIED:* Perintah khusus developer utama.", { parse_mode: 'Markdown' });
  }

  if (userPoints[targetUserChatId] === undefined) userPoints[targetUserChatId] = 20; 
  userPoints[targetUserChatId] += pointsToAdd;

  bot.sendMessage(chatIdAdmin, `✅ *POIN INJECTED SUCCESS*\nTarget UID: \`${targetUserChatId}\`\nPoin Masuk: *+${pointsToAdd}*\nTotal Saldo: *${userPoints[targetUserChatId]} Poin*`, { parse_mode: 'Markdown' });

  const pesanKeUser = `🎉 *TOP UP POIN PREMIUM DIKONFIRMASI*\n\n• Poin Masuk: *+${pointsToAdd} Poin*\n• Total Saldo Lisensi: *${userPoints[targetUserChatId]} Poin*\n\nSilakan jalankan kembali menu /CreateMailR!`;
  bot.sendMessage(targetUserChatId, pesanKeUser, { parse_mode: 'Markdown' }).catch(()=>{});
});

// -------------------------------------------------------------
// COMMAND ADMIN BARU: /premium [Chat_ID_User] (Mengaktifkan E-Premium 2 Minggu)
// -------------------------------------------------------------
bot.onText(/\/premium (\d+)/, (msg, match) => {
  const chatIdAdmin = msg.chat.id;
  const targetUserChatId = match[1];

  if (String(chatIdAdmin) !== String(OWNER_ID)) {
    return bot.sendMessage(chatIdAdmin, "❌ *ACCESS DENIED:* Perintah khusus developer utama.", { parse_mode: 'Markdown' });
  }

  // Hitung tanggal kedalwarsa 14 hari kedepan (2 Minggu)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 14);
  userPremiumUntil[targetUserChatId] = expiryDate.toISOString();

  bot.sendMessage(chatIdAdmin, `👑 *E-PREMIUM LICENSE ACTIVATED*\nTarget UID: \`${targetUserChatId}\`\nMasa Aktif: *2 Minggu* (Hingga: ${expiryDate.toLocaleDateString('id-ID')})`, { parse_mode: 'Markdown' });

  const pesanKeUser = `
👑 *PRO PORTAL ACTIVATED: LICENSE E-PREMIUM UPGRADE*
───────────────────────
Selamat! Server Admin telah menyuntikkan lisensi paket *E-Premium* ke akun Anda.

• Masa Aktif: *2 Minggu / 14 Hari*
• Hak Akses Domain: \`Outlook.com\` & \`Yahoo.com\` (DIBUKA ✔️)
• Sistem Kuota: \`UNLIMITED GENERATE (0 POIN SECORES)\`

Terima kasih atas kontribusi Anda. Silakan deploy email premium Anda sekarang di /CreateMailR!
───────────────────────
`;
  bot.sendMessage(targetUserChatId, pesanKeUser, { parse_mode: 'Markdown' }).catch(()=>{});
});

console.log('EmyCMail Bot (V3.5 Prank Premium) sukses dijalankan!');
