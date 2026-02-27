const express = require("express");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// ✅ Admin chat id (your personal Telegram user id) for forwarding paid requests
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// ====== CONFIG HELPERS (prevents future mistakes) ======
const WA_NUMBER = "447445328647";
const wa = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

// ====== Tribute links (provided) ======
const TRIBUTE_CREATOR_PAGE_URL = "https://t.me/tribute/app?startapp=esF"; // kept for reference, not in menu now
const TRIBUTE_CUSTOM_URL = "https://t.me/tribute/app?startapp=pqJV";
const TRIBUTE_VIDEO_CALL_URL = "https://t.me/tribute/app?startapp=pqJS";

// ✅ NEW: Full XXX Access (top menu)
const TRIBUTE_FULL_XXX_ACCESS_URL = "https://t.me/tribute/app?startapp=prYo";

// ====== Telegram Channels submenu ======
const telegramChannelsMenu = {
  inline_keyboard: [
    [{ text: "SFW Channel", url: "https://t.me/jackstackedupdates" }],
    [{ text: "NSFW Channel", url: "https://t.me/jackstackedofficial" }],
    [{ text: "Coaching Channel", url: "https://t.me/jackedstackedcoaching" }],
    [{ text: "Back to Main Menu", callback_data: "menu_main" }]
  ]
};

// ====== Video Calls & Custom Videos submenu (Tribute) ======
const bookingMenu = {
  inline_keyboard: [
    [{ text: "💳 Pay: Video Call", url: TRIBUTE_VIDEO_CALL_URL }],
    [{ text: "💳 Pay: Custom", url: TRIBUTE_CUSTOM_URL }],
    [{ text: "✅ I’ve paid (send details)", callback_data: "paid_start" }],
    [{ text: "Back to Main Menu", callback_data: "menu_main" }]
  ]
};

const paidTypeMenu = {
  inline_keyboard: [
    [{ text: "📞 Video Call", callback_data: "paid_type_videocall" }],
    [{ text: "🎥 Custom Video", callback_data: "paid_type_custom" }],
    [{ text: "⬅️ Back", callback_data: "menu_booking" }]
  ]
};

// ====== Simple in-memory state for the paid flow ======
const userState = new Map(); // chatId -> { step, data }
const setState = (chatId, s) => userState.set(String(chatId), s);
const getState = (chatId) => userState.get(String(chatId));
const clearState = (chatId) => userState.delete(String(chatId));

// Menus
const mainMenu = {
  inline_keyboard: [
    // ✅ NEW TOP BUTTON: Full XXX Access
    [{ text: "🔥 Full XXX Access", url: TRIBUTE_FULL_XXX_ACCESS_URL }],

    // ✅ Telegram Channels submenu opener
    [{ text: "Telegram Channels", callback_data: "menu_telegram_channels" }],

    [
      { text: "VIP OnlyFans", url: "https://onlyfans.com/hugeandhung" },
      { text: "Exclusive Bottom", url: "https://onlyfans.com/jackpowerbottom" }
    ],
    [{ text: "JustForFans", url: "https://justfor.fans/JackStacked" }],

    // ✅ Booking submenu opener (Tribute)
    [{ text: "Video Calls & Custom Videos", callback_data: "menu_booking" }],

    // ✅ Meets go to WhatsApp via Meet Me submenu
    [{ text: "Meet Me", callback_data: "menu_meetme" }],

    [{ text: "Payments", callback_data: "menu_payments" }]
  ]
};

const meetMenu = {
  inline_keyboard: [
    [{ text: "Rentmen", url: "https://rentmen.eu/JackStacked" }],

    // ✅ WhatsApp correct wa.me format for +447445328647 (meets only)
    [{ text: "Make a Booking", url: wa("Telegram Booking Enquiry") }],

    [{ text: "Deposits - See Payments", callback_data: "menu_payments" }],
    [{ text: "Back to Main Menu", callback_data: "menu_main" }]
  ]
};

