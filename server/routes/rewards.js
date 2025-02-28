const express = require('express');
const db = require('../models/Reward');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// 所有奖励相关的路由都需要验证token
router.use(authenticateToken);

// 验证用户是否在同一组的中间件
const checkGroupPermission = async (req, res, next) => {
  const userId = req.user.id;
  const rewardId = req.params.id;

  if (!rewardId) {
    return next();
  }

  // 获取奖励创建者的ID
  db.get(
    `SELECT userId FROM rewards WHERE id = ?`,
    [rewardId],
    (err, reward) => {
      if (err || !reward) {
        return res.status(404).json({ message: '奖励不存在。' });
      }

      // 检查用户是否在同一组
      db.get(
        `SELECT COUNT(*) as inSameGroup
         FROM group_members gm1
         JOIN group_members gm2 ON gm1.group_id = gm2.group_id
         WHERE gm1.user_id = ? AND gm2.user_id = ?`,
        [userId, reward.userId],
        (err, result) => {
          if (err) {
            return res.status(400).json({ message: '验证组权限失败。' });
          }
          if (!result.inSameGroup) {
            return res.status(403).json({ message: '您没有权限操作此奖励。' });
          }
          next();
        }
      );
    }
  );
};

// 创建奖励
router.post('/', (req, res) => {
  const { title, points, childId, reusable } = req.body;
  const userId = req.user.id;

  // 验证用户类型是否为家长
  if (req.user.userType !== 'parent') {
    return res.status(403).json({ message: '只有家长可以创建奖励' });
  }

  // 验证childId是否存在且为child类型，并检查是否在同一组
  db.get(
    `SELECT COUNT(*) as inSameGroup
     FROM group_members gm1
     JOIN group_members gm2 ON gm1.group_id = gm2.group_id
     JOIN users u ON u.id = ? AND u.userType = 'child'
     WHERE gm1.user_id = ? AND gm2.user_id = ?`,
    [childId, userId, childId],
    (err, result) => {
      if (err) {
        return res.status(400).json({ message: '验证组权限失败。' });
      }
      if (!result.inSameGroup) {
        return res.status(403).json({ message: '您没有权限为该孩子创建奖励。' });
      }

      db.run(
        `INSERT INTO rewards (userId, childId, title, points, redeemed, reusable) VALUES (?, ?, ?, ?, 0, ?)`,
        [userId, childId, title, points, reusable ? 1 : 0],
        function(err) {
          if (err) {
            return res.status(400).json({ message: '创建奖励失败。' });
          }
          res.status(201).json({ 
            id: this.lastID, 
            title, 
            points, 
            redeemed: false,
            reusable: Boolean(reusable),
            childId 
          });
        }
      );
    }
  );
});

// 获取用户可见的奖励
router.get('/', (req, res) => {
  const userId = req.user.id;
  const userType = req.user.userType;

  let query;
  let params;

  if (userType === 'parent') {
    // 家长看到自己创建的，并且分配给同组孩子的奖励
    query = `
      SELECT DISTINCT r.*, u.username as childName
      FROM rewards r
      JOIN users u ON r.childId = u.id
      JOIN group_members gm1 ON gm1.user_id = r.userId
      JOIN group_members gm2 ON gm2.group_id = gm1.group_id AND gm2.user_id = r.childId
      WHERE r.userId = ?`;
    params = [userId];
  } else {
    // 孩子只能看到分配给自己的未兑换奖励或可重复兑换的奖励
    query = `
      SELECT DISTINCT r.*, u.username as parentName
      FROM rewards r
      JOIN users u ON r.userId = u.id
      JOIN group_members gm1 ON gm1.user_id = r.childId
      JOIN group_members gm2 ON gm2.group_id = gm1.group_id AND gm2.user_id = r.userId
      WHERE r.childId = ? AND (r.redeemed = 0 OR r.reusable = 1)`;
    params = [userId];
  }

  db.all(query, params, (err, rewards) => {
    if (err) {
      return res.status(400).json({ message: '获取奖励失败。' });
    }
    res.json(rewards);
  });
});

// 兑换奖励
router.post('/redeem/:id', checkGroupPermission, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // 验证用户类型是否为孩子
  if (req.user.userType !== 'child') {
    return res.status(403).json({ message: '只有孩子可以兑换奖励' });
  }

  // 首先获取奖励信息和用户积分
  db.get(
    `SELECT r.*, u.points as userPoints 
     FROM rewards r 
     JOIN users u ON u.id = ? 
     WHERE r.id = ? AND (r.redeemed = 0 OR r.reusable = 1)`,
    [userId, id],
    (err, result) => {
      if (err) {
        return res.status(400).json({ message: '获取奖励信息失败。' });
      }
      if (!result) {
        return res.status(404).json({ message: '奖励不存在或已被兑换。' });
      }
      if (result.userPoints < result.points) {
        return res.status(400).json({ message: '积分不足，无法兑换该奖励。' });
      }

      // 开始事务
      db.run('BEGIN TRANSACTION');

      // 更新用户积分
      db.run(
        `UPDATE users SET points = points - ? WHERE id = ?`,
        [result.points, userId],
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(400).json({ message: '更新积分失败。' });
          }

          // 如果不是可重复兑换的奖励，才标记为已兑换
          if (!result.reusable) {
            db.run(
              `UPDATE rewards SET redeemed = 1 WHERE id = ?`,
              [id],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(400).json({ message: '更新奖励状态失败。' });
                }

                db.run('COMMIT');
                res.json({ 
                  message: '奖励兑换成功。',
                  pointsDeducted: result.points,
                  remainingPoints: result.userPoints - result.points
                });
              }
            );
          } else {
            db.run('COMMIT');
            res.json({ 
              message: '奖励兑换成功。',
              pointsDeducted: result.points,
              remainingPoints: result.userPoints - result.points
            });
          }
        }
      );
    }
  );
});

// 删除奖励
router.delete('/:id', checkGroupPermission, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // 验证用户类型是否为家长
  if (req.user.userType !== 'parent') {
    return res.status(403).json({ message: '只有家长可以删除奖励' });
  }

  // 验证奖励是否属于该家长
  db.get(
    `SELECT * FROM rewards WHERE id = ? AND userId = ?`,
    [id, userId],
    (err, reward) => {
      if (err) {
        return res.status(400).json({ message: '验证奖励失败。' });
      }
      if (!reward) {
        return res.status(404).json({ message: '奖励不存在或无权删除。' });
      }

      // 如果奖励已被兑换且不是可重复兑换的，不允许删除
      if (reward.redeemed && !reward.reusable) {
        return res.status(400).json({ message: '已兑换的一次性奖励不能删除。' });
      }

      db.run(`DELETE FROM rewards WHERE id = ?`, [id], function(err) {
        if (err) {
          return res.status(400).json({ message: '删除奖励失败。' });
        }
        res.json({ message: '奖励删除成功。' });
      });
    }
  );
});

module.exports = router; 