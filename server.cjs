const express = require("express");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Menus
const mainMenu = {
  inline_keyboard: [
    [{ text: "Premium Telegram Channel", url: "https://t.me/jackstackedpaybot" }],
    [
      { text: "VIP OnlyFans", url: "https://onlyfans.com/hugeandhung" },
      { text: "Exclusive Bottom", url: "https://onlyfans.com/jackpowerbottom" }
    ],
    [{ text: "JustForFans", url: "https://justfor.fans/JackStacked" }],
    [{ text: "Meet Me", callback_data: "menu_meetme" }],
    [{ text: "Book Video Call", url: "https://wa.me/447445328647?text=Book%20Video%20Call" }],
    [{ text: "Payments", callback_data: "menu_payments" }]
  ]
};

const meetMenu = {
  inline_keyboard: [
    [{ text: "Rentmen", url: "https://rentmen.eu/JackStacked" }],
    [{ text: "Make a Booking", url: "https://wa.me/447445328647?text=Telegram%20Booking%20Enquiry" }],
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
    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        reply_markup: keyboard
      })
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

      if (callback_query) {
        const chatId = callback_query.message.chat.id;
        const data = callback_query.data;

        await answerCallback(callback_query.id);

        if (data === "menu_main") {
          await sendTelegram(chatId, welcomeText, mainMenu);
        } else if (data === "menu_meetme") {
          await sendTelegram(chatId, "MEET ME\n\nChoose an option below:", meetMenu);
        } else if (data === "menu_payments") {
          await sendTelegram(chatId, "PAYMENTS\n\nChoose your payment method:", paymentsMenu);
        } else if (data === "menu_crypto") {
          await sendTelegram(chatId, "CRYPTO PAYMENTS\n\nSelect a cryptocurrency:", cryptoMenu);
        } else if (cryptoAddresses[data]) {
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
        }
        return;
      }

      if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text.trim().toLowerCase();

        if (text === "/start" || text === "start") {
          await sendTelegram(chatId, welcomeText, mainMenu);
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
