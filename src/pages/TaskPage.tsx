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
  CheckCircleOutline,
  UserOutline,
  StarOutline
} from 'antd-mobile-icons';

interface Child {
  id: number;
  username: string;
}

interface FormValues {
  childId: number[];
  title: string;
  points: number;
}

const TaskPage: React.FC = () => {
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
        content: '只有家长可以创建任务'
      });
      navigate('/');
      return;
    }

    // 获取所有子用户
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
          content: error.response?.data?.message || '获取子用户列表失败'
        });
        navigate('/');
      }
    };

    fetchChildren();
  }, [userType, navigate, form]);

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      await api.post('/api/tasks', {
        title: values.title,
        points: values.points,
        childId: values.childId[0]
      });
      Toast.show({
        icon: 'success',
        content: '任务创建成功！'
      });
      navigate('/');
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '创建任务失败'
      });
    } finally {
      setLoading(false);
    }
  };

  const childOptions = children.map(child => ({
    label: child.username,
    value: child.id,
    description: `为${child.username}布置任务`
  }));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavBar onBack={() => navigate('/')}>布置新任务</NavBar>
      
      <div className="flex-1 p-4">
        <AutoCenter className="my-8">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
            <CheckCircleOutline fontSize={32} className="text-white" />
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
                创建任务
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
                <CheckCircleOutline /> 任务名称
              </div>
            }
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input
              placeholder='请输入任务名称'
              clearable
            />
          </Form.Item>

          <Form.Item
            name='points'
            label={
              <div className="flex items-center gap-2">
                <StarOutline /> 完成可得积分
              </div>
            }
            rules={[{ required: true, message: '请设置任务积分' }]}
            initialValue={1}
          >
            <Stepper
              min={1}
              max={100}
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default TaskPage; 