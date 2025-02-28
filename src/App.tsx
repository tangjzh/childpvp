import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import './App.css';
import { AppProvider } from './AppContext';
import PrivateRoute from './components/PrivateRoute';
import TaskPage from './pages/TaskPage';
import RewardPage from './pages/RewardPage';
import AdminPage from './pages/AdminPage';
import LeaderboardPage from './pages/LeaderboardPage';

// 保护路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

// 管理员路由保护组件
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }

  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    if (tokenData.userType !== 'admin') {
      return <Navigate to="/" />;
    }
  } catch (error) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <header className="App-header">
            <h2>亲子积分系统</h2>
          </header>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/tasks" element={<PrivateRoute element={<TaskPage />} />} />
            <Route path="/rewards" element={<PrivateRoute element={<RewardPage />} />} />
            <Route path="/" element={<PrivateRoute element={<HomePage />} />} />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
};

export default App;
