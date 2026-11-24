const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Securely pull tokens from Render's environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Endpoint to receive form data and send to Telegram
app.post('/api/submit-application', async (req, res) => {
    const { loanAmount, loanTerm, loanType, firstName, lastName, phone, purpose, empStatus, annualIncome } = req.body;

    // Log to Render console so you can see if data arrives
    console.log("New Application Received:", req.body);

    const message = `
🔔 *NEW LOAN APPLICATION*
-------------------------
*Name:* ${firstName} ${lastName}
*Phone:* ${phone}
*Loan Type:* ${loanType}
*Amount:* ZMW ${loanAmount}
*Term:* ${loanTerm} Months
*Purpose:* ${purpose}
*Employment:* ${empStatus}
*Annual Income:* ZMW ${annualIncome}
    `;

    try {
        // Check if tokens exist to prevent crash
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.log("Error: Missing Telegram credentials in environment variables.");
            return res.status(500).json({ success: false, message: 'Server configuration error' });
        }

        // Send to Telegram
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });

        res.status(200).json({ success: true, message: 'Application sent to Telegram' });
    } catch (error) {
        console.error('Telegram Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to send notification' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});