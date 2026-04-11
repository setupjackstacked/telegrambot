const express = require("express");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// ====== CONFIG HELPERS ======
const WA_NUMBER = "447445328647";
const wa = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

// ====== Tribute links ======
const TRIBUTE_CREATOR_PAGE_URL = "https://t.me/tribute/app?startapp=esF";
const TRIBUTE_FULL_ACCESS_MONTHLY_URL = "https://t.me/tribute/app?startapp=sMLY";

// ====== Free Telegram Updates channel ======
const FREE_UPDATES_CHANNEL_URL = "https://t.me/jackstackedupdates";

// ====== Menus ======
const mainMenu = {
  inline_keyboard: [
    [{ text: "🔥 Full Access — Monthly", url: TRIBUTE_FULL_ACCESS_MONTHLY_URL }],
    [{ text: "📢 Free Telegram Channel Updates", url: FREE_UPDATES_CHANNEL_URL }],
    [
      { text: "VIP OnlyFans", url: "https://onlyfans.com/hugeandhung" },
      { text: "Exclusive Bottom", url: "https://onlyfans.com/jackpowerbottom" }
    ],
    [{ text: "JustForFans", url: "https://justfor.fans/JackStacked" }],
    [{ text: "Meet Me", callback_data: "menu_meetme" }]
  ]
};

const meetMenu = {
  inline_keyboard: [
    [{ text: "Rentmen", url: "https://rentmen.eu/JackStacked" }],
    [{ text: "Make a Booking", url: wa("Telegram Booking Enquiry") }],
    [{ text: "Pay Deposit via Tribute", url: TRIBUTE_CREATOR_PAGE_URL }],
    [{ text: "Back to Main Menu", callback_data: "menu_main" }]
  ]
};

const welcomeText = `WELCOME TO THE JACK STACKED

This is my Telegram hub — everything I offer, all in one place. Inside, you can:
- Join my FREE Telegram updates channel (PG-13)
- Get full access (Monthly)
- Find my OnlyFans pages
- Arrange to meet me in person where available
- Pay securely via Tribute on Telegram

Choose where you want to go next:`;

const startNudgeText = `🔥 Most people start with Full Access — it’s the best way to unlock the full experience straight away.`;

// ====== FAQ REPLIES ======
const faqReplies = {
  offer: `I offer a premium members-only experience with full access to a huge content library, weekly new drops, regular live streams, and direct interaction.

The main page gives you the full experience, while the secondary page is more niche and exclusive.

If you want the best place to start, the main page is the move.`,

  price: `The subscription gives you full access to the page through the monthly Tribute option.

If you want the full experience, start with the main page from the menu below.`,

  secondPage: `The second page is more niche and exclusive, with 100+ full-length scenes you won’t find on the main page.

If you already like the main page and want something more specific, that’s where you go next.`,

  live: `I go live 4 times a week (Dubai time):

• Tuesday — 6:00 AM
• Thursday — 11:00 PM
• Sunday — 1:00 AM
• Sunday — 6:00 PM

If you want the full experience, the main page is the best place to start.`,

  payments: `All payments are handled securely through Tribute on Telegram.

Choose what you want from the menu below and complete payment there.`,

  menu: `Use the menu below 👇 to access everything — full access, exclusive pages, Telegram updates, and meet bookings.`
};

function detectFaqIntent(text = "") {
  const t = text.toLowerCase().trim();

  if (
    t.includes("what do you offer") ||
    t.includes("what do u offer") ||
    t.includes("what do i get") ||
    t.includes("what's on there") ||
    t.includes("whats on there") ||
    t.includes("what is on there") ||
    t.includes("what do you have")
  ) return "offer";

  if (
    t.includes("how much") ||
    t.includes("price") ||
    t.includes("prices") ||
    t.includes("pricing") ||
    t.includes("cost") ||
    t.includes("how much is it") ||
    t.includes("what does it cost")
  ) return "price";

  if (
    t.includes("second page") ||
    t.includes("bottom page") ||
    t.includes("exclusive bottom") ||
    t.includes("other page") ||
    t.includes("bottom content")
  ) return "secondPage";

  if (
    t.includes("live") ||
    t.includes("live stream") ||
    t.includes("livestream") ||
    t.includes("schedule") ||
    t.includes("when are you live")
  ) return "live";

  if (
    t.includes("payment") ||
    t.includes("pay") ||
    t.includes("how do i pay") ||
    t.includes("how to pay") ||
    t.includes("tribute")
  ) return "payments";

  if (
    t === "menu" ||
    t.includes("main menu") ||
    t.includes("show menu")
  ) return "menu";

  return null;
}

// Telegram helpers
async function sendTelegram(chatId, text, keyboard) {
  if (!BOT_TOKEN) {
    console.log("ERROR: TELEGRAM_BOT_TOKEN is missing");
    return;
  }

  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true
    };

    if (keyboard) payload.reply_markup = keyboard;

    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.log("Telegram sendMessage failed:", resp.status, t);
    }
  } catch (err) {
    console.log("Send error:", err);
  }
}

async function answerCallback(id) {
  if (!BOT_TOKEN) return;

  try {
    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: id })
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.log("Telegram answerCallbackQuery failed:", resp.status, t);
    }
  } catch (err) {
    console.log("Callback error:", err);
  }
}

// Health checks
app.get("/", (req, res) => res.status(200).send("ok"));
app.get("/health", (req, res) => res.status(200).send("ok"));

// Webhook endpoint
app.post("/webhook", (req, res) => {
  res.sendStatus(200);

  (async () => {
    try {
      const { message, callback_query } = req.body;
      console.log("Update received:", JSON.stringify(req.body).slice(0, 500));

      if (!BOT_TOKEN) {
        console.log("ERROR: TELEGRAM_BOT_TOKEN is missing in deployment env");
        return;
      }

      // ===== CALLBACKS =====
      if (callback_query) {
        const chatId = callback_query.message.chat.id;
        const data = callback_query.data;

        await answerCallback(callback_query.id);

        if (data === "menu_main") {
          await sendTelegram(chatId, welcomeText, mainMenu);

        } else if (data === "menu_meetme") {
          await sendTelegram(chatId, "MEET ME\n\nChoose an option below:", meetMenu);
        }

        return;
      }

      // ===== MESSAGES =====
      if (message) {
        const chatId = message.chat.id;

        if (message.text) {
          const text = message.text.trim().toLowerCase();

          if (text === "/start" || text === "start") {
            await sendTelegram(chatId, welcomeText, mainMenu);
            await sendTelegram(chatId, startNudgeText);
            return;
          }
        }

        // ===== FAQ LAYER =====
        if (message.text) {
          const intent = detectFaqIntent(message.text);

          if (intent) {
            await sendTelegram(chatId, faqReplies[intent]);
            await sendTelegram(chatId, "Choose an option below 👇", mainMenu);
            return;
          }
        }

        // ===== FALLBACK REPLY =====
        if (message.text) {
          await sendTelegram(
            chatId,
            "Use the menu below to access everything — full access, exclusive pages, Telegram updates, and meet bookings."
          );
          await sendTelegram(chatId, "Choose an option below 👇", mainMenu);
        }
      }
    } catch (err) {
      console.log("Webhook handler error:", err);
    }
  })();
});

// IMPORTANT: listen on Railway's PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Listening on port:", PORT);
  console.log("TOKEN SET:", Boolean(process.env.TELEGRAM_BOT_TOKEN));
});
