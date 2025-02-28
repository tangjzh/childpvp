const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/User');
const router = express.Router();

const JWT_SECRET = 'your_jwt_secret'; // 请更改为安全的密钥

// 注册
router.post('/register', async (req, res) => {
  const { username, password, userType } = req.body;
  
  if (!username || !password || !userType) {
    return res.status(400).json({ message: '请提供用户名、密码和用户类型。' });
  }

  if (!['parent', 'child', 'admin'].includes(userType)) {
    return res.status(400).json({ message: '无效的用户类型。用户类型必须是 parent、child 或 admin。' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (username, password, userType) VALUES (?, ?, ?)`,
    [username, hashedPassword, userType],
    function(err) {
      if (err) {
        return res.status(400).json({ message: '注册失败，用户名可能已被使用。' });
      }
      res.status(201).json({ message: '注册成功！' });
    }
  );
});

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ message: '用户名或密码错误。' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '用户名或密码错误。' });
    }

    const token = jwt.sign({ 
      id: user.id, 
      points: user.points,
      userType: user.userType 
    }, JWT_SECRET);
    
    res.json({ 
      token, 
      userId: user.id, 
      points: user.points,
      userType: user.userType
    });
  });
});

// 获取用户积分
router.get('/points/:userId', (req, res) => {
  const { userId } = req.params;
  db.get('SELECT points FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(400).json({ message: '获取积分失败。' });
    }
    if (!user) {
      return res.status(404).json({ message: '用户不存在。' });
    }
    res.json({ points: user.points });
  });
});

// 获取用户信息
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;
  db.get('SELECT id, username, userType, points FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(400).json({ message: '获取用户信息失败。' });
    }
    if (!user) {
      return res.status(404).json({ message: '用户不存在。' });
    }
    res.json({
      id: user.id,
      username: user.username,
      userType: user.userType,
      points: user.points
    });
  });
});

module.exports = router; 