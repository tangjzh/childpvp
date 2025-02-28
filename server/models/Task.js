const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../database.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parentId INTEGER,
    childId INTEGER,
    title TEXT,
    points INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT 0,
    FOREIGN KEY (parentId) REFERENCES users(id),
    FOREIGN KEY (childId) REFERENCES users(id)
  )`);
});

module.exports = db; 