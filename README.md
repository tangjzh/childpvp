# ChildPVP

ChildPVP 是一个基于 React 和 Node.js 构建的全栈 Web 应用程序，这是一个面向家长和孩子的任务奖励管理系统。该项目使用 TypeScript 作为主要开发语言，前端使用 Ant Design 和 Ant Design Mobile 组件库，后端采用 Express 框架并使用 SQLite 数据库。

## 主要功能

### 用户系统
- 多角色支持：管理员、家长、孩子
- 用户认证和授权
- 个性化头像和用户信息显示

### 任务管理
- 家长可以为孩子布置任务
- 任务包含标题和积分奖励
- 任务状态追踪（未完成/已完成）
- 支持任务的删除和完成确认

### 奖励系统
- 家长可以设置各种奖励项目
- 奖励支持一次性和可重复兑换两种类型
- 孩子可以使用累积的积分兑换奖励
- 积分余额实时显示

### 排行榜
- 显示用户积分排名
- 激励竞争机制

### 移动端适配
- 响应式设计
- 手势操作支持（滑动删除/完成任务）
- 现代化的移动端UI组件

## 技术栈

### 前端
- React 18
- TypeScript
- React Router DOM
- Ant Design & Ant Design Mobile
- Axios

### 后端
- Node.js
- Express
- SQLite

## 项目结构

```
childpvp/
├── src/                # 前端源代码
│   ├── api/           # API 接口
│   ├── components/    # 可复用组件
│   ├── pages/        # 页面组件
│   └── AppContext.tsx # 应用上下文
├── server/            # 后端源代码
│   ├── config/       # 配置文件
│   ├── models/       # 数据模型
│   ├── routes/       # 路由处理
│   └── middleware/   # 中间件
└── public/           # 静态资源
```

## 安装说明

1. 克隆项目
```bash
git clone [项目地址]
```

2. 安装前端依赖
```bash
npm install
```

3. 安装后端依赖
```bash
cd server
npm install
```

## 运行项目

1. 启动前端开发服务器
```bash
npm start
```

2. 启动后端服务器
```bash
cd server
node app.js
```

前端服务将在 http://localhost:3000 运行
后端服务将在 http://localhost:5000 运行

## 开发指南

- 使用 `npm start` 启动开发服务器
- 使用 `npm test` 运行测试
- 使用 `npm run build` 构建生产版本

## 贡献指南

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 许可证

[MIT License](LICENSE)
