const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const rewardRoutes = require('./routes/rewards');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const leaderboardRouter = require('./routes/leaderboard');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('欢迎使用亲子积分系统 API');
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/leaderboard', leaderboardRouter);

app.listen(PORT, () => {
  console.log(`服务器正在运行在 http://localhost:${PORT}`);
}); 