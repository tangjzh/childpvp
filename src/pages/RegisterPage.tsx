import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  Form,
  Input,
  Button,
  Toast,
  NavBar,
  Space,
  AutoCenter,
  Selector,
  Popup
} from 'antd-mobile';
import {
  UserOutline,
  LockOutline,
  KeyOutline,
  TeamOutline
} from 'antd-mobile-icons';

interface FormValues {
  username: string;
  password: string;
  userType: ('parent' | 'child' | 'admin')[];
  inviteCode?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const userTypeOptions: {
    label: string;
    value: 'parent' | 'child' | 'admin';
    description: string;
  }[] = [
    {
      label: '孩子',
      value: 'child',
      description: '可以完成任务获得积分并兑换奖励'
    },
    {
      label: '家长',
      value: 'parent',
      description: '可以创建任务和设置奖励'
    },
    {
      label: '管理员',
      value: 'admin',
      description: '需要邀请码'
    }
  ];

  const onUserTypeChange = (value: ('parent' | 'child' | 'admin')[]) => {
    const userType = value[0];
    setShowInviteCode(userType === 'admin');
    form.setFieldValue('userType', value);
  };

  const onFinish = async (values: FormValues) => {
    const userType = values.userType[0];
    
    // 如果是管理员注册，验证邀请码
    if (userType === 'admin' && values.inviteCode !== 'admin123') {
      Toast.show({
        icon: 'fail',
        content: '邀请码无效'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', {
        username: values.username,
        password: values.password,
        userType
      });

      if (response.status === 201) {
        Toast.show({
          icon: 'success',
          content: '注册成功！'
        });
        navigate('/login');
      }
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '注册失败'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavBar 
        onBack={() => navigate('/login')}
      >
        注册新账号
      </NavBar>
      
      <div className="flex-1 p-4">
        <AutoCenter className="my-8">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
            <TeamOutline fontSize={32} className="text-white" />
          </div>
        </AutoCenter>

        <Form
          form={form}
          layout='vertical'
          onFinish={onFinish}
          initialValues={{
            userType: ['child']
          }}
          footer={
            <Space direction='vertical' block>
              <Button
                block
                color='primary'
                size='large'
                loading={loading}
                type='submit'
              >
                注册
              </Button>
              <Button
                block
                fill='none'
                size='large'
                onClick={() => navigate('/login')}
              >
                已有账号？立即登录
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

          <Form.Item
            name='userType'
            label={
              <div className="flex items-center gap-2">
                <TeamOutline /> 用户类型
              </div>
            }
            rules={[{ required: true, message: '请选择用户类型' }]}
          >
            <Selector
              columns={3}
              options={userTypeOptions}
              onChange={onUserTypeChange}
            />
          </Form.Item>

          {showInviteCode && (
            <Form.Item
              name='inviteCode'
              label={
                <div className="flex items-center gap-2">
                  <KeyOutline /> 邀请码
                </div>
              }
              rules={[{ required: true, message: '请输入管理员邀请码' }]}
            >
              <Input
                placeholder='请输入管理员邀请码'
                clearable
              />
            </Form.Item>
          )}
        </Form>
      </div>
    </div>
  );
};

export default RegisterPage; 