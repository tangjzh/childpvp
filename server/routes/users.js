const express = require('express');
const db = require('../models/User');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// 获取所有用户
router.get('/', authenticateToken, (req, res) => {
  // 验证用户类型是否为管理员
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: '只有管理员可以查看所有用户' });
  }

  // 获取所有用户，但不包括密码字段
  db.all(
    `SELECT id, username, userType, points, created_at FROM users`,
    [],
    (err, users) => {
      if (err) {
        console.error('获取用户列表失败：', err);
        return res.status(400).json({ message: '获取用户列表失败。' });
      }
      res.json(users);
    }
  );
});

// 获取子用户列表
router.get('/children', authenticateToken, (req, res) => {
  // 验证用户类型是否为家长
  if (req.user.userType !== 'parent') {
    return res.status(403).json({ message: '只有家长可以查看子用户列表' });
  }

  const parentId = req.user.id;

  // 获取同组的子用户，但不包括密码字段
  db.all(
    `SELECT DISTINCT u.id, u.username, u.points 
     FROM users u
     JOIN group_members gm1 ON gm1.user_id = u.id
     JOIN group_members gm2 ON gm2.group_id = gm1.group_id
     WHERE u.userType = 'child' 
     AND gm2.user_id = ?`,
    [parentId],
    (err, children) => {
      if (err) {
        console.error('获取子用户列表失败：', err);
        return res.status(400).json({ message: '获取子用户列表失败。' });
      }
      res.json(children);
    }
  );
});

// 设置积分
router.post('/set-points/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  const { points } = req.body;

  // 验证用户类型是否为管理员
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: '只有管理员可以设置积分' });
  }

  db.run(`UPDATE users SET points = ? WHERE id = ?`, [points, userId], (err) => {
    if (err) {
      console.error('重置积分失败：', err);
      return res.status(400).json({ message: '重置积分失败。' });
    }
    res.json({ message: '积分重置成功。' });
  });
});

// 设置用户角色
router.put('/set-role/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  const { userType } = req.body;
  
  // 验证用户类型是否为管理员
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: '只有管理员可以设置用户角色' });
  }

  db.run(`UPDATE users SET userType = ? WHERE id = ?`, [userType, userId], (err) => {
    if (err) {
      console.error('设置用户角色失败：', err);
      return res.status(400).json({ message: '设置用户角色失败。' });
    }
    res.json({ message: '用户角色设置成功。' });
  });
});

module.exports = router; 