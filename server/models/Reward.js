const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../database.db'));

// 创建奖励表
db.run(`
  CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    childId INTEGER NOT NULL,
    title TEXT NOT NULL,
    points INTEGER NOT NULL,
    redeemed INTEGER DEFAULT 0,
    reusable INTEGER DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (childId) REFERENCES users(id)
  )
`);

module.exports = db; 