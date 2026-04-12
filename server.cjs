const express = require("express");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// ====== CONFIG HELPERS ======
const WA_LINK = "https://wa.me/message/V36UBNCW23B7E1";

// ====== LINKS ======
const VIP_BOT_URL = "https://t.me/jackstackedpaybot";
const TRIBUTE_URL = "https://t.me/tribute/app?startapp=esF";
const FREE_UPDATES_CHANNEL_URL = "https://t.me/jackstackedupdates";

// ====== MENUS ======
const mainMenu = {
  inline_keyboard: [
    [{ text: "🔓 Unlock VIP Channel", url: VIP_BOT_URL }],
    [{ text: "📢 Free Telegram Updates", url: FREE_UPDATES_CHANNEL_URL }],
    [
      { text: "VIP OnlyFans", url: "https://onlyfans.com/hugeandhung" },
      { text: "Exclusive Bottom", url: "https://onlyfans.com/jackpowerbottom" }
    ],
    [{ text: "JustForFans", url: "https://justfor.fans/JackStacked" }],
    [{ text: "Meet Me", callback_data: "menu_meetme" }],
    [{ text: "💳 Make Payments", url: TRIBUTE_URL }]
  ]
};

const meetMenu = {
  inline_keyboard: [
    [{ text: "RentMen", url: "https://rentmen.eu/JackStacked" }],
    [{ text: "WhatsApp Booking", url: WA_LINK }],
    [{ text: "Back to Main Menu", callback_data: "menu_main" }]
  ]
};

const welcomeText = `WELCOME TO THE JACK STACKED

This is my Telegram hub — everything in one place.

Inside, you can:
- Join my FREE Telegram updates channel (PG-13)
- Unlock my VIP channel with full content access
- Find my OnlyFans pages
- Arrange to meet me in person

Choose where you want to go next:`;

const startNudgeText = `🔥 Most people unlock the VIP channel first — that’s where the full experience is.`;

// ====== FAQ REPLIES ======
const faqReplies = {
  offer: `I offer a VIP members-only experience with full access to my content, regular drops, and exclusive material you won’t see anywhere else.

If you want everything in one place, unlocking the VIP channel is the best move.`,

  price: `Full access is handled through the VIP channel.

Unlock it using the button below to get started instantly.`,

  secondPage: `The second page is more niche and exclusive, with content you won’t find on the main page.

If you already like the main content and want something more specific, that’s where you go next.`,

  live: `I go live regularly inside the VIP ecosystem.

If you want full access, unlocking the VIP channel is the best place to start.`,

  payments: `All payments are handled securely through Telegram.

Use the *Make Payments* button in the menu below.`,

  menu: `Use the menu below 👇 to access everything — VIP channel, content, updates, and bookings.`
};

function detectFaqIntent(text = "") {
  const t = text.toLowerCase().trim();

  if (
    t.includes("what do you offer") ||
    t.includes("what do i get") ||
    t.includes("what's on there") ||
    t.includes("what do you have")
  ) return "offer";

  if (
    t.includes("price") ||
    t.includes("cost") ||
    t.includes("how much")
  ) return "price";

  if (
    t.includes("bottom") ||
    t.includes("second page")
  ) return "secondPage";

  if (
    t.includes("live") ||
    t.includes("schedule")
  ) return "live";

  if (
    t.includes("pay") ||
    t.includes("payment")
  ) return "payments";

  if (
    t.includes("menu")
  ) return "menu";

  return null;
}

// ====== TELEGRAM HELPERS ======
async function sendTelegram(chatId, text, keyboard) {
  if (!BOT_TOKEN) return;

  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true
    };

    if (keyboard) payload.reply_markup = keyboard;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.log("Send error:", err);
  }
}

async function answerCallback(id) {
  if (!BOT_TOKEN) return;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: id })
    });
  } catch (err) {
    console.log("Callback error:", err);
  }
}

// ====== ROUTES ======
app.get("/", (req, res) => res.status(200).send("ok"));
app.get("/health", (req, res) => res.status(200).send("ok"));

app.post("/webhook", (req, res) => {
  res.sendStatus(200);

  (async () => {
    try {
      const { message, callback_query } = req.body;

      if (callback_query) {
        const chatId = callback_query.message.chat.id;
        const data = callback_query.data;

        await answerCallback(callback_query.id);

        if (data === "menu_main") {
          await sendTelegram(chatId, welcomeText, mainMenu);
        }

        if (data === "menu_meetme") {
          await sendTelegram(chatId, "MEET ME\n\nChoose an option below:", meetMenu);
        }

        return;
      }

      if (message) {
        const chatId = message.chat.id;

        if (message.text) {
          const text = message.text.trim().toLowerCase();

          if (text === "/start" || text === "start") {
            await sendTelegram(chatId, welcomeText, mainMenu);
            await sendTelegram(chatId, startNudgeText);
            return;
          }

          const intent = detectFaqIntent(message.text);

          if (intent) {
            await sendTelegram(chatId, faqReplies[intent]);
            await sendTelegram(chatId, "Choose an option below 👇", mainMenu);
            return;
          }

          await sendTelegram(
            chatId,
            "Use the menu below to access everything — VIP channel, content, updates, and bookings."
          );
          await sendTelegram(chatId, "Choose an option below 👇", mainMenu);
        }
      }
    } catch (err) {
      console.log("Webhook error:", err);
    }
  })();
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Listening on port:", PORT);
});
