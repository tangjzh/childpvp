import React, { useState, useEffect } from 'react';
import { NavBar, List, Avatar, DotLoading } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface RankingUser {
  id: number;
  username: string;
  points: number;
  rank: number;
}

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await api.get('/api/leaderboard');
        setRankings(response.data);
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { color: '#FFD700', fontWeight: 'bold' }; // Gold
      case 2:
        return { color: '#C0C0C0', fontWeight: 'bold' }; // Silver
      case 3:
        return { color: '#CD7F32', fontWeight: 'bold' }; // Bronze
      default:
        return {};
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* <NavBar onBack={() => navigate(-1)}>排行榜</NavBar> */}
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <span>加载中</span>
          <DotLoading />
        </div>
      ) : (
        <List className="flex-1 overflow-auto">
          {rankings.map((user) => (
            <List.Item
              key={user.id}
              prefix={
                <div className="flex items-center justify-center w-8">
                  {user.rank <= 3 ? (
                    <span style={getRankStyle(user.rank)} className="text-lg">
                      {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="text-gray-500">{user.rank}</span>
                  )}
                </div>
              }
              title={user.username}
              extra={<span className="text-primary font-bold">{user.points} 积分</span>}
            >
              <div className="flex items-center">
                <Avatar
                  src="/images/avatar.png"
                  style={{
                    '--size': '40px',
                    marginRight: '12px',
                  }}
                  fallback={user.username[0]?.toUpperCase() || '孩'}
                />
                <div className="flex-1">
                  <div className="text-base">{user.username}</div>
                </div>
              </div>
            </List.Item>
          ))}
        </List>
      )}
    </div>
  );
};

export default LeaderboardPage; 