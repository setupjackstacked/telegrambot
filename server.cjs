const express = require("express");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// ✅ Admin chat id (your personal Telegram user id) for forwarding paid requests
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// ====== CONFIG HELPERS (prevents future mistakes) ======
const WA_NUMBER = "447445328647";
const wa = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

// ====== Tribute links (updated) ======
// (Creator page kept for reference)
const TRIBUTE_CREATOR_PAGE_URL = "https://t.me/tribute/app?startapp=esF";

// ✅ Full Access (Top menu)
const TRIBUTE_FULL_ACCESS_ANNUAL_URL = "https://t.me/tribute/app?startapp=prYo"; // assumed annual (was previously "Full XXX Access")
const TRIBUTE_FULL_ACCESS_MONTHLY_URL = "https://t.me/tribute/app?startapp=sMLY"; // provided by you

// ✅ Direct links from top menu
const TRIBUTE_CUSTOM_URL = "https://t.me/tribute/app?startapp=pqJV"; // custom videos
const TRIBUTE_VIDEO_CALL_URL = "https://t.me/tribute/app?startapp=pqJS"; // video calls

// ✅ Payments submenu top option
const TRIBUTE_PAY_VIA_TELEGRAM_URL = "https://t.me/tribute/app?startapp=d7KK";

// ====== Free Telegram Updates channel (clean PG-13) ======
// Using your existing "SFW Channel" link as the new free updates channel.
// Change this if your new free channel username differs.
const FREE_UPDATES_CHANNEL_URL = "https://t.me/jackstackedupdates";

// ====== Simple in-memory state for the paid flow ======
const userState = new Map(); // chatId -> { step, data }
const setState = (chatId, s) => userState.set(String(chatId), s);
const getState = (chatId) => userState.get(String(chatId));
const clearState = (chatId) => userState.delete(String(chatId));

// ====== Paid details capture flow (kept; now launched from main menu) ======
const paidTypeMenu = {
  inline_keyboard: [
    [{ text: "📞 Video Call", callback_data: "paid_type_videocall" }],
    [{ text: "🎥 Custom Video", callback_data: "paid_type_custom" }],
    [{ text: "⬅️ Back", callback_data: "menu_main" }]
  ]
};

// ====== Menus ======
const mainMenu = {
  inline_keyboard: [
    // ✅ Top: Full access options
    [{ text: "🔥 Full Access — Annual", url: TRIBUTE_FULL_ACCESS_ANNUAL_URL }],
    [{ text: "🔥 Full Access — Monthly", url: TRIBUTE_FULL_ACCESS_MONTHLY_URL }],

    // ✅ Free updates channel (clean)
    [{ text: "📢 Free Telegram Channel Updates", url: FREE_UPDATES_CHANNEL_URL }],

    // Existing row
    [
      { text: "VIP OnlyFans", url: "https://onlyfans.com/hugeandhung" },
      { text: "Exclusive Bottom", url: "https://onlyfans.com/jackpowerbottom" }
    ],
    [{ text: "JustForFans", url: "https://justfor.fans/JackStacked" }],

    // ✅ Direct Tribute links from top menu
    [{ text: "📹 Video Calls", url: TRIBUTE_VIDEO_CALL_URL }],
    [{ text: "🎬 Custom Videos", url: TRIBUTE_CUSTOM_URL }],

    // ✅ Keep paid details capture (no extra pay menus, just send details after paying)
    [{ text: "✅ I’ve paid (send details)", callback_data: "paid_start" }],

    // Meets (WhatsApp only for meets)
    [{ text: "Meet Me", callback_data: "menu_meetme" }],

    // Payments submenu
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
    // ✅ NEW TOP OPTION
    [{ text: "Pay via Telegram", url: TRIBUTE_PAY_VIA_TELEGRAM_URL }],

    // Rest kept the same
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

This is my Telegram hub — everything I offer, all in one place. Inside, you can:
- Join my FREE Telegram updates channel (PG-13)
- Get full access (Monthly or Annual)
- Find my OnlyFans pages
- Book video calls or custom videos
- Arrange to meet me in person where available
- Send a gift / support via payments

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

        // ===== PAID FLOW (send details after paying) =====
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