const paymentsMenu = {
  inline_keyboard: [
    [{ text: "Throne", url: "https://throne.com/jackstacked" }],
    [{ text: "Crypto", callback_data: "menu_crypto" }],
    [{ text: "Gift Card", url: "https://yougotagift.com/shop/en-ae/" }],
    [{ text: "Back to Main Menu", callback_data: "menu_main" }]
  ]
};

const cryptoMenu = {
  inline_keyboard: [
    [{ text: "Bitcoin (BTC)", callback_data: "crypto_btc" }],
    [{ text: "USDT (ERC20)", callback_data: "crypto_usdt_erc20" }],
    [{ text: "USDT (TRC20)", callback_data: "crypto_usdt_trc20" }],
    [{ text: "Ethereum (ERC20)", callback_data: "crypto_eth" }],
    [{ text: "Back to Payments", callback_data: "menu_payments" }]
  ]
};

const cryptoAddresses = {
  crypto_btc: { name: "Bitcoin (BTC)", address: "1CRTNxXy9PLu8SPV95WA5nuQ9mUKmih1AC" },
  crypto_usdt_erc20: { name: "USDT (ERC20)", address: "0x718c5Cc3859422504aCbb465c8CfC12Eaae5f3CA" },
  crypto_usdt_trc20: { name: "USDT (TRC20)", address: "TMDynpQiwjVVo2wChezeawv2JP36qK3atE" },
  crypto_eth: { name: "Ethereum (ERC20)", address: "0x718c5Cc3859422504aCbb465c8CfC12Eaae5f3CA" }
};

const welcomeText = `WELCOME TO THE JACK STACKED

This is my Telegram app — everything I offer, all in one place. Inside, you can:
- Explore my exclusive content INSIDE Telegram
- Find my OnlyFans Pages
- Book 1-2-1 video calls with me
- Arrange to meet me in person where available
- Send me a Gift to show your support

Choose where you want to go next:`;

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

