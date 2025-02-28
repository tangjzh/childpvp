import React, { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { 
  NavBar, 
  Card, 
  Button, 
  Toast, 
  Tag, 
  Grid,
  TabBar,
  Badge,
  Avatar,
  List,
  SwipeAction,
  Dialog,
  Popover
} from 'antd-mobile';
import {
  UserOutline,
  CheckOutline,
  GiftOutline,
  CloseOutline,
  SetOutline,
  StarOutline
} from 'antd-mobile-icons';
import Leaderboard from '../pages/LeaderboardPage';

interface Task {
  id: number;
  title: string;
  points: number;
  completed: boolean;
  childName?: string;
  parentName?: string;
}

interface Reward {
  id: number;
  title: string;
  points: number;
  redeemed: boolean;
  reusable: boolean;
  childName?: string;
  parentName?: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const { points, setPoints, userType, setUserType } = useAppContext();
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string>('');
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    const setViewHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewHeight();
    window.addEventListener('resize', setViewHeight);
    return () => window.removeEventListener('resize', setViewHeight);
  }, []);

  useEffect(() => {
    const validateToken = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return null;
      }

      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        if (!tokenData.id || !tokenData.userType) {
          localStorage.removeItem('token');
          navigate('/login');
          return null;
        }
        setUserType(tokenData.userType);
        setUsername(tokenData.username || '');
        return tokenData.id;
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
        navigate('/login');
        return null;
      }
    };

    const userId = validateToken();
    if (userId) {
      setUserId(userId);
    }
  }, [navigate, setUserType]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      try {
        const [userResponse, pointsResponse, tasksResponse, rewardsResponse] = await Promise.all([
          api.get(`/api/auth/user/${userId}`),
          api.get(`/api/auth/points/${userId}`),
          api.get('/api/tasks'),
          api.get('/api/rewards')
        ]);
        
        setUsername(userResponse.data.username);
        setPoints(pointsResponse.data.points);
        setTasks(tasksResponse.data);
        setRewards(rewardsResponse.data);
      } catch (error: any) {
        console.error('获取数据失败：', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          setUserId(null);
          setUserType('');
          setPoints(0);
          setUsername('');
          navigate('/login');
        }
      }
    };

    fetchData();
  }, [userId, setPoints, navigate, setUserType]);

  const handleCompleteTask = async (id: number) => {
    if (!userId) return;
    try {
      const response = await api.put(`/api/tasks/complete/${id}`);
      const [pointsResponse, tasksResponse] = await Promise.all([
        api.get(`/api/auth/points/${userId}`),
        api.get('/api/tasks')
      ]);
      
      setPoints(pointsResponse.data.points);
      setTasks(tasksResponse.data);
      Toast.show({
        icon: 'success',
        content: `任务完成！奖励 ${response.data.points} 积分`
      });
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '完成任务失败'
      });
    }
  };

  const handleRedeemReward = async (id: number, requiredPoints: number) => {
    if (!userId || points < requiredPoints) {
      Toast.show({
        icon: 'fail',
        content: '积分不足！'
      });
      return;
    }
    try {
      await api.post(`/api/rewards/redeem/${id}`);
      const [pointsResponse, rewardsResponse] = await Promise.all([
        api.get(`/api/auth/points/${userId}`),
        api.get('/api/rewards')
      ]);
      
      setPoints(pointsResponse.data.points);
      setRewards(rewardsResponse.data);
      Toast.show({
        icon: 'success',
        content: '奖励兑换成功！'
      });
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '兑换奖励失败'
      });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const result = await Dialog.confirm({
      content: '确定要删除这个任务吗？'
    });
    
    if (result) {
      try {
        await api.delete(`/api/tasks/${taskId}`);
        setTasks(tasks.filter(task => task.id !== taskId));
        Toast.show({
          icon: 'success',
          content: '任务删除成功'
        });
      } catch (error: any) {
        Toast.show({
          icon: 'fail',
          content: error.response?.data?.message || '删除任务失败'
        });
      }
    }
  };

  const handleDeleteReward = async (rewardId: number) => {
    const result = await Dialog.confirm({
      content: '确定要删除这个奖励吗？'
    });
    
    if (result) {
      try {
        await api.delete(`/api/rewards/${rewardId}`);
        setRewards(rewards.filter(reward => reward.id !== rewardId));
        Toast.show({
          icon: 'success',
          content: '奖励删除成功'
        });
      } catch (error: any) {
        Toast.show({
          icon: 'fail',
          content: error.response?.data?.message || '删除奖励失败'
        });
      }
    }
  };

  const handleLogout = async () => {
    const result = await Dialog.confirm({
      content: '确定要退出登录吗？'
    });
    
    if (result) {
      localStorage.removeItem('token');
      setPoints(0);
      setUserType('');
      window.location.href = '/login';
    }
  };

  const uncompletedTasks = tasks.filter(task => !task.completed);
  const availableRewards = rewards.filter(reward => !reward.redeemed);

  const tabs = [
    {
      key: 'tasks',
      title: '任务',
      icon: <CheckOutline />,
      badge: uncompletedTasks.length
    },
    {
      key: 'rewards',
      title: '奖励',
      icon: <GiftOutline />,
      badge: availableRewards.length
    },
    {
      key: 'leaderboard',
      title: '排行榜',
      icon: <StarOutline />
    }
  ];

  return (
    <div className="flex flex-col h-screen">
      <NavBar
        right={
          <Button
            fill='none'
            onClick={() => userType === 'admin' ? navigate('/admin') : undefined}
          >
            <SetOutline fontSize={24} />
          </Button>
        }
        left={
          <Popover
            content={
              <div style={{ padding: '2px 4px' }}>
                <div
                  className="flex items-center gap-2 text-[14px]"
                  onClick={handleLogout}
                >
                  退出登录
                </div>
              </div>
            }
            trigger='click'
            placement='bottomLeft'
          >
            <Avatar
              src={"/images/avatar.png"}
              className="bg-primary cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
              fallback={username?.[0]?.toUpperCase() || (userType === 'parent' ? '家' : userType === 'child' ? '孩' : '管')}
              style={{
                '--size': '36px',
                '--border-radius': '50%',
                backgroundColor: '#f5f5f5',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </Popover>
        }
        back={null}
      >
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium">{username}</span>
          <span className="text-xs text-gray-500">
            {userType === 'admin' ? '管理员' : userType === 'parent' ? '家长' : '同学'}
            {userType === 'child' && `(${points} 积分)`}
          </span>
        </div>
      </NavBar>

      {userType === 'parent' && (
        <Grid columns={2} gap={8} style={{ padding: '8px' }}>
          <Grid.Item>
            <Button
              block
              color='primary'
              onClick={() => navigate('/tasks')}
              style={{ '--border-radius': '8px' }}
            >
              布置任务
            </Button>
          </Grid.Item>
          <Grid.Item>
            <Button
              block
              color='success'
              onClick={() => navigate('/rewards')}
              style={{ '--border-radius': '8px' }}
            >
              设置奖励
            </Button>
          </Grid.Item>
        </Grid>
      )}

      <div className="flex-1 overflow-auto" style={{ padding: '8px', height: 'calc(var(--vh, 1vh) * 71)' }}>
        {activeTab === 'tasks' ? (
          <List header='未完成的任务'>
            {uncompletedTasks.length === 0 ? (
              <List.Item>暂无未完成的任务</List.Item>
            ) : (
              uncompletedTasks.map((task) => (
                <SwipeAction
                  key={task.id}
                  rightActions={
                    userType === 'parent' ? [
                      {
                        key: 'delete',
                        text: '删除',
                        color: 'danger',
                        onClick: () => handleDeleteTask(task.id)
                      },
                      {
                        key: 'complete',
                        text: '完成',
                        color: 'primary',
                        onClick: () => handleCompleteTask(task.id)
                      }
                    ] : []
                  }
                >
                  <List.Item
                    title={task.title}
                    description={task.childName ? `分配给: ${task.childName}` : `来自: ${task.parentName}`}
                    extra={<Tag color='primary'>{task.points} 积分</Tag>}
                  />
                </SwipeAction>
              ))
            )}
          </List>
        ) : activeTab === 'rewards' ? (
          <List header='可用的奖励'>
            {availableRewards.length === 0 ? (
              <List.Item>暂无可用的奖励</List.Item>
            ) : (
              availableRewards.map((reward) => (
                <SwipeAction
                  key={reward.id}
                  rightActions={
                    userType === 'parent' ? [
                      {
                        key: 'delete',
                        text: '删除',
                        color: 'danger',
                        onClick: () => handleDeleteReward(reward.id)
                      }
                    ] : userType === 'child' ? [
                      {
                        key: 'redeem',
                        text: '兑换',
                        color: 'primary',
                        onClick: () => handleRedeemReward(reward.id, reward.points)
                      }
                    ] : []
                  }
                >
                  <List.Item
                    title={reward.title}
                    description={
                      <>
                        {reward.childName ? `分配给: ${reward.childName}` : `来自: ${reward.parentName}`}
                        {reward.reusable ? <Tag color='success' style={{ marginLeft: '8px' }}>可重复兑换</Tag> : null}
                      </>
                    }
                    extra={
                      <Tag color={points >= reward.points ? 'success' : 'default'}>
                        {reward.points} 积分
                      </Tag>
                    }
                  />
                </SwipeAction>
              ))
            )}
          </List>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Leaderboard />
          </div>
        )}
      </div>

      <TabBar activeKey={activeTab} onChange={setActiveTab}>
        {tabs.map(item => (
          <TabBar.Item
            key={item.key}
            icon={item.icon}
            title={item.title}
            badge={item.badge}
          />
        ))}
      </TabBar>
    </div>
  );
};

export default HomePage; 