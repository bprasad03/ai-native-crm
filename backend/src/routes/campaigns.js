const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');
const Groq = require('groq-sdk');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM campaigns ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create campaign
router.post('/', async (req, res) => {
  try {
    const { name, segment_id, channel, message } = req.body;
    const result = await pool.query(
      `INSERT INTO campaigns (name, segment_id, channel, message, status)
       VALUES ($1, $2, $3, $4, 'draft') RETURNING *`,
      [name, segment_id, channel, message]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Draft message
router.post('/ai-draft', async (req, res) => {
  try {
    const { segmentName, channel, goal } = req.body;

    const message = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are a marketing copywriter for an Indian retail brand. Write a short, personalized ${channel} message for this campaign.

Segment: ${segmentName}
Goal: ${goal}
Channel: ${channel}

Rules:
- For WhatsApp/SMS: keep it under 160 characters, friendly and casual
- For Email: slightly longer, more formal, include a CTA
- Use Indian context (₹ for currency, Indian festivals/culture if relevant)
- Do NOT use placeholder text like [Name] or [Brand]
- Sound human, not robotic

Respond with ONLY the message text, nothing else.`
      }]
    });
    res.json({ message: message.choices[0].message.content.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Launch campaign
router.post('/:id/launch', async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign
    const campResult = await pool.query('SELECT * FROM campaigns WHERE id = $1', [id]);
    const campaign = campResult.rows[0];
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // Get segment customers
    const segResult = await pool.query('SELECT * FROM segments WHERE id = $1', [campaign.segment_id]);
    const segment = segResult.rows[0];
    const rules = segment.rules;

    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    let i = 1;

    if (rules.min_spent) { query += ` AND total_spent >= $${i++}`; params.push(rules.min_spent); }
    if (rules.max_spent) { query += ` AND total_spent <= $${i++}`; params.push(rules.max_spent); }
    if (rules.inactive_days) { query += ` AND last_order_at <= NOW() - INTERVAL '${parseInt(rules.inactive_days)} days'`; }
    if (rules.city) { query += ` AND city = $${i++}`; params.push(rules.city); }

    const customers = await pool.query(query, params);

    // Update campaign status
    await pool.query(`UPDATE campaigns SET status = 'running' WHERE id = $1`, [id]);

    // Send to each customer via channel service
    let sent = 0;
    for (const customer of customers.rows) {
      const commResult = await pool.query(
        `INSERT INTO communications (campaign_id, customer_id, status, sent_at)
         VALUES ($1, $2, 'pending', NOW()) RETURNING id`,
        [id, customer.id]
      );
      const commId = commResult.rows[0].id;

      try {
        await axios.post(`${process.env.CHANNEL_SERVICE_URL}/send`, {
          communication_id: commId,
          recipient: customer.email,
          message: campaign.message,
          channel: campaign.channel,
        });
        sent++;
      } catch (e) {
        console.error('Channel service error:', e.message);
      }
    }

    // Update stats
    await pool.query(
      `UPDATE campaigns SET stats = jsonb_set(stats, '{sent}', $1::text::jsonb) WHERE id = $2`,
      [sent, id]
    );

    res.json({ success: true, sent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Campaign Insight
router.get('/:id/insight', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM campaigns WHERE id = $1', [id]);
    const campaign = result.rows[0];
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const stats = campaign.stats;
    const deliveryRate = stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : 0;
    const openRate = stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(1) : 0;
    const clickRate = stats.sent > 0 ? ((stats.clicked / stats.sent) * 100).toFixed(1) : 0;

    const message = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `You are a CRM analytics assistant. Write a 2-3 sentence plain English insight for this campaign performance.

Campaign: ${campaign.name}
Channel: ${campaign.channel}
Stats:
- Sent: ${stats.sent}
- Delivered: ${stats.delivered} (${deliveryRate}%)
- Failed: ${stats.failed}
- Opened: ${stats.opened} (${openRate}%)
- Clicked: ${stats.clicked} (${clickRate}%)

Be specific, mention the numbers, and give one actionable suggestion. Keep it concise and professional.`
      }]
    });

    res.json({ insight: message.choices[0].message.content.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;