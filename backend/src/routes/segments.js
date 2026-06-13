const express = require('express');
const router = express.Router();
const pool = require('../db');
const Groq = require('groq-sdk');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Get all segments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM segments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create segment
router.post('/', async (req, res) => {
  try {
    const { name, rules } = req.body;

    // Count matching customers
    let count = 0;
    try {
      let query = 'SELECT COUNT(*) FROM customers WHERE 1=1';
      const params = [];
      let i = 1;

      if (rules.min_spent) {
        query += ` AND total_spent >= $${i++}`;
        params.push(rules.min_spent);
      }
      if (rules.max_spent) {
        query += ` AND total_spent <= $${i++}`;
        params.push(rules.max_spent);
      }
      if (rules.inactive_days) {
        query += ` AND last_order_at <= NOW() - INTERVAL '${parseInt(rules.inactive_days)} days'`;
      }
      if (rules.city) {
        query += ` AND city = $${i++}`;
        params.push(rules.city);
      }

      const countResult = await pool.query(query, params);
      count = parseInt(countResult.rows[0].count);
    } catch (e) {
      count = 0;
    }

    const result = await pool.query(
      `INSERT INTO segments (name, rules, customer_count) VALUES ($1, $2, $3) RETURNING *`,
      [name, JSON.stringify(rules), count]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Suggest segment rules
router.post('/ai-suggest', async (req, res) => {
  try {
    const { prompt } = req.body;

    const message = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are a CRM segmentation engine. Convert this plain English description into a JSON rules object.

Available rule fields:
- min_spent: minimum total spent (number in INR)
- max_spent: maximum total spent (number in INR)
- inactive_days: hasn't ordered in this many days (number)
- city: specific city name (string)

Description: "${prompt}"

Respond with ONLY a valid JSON object, no explanation, no markdown. Example:
{"min_spent": 3000, "inactive_days": 30}`
      }]
    });
    const text = message.choices[0].message.content.trim();
    const rules = JSON.parse(text);
    res.json({ rules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;