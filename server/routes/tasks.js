const express = require('express');
const db = require('../models/Task');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// 所有任务相关的路由都需要验证token
router.use(authenticateToken);

// 验证用户是否在同一组的中间件
const checkGroupPermission = async (req, res, next) => {
  const parentId = req.user.id;
  const childId = req.body.childId || req.params.childId;

  if (!childId) {
    return next();
  }

  db.get(
    `SELECT COUNT(*) as inSameGroup
     FROM group_members gm1
     JOIN group_members gm2 ON gm1.group_id = gm2.group_id
     WHERE gm1.user_id = ? AND gm2.user_id = ?`,
    [parentId, childId],
    (err, result) => {
      if (err) {
        return res.status(400).json({ message: '验证组权限失败。' });
      }
      if (!result.inSameGroup) {
        return res.status(403).json({ message: '您没有权限对该孩子进行操作。' });
      }
      next();
    }
  );
};

// 创建任务
router.post('/', (req, res) => {
  const { title, points, childId } = req.body;
  const parentId = req.user.id;
  
  // 验证用户类型是否为家长
  if (req.user.userType !== 'parent') {
    return res.status(403).json({ message: '只有家长可以创建任务' });
  }

  // 验证childId是否存在且为child类型，并检查是否在同一组
  db.get(
    `SELECT COUNT(*) as inSameGroup
     FROM group_members gm1
     JOIN group_members gm2 ON gm1.group_id = gm2.group_id
     JOIN users u ON u.id = ? AND u.userType = 'child'
     WHERE gm1.user_id = ? AND gm2.user_id = ?`,
    [childId, parentId, childId],
    (err, result) => {
      if (err) {
        return res.status(400).json({ message: '验证组权限失败。' });
      }
      if (!result.inSameGroup) {
        return res.status(403).json({ message: '您没有权限为该孩子创建任务。' });
      }

      db.run(
        `INSERT INTO tasks (parentId, childId, title, points, completed) VALUES (?, ?, ?, ?, 0)`,
        [parentId, childId, title, points],
        function(err) {
          if (err) {
            return res.status(400).json({ message: '创建任务失败。' });
          }
          res.status(201).json({ 
            id: this.lastID, 
            title, 
            points, 
            completed: false,
            childId
          });
        }
      );
    }
  );
});

// 获取任务列表
router.get('/', (req, res) => {
  const userId = req.user.id;
  const userType = req.user.userType;

  let query;
  let params;

  if (userType === 'parent') {
    // 家长看到自己创建的所有任务，并且只能看到同组内的孩子的任务
    query = `
      SELECT DISTINCT t.*, u.username as childName 
      FROM tasks t 
      JOIN users u ON t.childId = u.id 
      JOIN group_members gm1 ON gm1.user_id = t.parentId
      JOIN group_members gm2 ON gm2.group_id = gm1.group_id AND gm2.user_id = t.childId
      WHERE t.parentId = ?`;
    params = [userId];
  } else {
    // 孩子看到分配给自己的任务，并且只能看到同组内家长分配的任务
    query = `
      SELECT DISTINCT t.*, u.username as parentName 
      FROM tasks t 
      JOIN users u ON t.parentId = u.id 
      JOIN group_members gm1 ON gm1.user_id = t.childId
      JOIN group_members gm2 ON gm2.group_id = gm1.group_id AND gm2.user_id = t.parentId
      WHERE t.childId = ?`;
    params = [userId];
  }

  db.all(query, params, (err, tasks) => {
    if (err) {
      return res.status(400).json({ message: '获取任务失败。' });
    }
    res.json(tasks);
  });
});

// 更新任务
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  db.run(`UPDATE tasks SET title = ?, completed = ? WHERE id = ?`, [title, completed, id], function(err) {
    if (err) {
      return res.status(400).json({ message: '更新任务失败。' });
    }
    res.json({ message: '任务更新成功。' });
  });
});

// 完成任务
router.put('/complete/:id', checkGroupPermission, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // 验证用户类型是否为家长
  if (req.user.userType !== 'parent') {
    return res.status(403).json({ message: '只有家长可以完成任务' });
  }

  // 首先获取任务信息
  db.get(
    `SELECT t.*, u.id as childId 
     FROM tasks t 
     JOIN users u ON t.childId = u.id 
     WHERE t.id = ? AND t.parentId = ? AND t.completed = 0`,
    [id, userId],
    (err, task) => {
      if (err) {
        return res.status(400).json({ message: '获取任务信息失败。' });
      }
      if (!task) {
        return res.status(404).json({ message: '任务不存在或已完成。' });
      }

      // 开始事务
      db.run('BEGIN TRANSACTION');

      // 更新孩子的积分
      db.run(
        `UPDATE users SET points = points + ? WHERE id = ?`,
        [task.points, task.childId],
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(400).json({ message: '更新积分失败。' });
          }

          // 更新任务状态
          db.run(
            `UPDATE tasks SET completed = 1 WHERE id = ?`,
            [id],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(400).json({ message: '更新任务状态失败。' });
              }

              db.run('COMMIT');
              res.json({ 
                message: '任务完成，积分已更新。',
                points: task.points,
                childId: task.childId
              });
            }
          );
        }
      );
    }
  );
});

// 删除任务
router.delete('/:id', checkGroupPermission, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // 验证用户类型是否为家长
  if (req.user.userType !== 'parent') {
    return res.status(403).json({ message: '只有家长可以删除任务' });
  }

  // 验证任务是否属于该家长
  db.get(
    `SELECT * FROM tasks WHERE id = ? AND parentId = ?`,
    [id, userId],
    (err, task) => {
      if (err) {
        return res.status(400).json({ message: '验证任务失败。' });
      }
      if (!task) {
        return res.status(404).json({ message: '任务不存在或无权删除。' });
      }

      db.run(`DELETE FROM tasks WHERE id = ?`, [id], function(err) {
        if (err) {
          return res.status(400).json({ message: '删除任务失败。' });
        }
        res.json({ message: '任务删除成功。' });
      });
    }
  );
});

module.exports = router; 