async function sendPhoto(chatId, fileId, caption) {
  if (!BOT_TOKEN) return;

  try {
    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: fileId,
        caption
      })
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.log("Telegram sendPhoto failed:", resp.status, t);
    }
  } catch (err) {
    console.log("sendPhoto error:", err);
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
  // Respond immediately so Telegram doesn't retry
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
          clearState(chatId);
          await sendTelegram(chatId, welcomeText, mainMenu);

        } else if (data === "menu_telegram_channels") {
          clearState(chatId);
          await sendTelegram(
            chatId,
            "TELEGRAM CHANNELS\n\n" +
              "Join either channel below.\n\n" +
              "✅ Premium *Paid* Channel (ALL content) can be joined from inside *either* the SFW or NSFW channel.\n" +
              "Once you’re in, follow the pinned instructions to upgrade.\n\n" +
              "Choose a channel:",
            telegramChannelsMenu
          );

        } else if (data === "menu_booking") {
          clearState(chatId);
          await sendTelegram(
            chatId,
            "VIDEO CALLS & CUSTOM VIDEOS\n\n1) Pay on Tribute\n2) Come back here\n3) Tap ✅ *I’ve paid* and send details\n\n(WhatsApp is for meets only.)",
            bookingMenu
          );

        } else if (data === "menu_meetme") {
          clearState(chatId);
          await sendTelegram(chatId, "MEET ME\n\nChoose an option below:", meetMenu);

        } else if (data === "menu_payments") {
          clearState(chatId);
          await sendTelegram(chatId, "PAYMENTS\n\nChoose your payment method:", paymentsMenu);

        } else if (data === "menu_crypto") {
          clearState(chatId);
          await sendTelegram(chatId, "CRYPTO PAYMENTS\n\nSelect a cryptocurrency:", cryptoMenu);

        } else if (cryptoAddresses[data]) {
          clearState(chatId);
          const c = cryptoAddresses[data];
          await sendTelegram(
            chatId,
            `${c.name}\n\n\`${c.address}\`\n\nTap the address above to copy it.`,
            {
              inline_keyboard: [
                [{ text: "Back to Crypto", callback_data: "menu_crypto" }],
                [{ text: "Main Menu", callback_data: "menu_main" }]
              ]
            }
          );

          // ===== PAID FLOW =====
        } else if (data === "paid_start") {
          setState(chatId, { step: "choose_type", data: {} });
          await sendTelegram(chatId, "What did you pay for?", paidTypeMenu);

        } else if (data === "paid_type_videocall" || data === "paid_type_custom") {
          const type = data === "paid_type_videocall" ? "Video Call" : "Custom Video";
          setState(chatId, { step: "ask_details", data: { type } });

          const prompt =
            type === "Video Call"
              ? "Send in *ONE message*:\n\n• Preferred date/time + timezone\n• Any requests/limits\n\nThen send a screenshot of the Tribute confirmation, or type `skip`."
              : "Send in *ONE message*:\n\n• What you want (clear scenario)\n• Length/style\n• Any requests/limits\n• Deadline (if any)\n\nThen send a screenshot of the Tribute confirmation, or type `skip`.";

          await sendTelegram(chatId, `Got it: *${type}*.\n\n${prompt}`);

        } else {
          // Unknown callback — do nothing
        }

        return;
      }

      // ===== MESSAGES =====
      if (message) {
        const chatId = message.chat.id;

        // /start
        if (message.text) {
          const text = message.text.trim().toLowerCase();

          if (text === "/start" || text === "start") {
            clearState(chatId);
            await sendTelegram(chatId, welcomeText, mainMenu);
            return;
          }
        }

        const st = getState(chatId);
        if (!st) return;

        // Step: ask_details (expects text)
        if (st.step === "ask_details") {
          if (!message.text) {
            await sendTelegram(chatId, "Please send the details as text in one message.");
            return;
          }

          st.data.details = message.text.trim();
          st.step = "await_proof";
          setState(chatId, st);

          await sendTelegram(chatId, "Nice. Now send the payment screenshot, or type `skip`.");
          return;
        }

        // Step: await_proof (accept photo OR "skip")
        if (st.step === "await_proof") {
          const hasPhoto = Array.isArray(message.photo) && message.photo.length > 0;
          const isSkip =
            message.text && typeof message.text === "string" && message.text.trim().toLowerCase() === "skip";

          if (!hasPhoto && !isSkip) {
            await sendTelegram(chatId, "Send a screenshot photo, or type `skip`.");
            return;
          }

          const username = message.from && message.from.username ? `@${message.from.username}` : "(no username)";
          const summary =
            `✅ *BOOKING PAID*\n` +
            `User: ${username}\n` +
            `Chat ID: \`${chatId}\`\n` +
            `Type: *${st.data.type}*\n\n` +
            `Details:\n${st.data.details || "n/a"}\n\n` +
            `Proof: ${hasPhoto ? "✅ Screenshot attached" : "⏭️ Skipped"}`;

          if (ADMIN_CHAT_ID) {
            await sendTelegram(ADMIN_CHAT_ID, summary);

            if (hasPhoto) {
              const best = message.photo[message.photo.length - 1];
              await sendPhoto(ADMIN_CHAT_ID, best.file_id, `Payment proof from ${username} (Chat ID: ${chatId})`);
            }
          } else {
            console.log("WARNING: ADMIN_CHAT_ID not set; cannot forward paid request.");
          }

          clearState(chatId);
          await sendTelegram(
            chatId,
            "Perfect ✅ I’ve got everything. I’ll confirm with you here on Telegram shortly.",
            mainMenu
          );
          return;
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
  console.log("ADMIN_CHAT_ID SET:", Boolean(process.env.ADMIN_CHAT_ID));
});
