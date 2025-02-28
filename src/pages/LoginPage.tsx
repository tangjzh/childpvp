import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import api from '../api/axios';
import { 
  Form,
  Input,
  Button,
  Toast,
  NavBar,
  Space,
  AutoCenter
} from 'antd-mobile';
import {
  UserOutline,
  LockOutline
} from 'antd-mobile-icons';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setPoints, setUserType } = useAppContext();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', values);
      const { token, points, userType } = response.data;
      
      localStorage.setItem('token', token);
      setPoints(points);
      setUserType(userType);

      Toast.show({
        icon: 'success',
        content: '登录成功'
      });

      // 根据用户类型跳转到不同页面
      if (userType === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '登录失败'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavBar back={null}>登录</NavBar>
      
      <div className="flex-1 p-4">
        <AutoCenter className="my-8">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
            <UserOutline fontSize={32} className="text-white" />
          </div>
        </AutoCenter>

        <Form
          layout='vertical'
          onFinish={onFinish}
          footer={
            <Space direction='vertical' block>
              <Button
                block
                color='primary'
                size='large'
                loading={loading}
                type='submit'
              >
                登录
              </Button>
              <Button
                block
                fill='none'
                size='large'
                onClick={() => navigate('/register')}
              >
                还没有账号？立即注册
              </Button>
            </Space>
          }
        >
          <Form.Item
            name='username'
            label={
              <div className="flex items-center gap-2">
                <UserOutline /> 用户名
              </div>
            }
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              placeholder='请输入用户名'
              clearable
            />
          </Form.Item>
          
          <Form.Item
            name='password'
            label={
              <div className="flex items-center gap-2">
                <LockOutline /> 密码
              </div>
            }
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input
              placeholder='请输入密码'
              clearable
              type='password'
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage; 