require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

// AMBIL DARI FILE .ENV (Pastikan OWNER_ID berisi ANGKA Chat ID Telegram kamu)
const OWNER_ID = process.env.OWNER_ID; 

// Link Gambar QRIS (Ganti dengan link gambar QRIS asli milikmu)
const QRIS_IMAGE_URL = 'https://qu.ax/g1eRh'; // Sementara menggunakan contoh, silakan ganti nanti

// Database sederhana berbasis RAM (Penyimpanan sementara)
const userPoints = {};

// Daftar nama depan untuk kombinasi email realistis
const firstNames = [
  'andi', 'budi', 'rizky', 'fajar', 'dika', 'reza', 'tomi', 'kevin', 'putra', 'ari',
  'siti', 'dewi', 'amanda', 'putri', 'santi', 'mega', 'rara', 'nisa', 'via', 'ayu',
  'ahmad', 'raffi', 'daffa', 'fian', 'gali', 'hadi', 'ilham', 'joko', 'kiki', 'lucky'
];

// Variasi unsur "Emy" untuk nama belakang (Last Name)
const emyLastNames = ['emy', 'emyx', 'zemy', 'cemy', 'xemy', 'emyc', 'emyz', 'vemy', 'lemy', 'qemy'];

// Daftar domain email variatif
const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

// Helper: Menunda eksekusi kode (untuk efek animasi)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate string acak untuk password
function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Fungsi pembuat email tiruan realistis
function generateFakeEmail() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const emyLastName = emyLastNames[Math.floor(Math.random() * emyLastNames.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  
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

// Helper untuk memastikan user mendapatkan poin awal hanya SEKALI saat mendaftar
function initializeUser(chatId) {
  if (userPoints[chatId] === undefined) {
    userPoints[chatId] = 20; // Poin awal pendaftaran pertama kali
  }
}

// -------------------------------------------------------------
// COMMAND: /start
// -------------------------------------------------------------
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.first_name;

  initializeUser(chatId);

  const menuText = `
🤖 *WELCOME TO EMYCMAIL BOT*
──────────────────────
Halo *${username}* 👋, Selamat datang di Sistem Generator Email Tiruan pintar.

📌 *MENU UTAMA:*
🔹 /CreateMailR  🏼 Buat Email Baru (Biaya: 5 Poin)
🔹 /CheckPoint   🏼 Cek Sisa Poin Kamu
🔹 /TopupPoint   🏼 Isi Ulang Poin Via QRIS

💡 *Chat ID Kamu:* \`${chatId}\` _(Gunakan ID ini untuk konfirmasi top up ke Admin)_

⚠️ *Catatan:* Email ini bersifat tiruan/simulasi. Gunakan sistem ini dengan bijak!
──────────────────────
`;

  bot.sendMessage(chatId, menuText, { parse_mode: 'Markdown' });
});

// -------------------------------------------------------------
// COMMAND: /CreateMailR (Dengan Sistem Proteksi Poin & Animasi)
// -------------------------------------------------------------
bot.onText(/\/CreateMailR/, async (msg) => {
  const chatId = msg.chat.id;
  
  initializeUser(chatId);

  // FIX BUG POIN: Kunci akses jika poin kurang dari 5
  if (userPoints[chatId] < 5) {
    const infoGagal = `
❌ *AKSES DITOLAK: POIN TIDAK CUKUP*
──────────────────────
Sisa Poin Kamu: *${userPoints[chatId]} Poin*
Biaya Pembuatan: *5 Poin*

Poin kamu tidak mencukupi untuk membuat email baru. Silakan lakukan pengisian ulang poin terlebih dahulu.

👉 Silakan ketik atau klik: /TopupPoint
──────────────────────
`;
    return bot.sendMessage(chatId, infoGagal, { parse_mode: 'Markdown' });
  }

  // Potong poin di awal untuk mencegah eksploitasi spamming
  userPoints[chatId] -= 5;

  // Animasi Pembuatan Realistis - Langkah 1
  const loadingMsg = await bot.sendMessage(chatId, '⏳ *[1/3]* Menghubungkan ke server database email...', { parse_mode: 'Markdown' });

  // Animasi Langkah 2
  await sleep(1500);
  await bot.editMessageText('⚙️ *[2/3]* Mengonstruksi nama pengguna & menyusun password aman...', {
    chat_id: chatId,
    message_id: loadingMsg.message_id,
    parse_mode: 'Markdown'
  });

  // Animasi Langkah 3
  await sleep(1500);
  await bot.editMessageText('🚀 *[3/3]* Mengenkripsi data pembuatan dan mematangkan enkripsi...', {
    chat_id: chatId,
    message_id: loadingMsg.message_id,
    parse_mode: 'Markdown'
  });

  // Pembuatan email final selesai
  await sleep(1000);
  const fakeData = generateFakeEmail();

  const hasilSukses = `
✅ *EMAIL BERHASIL GENERATE*
──────────────────────
📧 *EMAIL:* \`${fakeData.email}\`
🔑 *PASSWORD:* \`${fakeData.password}\`

💎 *BIAYA:* 5 Poin
💰 *SISA POIN KAMU:* ${userPoints[chatId]} Poin

💡 _Tips: Kamu bisa menyalin teks di atas dengan sekali ketuk pada bagian Email/Password._
──────────────────────
`;

  // Tampilkan hasil akhir dengan mengedit pesan loading tadi
  bot.editMessageText(hasilSukses, {
    chat_id: chatId,
    message_id: loadingMsg.message_id,
    parse_mode: 'Markdown'
  });
});

