const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(express.json());

const STATUSES = ['delivered', 'delivered', 'delivered', 'failed', 'opened', 'clicked'];

function randomStatus() {
  return STATUSES[Math.floor(Math.random() * STATUSES.length)];
}

function randomDelay() {
  return Math.floor(Math.random() * 5000) + 1000; // 1–6 seconds
}

// CRM calls this to send a communication
app.post('/send', async (req, res) => {
  const { communication_id, recipient, message, channel } = req.body;

  if (!communication_id || !recipient || !message || !channel) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log(`📤 Sending ${channel} to ${recipient}`);
  res.json({ success: true, message: 'Message queued for delivery' });

  // Simulate async delivery callback
  setTimeout(async () => {
    const status = randomStatus();
    console.log(`📬 Callback → communication_id: ${communication_id} | status: ${status}`);

    try {
      await axios.post(`${process.env.CRM_BACKEND_URL}/api/receipts`, {
        communication_id,
        status,
      });
    } catch (err) {
      console.error('❌ Callback failed:', err.message);
    }
  }, randomDelay());
});

app.get('/', (req, res) => res.json({ status: 'Channel service running ✅' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Channel service running on port ${PORT}`));
