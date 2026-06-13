const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  try {
    const { communication_id, status } = req.body;

    // Update communication status
    await pool.query(
      'UPDATE communications SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, communication_id]
    );

    // Update campaign stats
    const commResult = await pool.query(
      'SELECT campaign_id FROM communications WHERE id = $1',
      [communication_id]
    );

    if (commResult.rows.length > 0) {
      const campaignId = commResult.rows[0].campaign_id;
      await pool.query(
        `UPDATE campaigns SET stats = jsonb_set(stats, '{${status}}', (COALESCE((stats->>'${status}')::int, 0) + 1)::text::jsonb) WHERE id = $1`,
        [campaignId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;