// -------------------------------------------------------------
// COMMAND: /CheckPoint
// -------------------------------------------------------------
bot.onText(/\/CheckPoint/, (msg) => {
  const chatId = msg.chat.id;
  
  initializeUser(chatId);

  const poinText = `
💰 *INFORMASI DOMPET POIN*
──────────────────────
Sisa saldo poin akun Anda saat ini adalah:
👉 *${userPoints[chatId]} Poin*

Gunakan saldo poin Anda untuk melakukan generate email otomatis lewat menu /CreateMailR.
──────────────────────
`;
  bot.sendMessage(chatId, poinText, { parse_mode: 'Markdown' });
});

// -------------------------------------------------------------
// COMMAND: /TopupPoint (QRIS & Tombol Kontak Admin Interaktif)
// -------------------------------------------------------------
bot.onText(/\/TopupPoint/, (msg) => {
  const chatId = msg.chat.id;

  const topupCaption = `
💳 *MENU PENGISIAN ULANG POIN (TOP UP)*
──────────────────────
Dapatkan poin instan untuk terus membuat email tiruan premium tanpa batas.

💵 *DAFTAR HARGA POIN:*
• Rp 5.000  🏼 50 Poin
• Rp 10.000 🏼 120 Poin (Bonus 20 Poin!)
• Rp 20.000 🏼 300 Poin (Paling Hemat!)

📌 *LANGKAH-LANGKAH TRANSFER:*
1. Scan kode *QRIS* di atas menggunakan aplikasi E-Wallet (Dana, OVO, GoPay) atau m-Banking Anda.
2. Masukkan nominal pembayaran sesuai paket poin yang ingin dibeli.
3. Setelah transfer sukses, simpan bukti transfernya.
4. Kirimkan bukti pembayaran dan sertakan Chat ID kamu (\`${chatId}\`) ke admin dengan menekan tombol dibawah ini.
──────────────────────
`;

  // Membuat tombol interaktif di bawah gambar QRIS
  const buttonOptions = {
    caption: topupCaption,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '💬 Hubungi Admin untuk Konfirmasi',
            url: `https://t.me/EmyCMail` // Otomatis mengarah ke telegram bot/admin
          }
        ]
      ]
    }
  };

  // Kirim gambar QRIS + Deskripsi teks + Tombol
  bot.sendPhoto(chatId, QRIS_IMAGE_URL, buttonOptions);
});

// -------------------------------------------------------------
// COMMAND KHUSUS ADMIN/OWNER: /isi [Chat_ID_User] [Jumlah_Poin]
// -------------------------------------------------------------
bot.onText(/\/isi (\d+) (\d+)/, (msg, match) => {
  const chatIdAdmin = msg.chat.id;
  const targetUserChatId = match[1]; 
  const pointsToAdd = parseInt(match[2]); 

  // PROTEKSI KEAMANAN: Perintah isi poin hanya bekerja jika dikirim oleh OWNER_ID asli
  if (String(chatIdAdmin) !== String(OWNER_ID)) {
    return bot.sendMessage(chatIdAdmin, "❌ *AKSES DITOLAK:* Anda bukan pemilik sah bot ini.", { parse_mode: 'Markdown' });
  }

  // Daftarkan ke RAM jika user tujuan belum pernah mengklik /start sebelumnya
  if (userPoints[targetUserChatId] === undefined) {
    userPoints[targetUserChatId] = 20; 
  }

  // Tambahkan jumlah poin ke target user
  userPoints[targetUserChatId] += pointsToAdd;

  // 1. Notifikasi Sukses untuk layar Handphone ADMIN
  bot.sendMessage(chatIdAdmin, `✅ *TOP UP BERHASIL*
──────────────────────
Target ID: \`${targetUserChatId}\`
Jumlah Poin: *+${pointsToAdd} Poin*
Total Poin Sekarang: *${userPoints[targetUserChatId]} Poin*
──────────────────────`, { parse_mode: 'Markdown' });

  // 2. Notifikasi Sukses Otomatis (Konfirmasi) Langsung Masuk ke Layar USER target
  const pesanKeUser = `
🎉 *TOP UP POIN BERHASIL DIKONFIRMASI*
──────────────────────
Halo, Admin telah berhasil memverifikasi pembayaran Anda.

🎁 *POIN MASUK:* +${pointsToAdd} Poin
💰 *TOTAL POIN KAMU SEKARANG:* ${userPoints[targetUserChatId]} Poin

Terima kasih sudah melakukan pengisian! Poin sudah siap digunakan kembali, silakan ketik /CreateMailR.
──────────────────────
`;
  
  bot.sendMessage(targetUserChatId, pesanKeUser, { parse_mode: 'Markdown' })
    .catch((err) => {
      console.log(`Gagal mengirim pesan ke user ${targetUserChatId}:`, err.message);
    });
});

console.log('EmyCMail Bot berhasil dijalankan dan siap digunakan!');
