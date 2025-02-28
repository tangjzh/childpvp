import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAppContext } from '../AppContext';
import { 
  Form,
  Input,
  Button,
  Toast,
  NavBar,
  Space,
  AutoCenter,
  Selector,
  Stepper
} from 'antd-mobile';
import {
  GiftOutline,
  UserOutline,
  StarOutline
} from 'antd-mobile-icons';

interface Child {
  id: number;
  username: string;
  points: number;
}

interface FormValues {
  childId: number[];
  title: string;
  points: number;
  reusable: number[];
}

const RewardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const { userType } = useAppContext();
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    // 如果用户不是家长，重定向到首页
    if (userType !== 'parent') {
      Toast.show({
        icon: 'fail',
        content: '只有家长可以创建奖励'
      });
      navigate('/');
      return;
    }

    // 获取可选择的孩子列表
    const fetchChildren = async () => {
      try {
        const response = await api.get('/api/users/children');
        setChildren(response.data);
        if (response.data.length > 0) {
          form.setFieldValue('childId', [response.data[0].id]);
        } else {
          Toast.show({
            icon: 'fail',
            content: '您还没有任何同组的孩子'
          });
          navigate('/');
        }
      } catch (error: any) {
        Toast.show({
          icon: 'fail',
          content: error.response?.data?.message || '获取孩子列表失败'
        });
        navigate('/');
      }
    };

    fetchChildren();
  }, [userType, navigate, form]);

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      await api.post('/api/rewards', {
        title: values.title,
        points: values.points,
        childId: values.childId[0],
        reusable: values.reusable[0] === 1
      });
      Toast.show({
        icon: 'success',
        content: '奖励创建成功！'
      });
      navigate('/');
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '创建奖励失败'
      });
    } finally {
      setLoading(false);
    }
  };

  const childOptions = children.map(child => ({
    label: child.username,
    value: child.id,
    description: `${child.username} (当前积分: ${child.points})`
  }));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavBar onBack={() => navigate('/')}>设置新奖励</NavBar>
      
      <div className="flex-1 p-4">
        <AutoCenter className="my-8">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
            <GiftOutline fontSize={32} className="text-white" />
          </div>
        </AutoCenter>

        <Form
          form={form}
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
                创建奖励
              </Button>
              <Button
                block
                fill='none'
                size='large'
                onClick={() => navigate('/')}
              >
                取消
              </Button>
            </Space>
          }
        >
          <Form.Item
            name='childId'
            label={
              <div className="flex items-center gap-2">
                <UserOutline /> 选择孩子
              </div>
            }
            rules={[{ required: true, message: '请选择一个孩子' }]}
          >
            <Selector
              options={childOptions}
              columns={1}
              multiple={false}
            />
          </Form.Item>

          <Form.Item
            name='title'
            label={
              <div className="flex items-center gap-2">
                <GiftOutline /> 奖励名称
              </div>
            }
            rules={[{ required: true, message: '请输入奖励名称' }]}
          >
            <Input
              placeholder='请输入奖励名称'
              clearable
            />
          </Form.Item>

          <Form.Item
            name='points'
            label={
              <div className="flex items-center gap-2">
                <StarOutline /> 所需积分
              </div>
            }
            rules={[{ required: true, message: '请设置所需积分' }]}
            initialValue={1}
          >
            <Stepper
              min={1}
              max={100}
            />
          </Form.Item>

          <Form.Item
            name='reusable'
            label={
              <div className="flex items-center gap-2">
                <GiftOutline /> 可重复兑换
              </div>
            }
            initialValue={[0]}
          >
            <Selector
              options={[
                {
                  label: '一次性奖励',
                  value: 0,
                  description: '只能兑换一次'
                },
                {
                  label: '可重复兑换',
                  value: 1,
                  description: '可以多次兑换'
                }
              ]}
              columns={1}
              multiple={false}
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default RewardPage; 