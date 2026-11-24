const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON from the frontend
app.use(express.json());

// Hardcoded credentials as requested
const token = '9089639442:AAHhcFiQboEotPXbcDMbsTtg4r4kto4X2E4';
const adminChatId = '8936816151';

// Initialize Bot
let bot;
if (token) {
    bot = new TelegramBot(token, { polling: true });
    
    // Listen for button clicks in Telegram
    bot.on('callback_query', (query) => {
        const action = query.data;
        bot.answerCallbackQuery(query.id, { text: 'Processing...' });

        if (action.startsWith('approve_')) {
            const amount = action.split('_')[1];
            bot.sendMessage(query.message.chat.id, `✅ Approved loan for ${amount} XAF.`);
        } else if (action.startsWith('reject_')) {
            bot.sendMessage(query.message.chat.id, `❌ Rejected loan.`);
        }
    });
} else {
    console.warn("⚠️ TELEGRAM_BOT_TOKEN is missing.");
}

// Serve static files (HTML, CSS, JS, Images)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Endpoint to trigger approval from your website
app.post('/api/request-approval', (req, res) => {
    const { amount, term, phone } = req.body;

    if (!bot || !adminChatId) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Send message with Inline Keyboard
    bot.sendMessage(adminChatId, `📄 *New Loan Request*\n\n💰 Amount: ${amount} XAF\n⏱ Term: ${term} Months\n📱 Phone: ${phone}`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Approve', callback_data: `approve_${amount}` },
                    { text: '❌ Reject', callback_data: `reject_${amount}` }
                ]
            ]
        }
    }).then(() => {
        res.status(200).json({ message: 'Approval request sent to Telegram' });
    }).catch((err) => {
        console.error(err);
        res.status(500).json({ error: 'Failed to send request' });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});