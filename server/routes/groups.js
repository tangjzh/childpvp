const express = require('express');
const db = require('../models/Group');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// 验证管理员权限的中间件
const isAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
};

// 所有组管理路由都需要验证token和管理员权限
router.use(authenticateToken);
router.use(isAdmin);

// 创建用户组
router.post('/', (req, res) => {
  const { name, description } = req.body;
  
  db.run(
    `INSERT INTO groups (name, description) VALUES (?, ?)`,
    [name, description],
    function(err) {
      if (err) {
        return res.status(400).json({ message: '创建用户组失败。' });
      }
      res.status(201).json({ 
        id: this.lastID, 
        name, 
        description 
      });
    }
  );
});

// 获取所有用户组
router.get('/', (req, res) => {
  db.all(
    `SELECT g.*, 
     COUNT(DISTINCT CASE WHEN u.userType = 'parent' THEN gm.user_id END) as parent_count,
     COUNT(DISTINCT CASE WHEN u.userType = 'child' THEN gm.user_id END) as child_count
     FROM groups g
     LEFT JOIN group_members gm ON g.id = gm.group_id
     LEFT JOIN users u ON gm.user_id = u.id
     GROUP BY g.id`,
    [],
    (err, groups) => {
      if (err) {
        return res.status(400).json({ message: '获取用户组失败。' });
      }
      res.json(groups);
    }
  );
});

// 获取特定用户组的成员
router.get('/:id/members', (req, res) => {
  const { id } = req.params;
  
  db.all(
    `SELECT u.id, u.username, u.userType, gm.joined_at
     FROM users u
     JOIN group_members gm ON u.id = gm.user_id
     WHERE gm.group_id = ?`,
    [id],
    (err, members) => {
      if (err) {
        return res.status(400).json({ message: '获取组成员失败。' });
      }
      res.json(members);
    }
  );
});

// 添加用户到组
router.post('/:id/members', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  db.run(
    `INSERT INTO group_members (group_id, user_id) VALUES (?, ?)`,
    [id, userId],
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ message: '用户已在该组中。' });
        }
        return res.status(400).json({ message: '添加组成员失败。' });
      }
      res.status(201).json({ message: '成功添加用户到组。' });
    }
  );
});

// 从组中移除用户
router.delete('/:groupId/members/:userId', (req, res) => {
  const { groupId, userId } = req.params;
  
  db.run(
    `DELETE FROM group_members WHERE group_id = ? AND user_id = ?`,
    [groupId, userId],
    function(err) {
      if (err) {
        return res.status(400).json({ message: '移除组成员失败。' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: '未找到指定的组成员。' });
      }
      res.json({ message: '成功从组中移除用户。' });
    }
  );
});

// 删除用户组
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run(
    `DELETE FROM groups WHERE id = ?`,
    [id],
    function(err) {
      if (err) {
        return res.status(400).json({ message: '删除用户组失败。' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: '未找到指定的用户组。' });
      }
      res.json({ message: '成功删除用户组。' });
    }
  );
});

module.exports = router; 