const express = require('express');
const router = express.Router();
const db = require('../models/User');
const authenticateToken = require('../middleware/auth');

// Get leaderboard rankings
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get all children users with their points
    const query = `
      SELECT id, username, points
      FROM users
      WHERE userType = 'child'
      ORDER BY points DESC
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error fetching leaderboard:', err);
        return res.status(500).json({ message: '获取排行榜失败' });
      }

      // Add rank to each user
      const rankings = rows.map((user, index) => ({
        id: user.id,
        username: user.username,
        points: user.points || 0,
        rank: index + 1
      }));

      res.json(rankings);
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: '获取排行榜失败' });
  }
});

module.exports = router; 