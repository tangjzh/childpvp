import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  Form,
  Input,
  Button,
  Toast,
  NavBar,
  Space,
  List,
  SwipeAction,
  Dialog,
  Card,
  Checkbox,
  AutoCenter
} from 'antd-mobile';
import {
  TeamOutline,
  AddOutline,
  DeleteOutline,
  UserAddOutline,
  SearchOutline
} from 'antd-mobile-icons';

interface Group {
  id: number;
  name: string;
  description: string;
  parent_count: number;
  child_count: number;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  userType: 'parent' | 'child';
  joined_at?: string;
  groups?: string[];
}

interface GroupFormValues {
  name: string;
  description: string;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'parent' | 'child'>('all');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupForm] = Form.useForm<GroupFormValues>();
  const [showMemberManagement, setShowMemberManagement] = useState(false);

  // 获取所有用户组
  const fetchGroups = async () => {
    try {
      const response = await api.get('/api/groups');
      setGroups(response.data);
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '获取用户组失败'
      });
    }
  };

  // 获取组成员
  const fetchGroupMembers = async (groupId: number) => {
    try {
      const response = await api.get(`/api/groups/${groupId}/members`);
      setGroupMembers(response.data);
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '获取组成员失败'
      });
    }
  };

  // 获取可用用户
  const fetchAvailableUsers = async () => {
    try {
      const [usersResponse, groupsResponse] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/groups')
      ]);

      const users = usersResponse.data;
      const groups = groupsResponse.data;

      const usersWithGroups = await Promise.all(
        users.map(async (user: User) => {
          const userGroups = await Promise.all(
            groups.map(async (group: Group) => {
              try {
                const response = await api.get(`/api/groups/${group.id}/members`);
                const members = response.data;
                return members.some((member: User) => member.id === user.id) ? group.name : null;
              } catch (error) {
                return null;
              }
            })
          );
          return {
            ...user,
            groups: userGroups.filter(Boolean)
          };
        })
      );

      setAvailableUsers(usersWithGroups);
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '获取用户列表失败'
      });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchGroups();
    fetchAvailableUsers();
  }, [navigate]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers(selectedGroup);
    }
  }, [selectedGroup]);

  // 创建新用户组
  const onCreateGroup = async (values: GroupFormValues) => {
    try {
      await api.post('/api/groups', values);
      Toast.show({
        icon: 'success',
        content: '用户组创建成功'
      });
      setShowCreateForm(false);
      groupForm.resetFields();
      fetchGroups();
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '创建用户组失败'
      });
    }
  };

  // 删除用户组
  const handleDeleteGroup = async (groupId: number) => {
    const result = await Dialog.confirm({
      content: '确定要删除这个用户组吗？',
    });
    
    if (result) {
      try {
        await api.delete(`/api/groups/${groupId}`);
        Toast.show({
          icon: 'success',
          content: '用户组删除成功'
        });
        setSelectedGroup(null);
        fetchGroups();
      } catch (error: any) {
        Toast.show({
          icon: 'fail',
          content: error.response?.data?.message || '删除用户组失败'
        });
      }
    }
  };

  const filterUsers = (users: User[]): User[] => {
    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = userTypeFilter === 'all' || user.userType === userTypeFilter;
      return matchesSearch && matchesType;
    });
  };

  // 添加用户到组
  const handleAddUserToGroup = async (userId: number) => {
    if (!selectedGroup) return;
    try {
      await api.post(`/api/groups/${selectedGroup}/members`, { userId });
      Toast.show({
        icon: 'success',
        content: '成功添加用户到组'
      });
      fetchGroupMembers(selectedGroup);
      fetchAvailableUsers();
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.response?.data?.message || '添加用户到组失败'
      });
    }
  };

  // 从组中移除用户
  const handleRemoveUserFromGroup = async (userId: number) => {
    if (!selectedGroup) return;
    const result = await Dialog.confirm({
      content: '确定要从组中移除该用户吗？'
    });
    
    if (result) {
      try {
        await api.delete(`/api/groups/${selectedGroup}/members/${userId}`);
        Toast.show({
          icon: 'success',
          content: '成功从组中移除用户'
        });
        fetchGroupMembers(selectedGroup);
        fetchAvailableUsers();
        setSelectedUsers(selectedUsers.filter(id => id !== userId));
      } catch (error: any) {
        Toast.show({
          icon: 'fail',
          content: error.response?.data?.message || '从组中移除用户失败'
        });
      }
    }
  };

  // 批量添加用户到组
  const handleBatchAddUsers = async () => {
    if (!selectedGroup || selectedUsers.length === 0) return;
    const result = await Dialog.confirm({
      content: `确定要添加选中的 ${selectedUsers.length} 个用户到组吗？`
    });
    
    if (result) {
      try {
        await Promise.all(
          selectedUsers.map(userId =>
            api.post(`/api/groups/${selectedGroup}/members`, { userId })
          )
        );
        Toast.show({
          icon: 'success',
          content: '成功添加选中用户到组'
        });
        fetchGroupMembers(selectedGroup);
        fetchAvailableUsers();
        setSelectedUsers([]);
      } catch (error: any) {
        Toast.show({
          icon: 'fail',
          content: error.response?.data?.message || '批量添加用户失败'
        });
      }
    }
  };

  // 批量从组中移除用户
  const handleBatchRemoveUsers = async () => {
    if (!selectedGroup || selectedUsers.length === 0) return;
    const result = await Dialog.confirm({
      content: `确定要从组中移除选中的 ${selectedUsers.length} 个用户吗？`
    });
    
    if (result) {
      try {
        await Promise.all(
          selectedUsers.map(userId =>
            api.delete(`/api/groups/${selectedGroup}/members/${userId}`)
          )
        );
        Toast.show({
          icon: 'success',
          content: '成功从组中移除选中用户'
        });
        fetchGroupMembers(selectedGroup);
        fetchAvailableUsers();
        setSelectedUsers([]);
      } catch (error: any) {
        Toast.show({
          icon: 'fail',
          content: error.response?.data?.message || '批量移除用户失败'
        });
      }
    }
  };

  const handleGroupSelect = (groupId: number) => {
    setSelectedGroup(groupId);
    setShowMemberManagement(true);
    fetchGroupMembers(groupId);
  };

  const handleBack = () => {
    if (showMemberManagement) {
      setShowMemberManagement(false);
      setSelectedGroup(null);
      setSelectedUsers([]);
    } else {
      navigate('/');
    }
  };

  const selectedGroupName = selectedGroup ? groups.find(g => g.id === selectedGroup)?.name : '';

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <NavBar 
        onBack={handleBack}
        className="border-b border-gray-200 bg-white sticky top-0 z-10"
      >
        {showMemberManagement ? `${selectedGroupName} - 成员管理` : '用户组管理'}
      </NavBar>

      <div className="flex-1 container mx-auto px-4 py-2 max-w-2xl">
        {!showMemberManagement ? (
          <>
            <div className="flex items-center justify-between mb-4 sticky top-12 z-10 bg-gray-100 py-2">
              <div className="flex items-center gap-2">
                <TeamOutline className="text-primary" />
                <span className="text-lg font-medium">用户组列表</span>
              </div>
              <Button
                color='primary'
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1"
              >
                <AddOutline />
                创建新用户组
              </Button>
            </div>

            {groups.length === 0 ? (
              <Card>
                <AutoCenter className="py-12 text-gray-500">
                  暂无用户组，点击上方按钮创建
                </AutoCenter>
              </Card>
            ) : (
              <List className="rounded-lg overflow-hidden">
                {groups.map(group => (
                  <SwipeAction
                    key={group.id}
                    rightActions={[
                      {
                        key: 'delete',
                        text: '删除',
                        color: 'danger',
                        onClick: () => handleDeleteGroup(group.id)
                      }
                    ]}
                  >
                    <List.Item
                      onClick={() => handleGroupSelect(group.id)}
                      arrow
                      className="bg-white"
                      description={
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-600">{group.description}</span>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-blue-500">家长: {group.parent_count}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-green-500">孩子: {group.child_count}</span>
                          </div>
                        </div>
                      }
                    >
                      <div className="font-medium">{group.name}</div>
                    </List.Item>
                  </SwipeAction>
                ))}
              </List>
            )}
          </>
        ) : (
          <>
            <div className="sticky top-12 z-10 bg-gray-100 pt-2 pb-4">
              <Card>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 bg-white rounded-lg border p-2">
                      <Input
                        placeholder='搜索用户名...'
                        value={searchTerm}
                        onChange={setSearchTerm}
                        clearable
                        className="border-none p-0"
                      />
                    </div>
                  </div>
                  <Space>
                    <Button
                      color={userTypeFilter === 'all' ? 'primary' : 'default'}
                      fill={userTypeFilter === 'all' ? 'solid' : 'outline'}
                      onClick={() => setUserTypeFilter('all')}
                      size='small'
                    >
                      全部
                    </Button>
                    <Button
                      color={userTypeFilter === 'parent' ? 'primary' : 'default'}
                      fill={userTypeFilter === 'parent' ? 'solid' : 'outline'}
                      onClick={() => setUserTypeFilter('parent')}
                      size='small'
                    >
                      家长
                    </Button>
                    <Button
                      color={userTypeFilter === 'child' ? 'primary' : 'default'}
                      fill={userTypeFilter === 'child' ? 'solid' : 'outline'}
                      onClick={() => setUserTypeFilter('child')}
                      size='small'
                    >
                      孩子
                    </Button>
                  </Space>
                </div>

                {selectedUsers.length > 0 && (
                  <div className="flex items-center justify-between mt-4 p-2 bg-blue-50 rounded-lg">
                    <span className="text-blue-600">已选择 {selectedUsers.length} 个用户</span>
                    <Space>
                      <Button
                        color='primary'
                        size='small'
                        onClick={handleBatchAddUsers}
                      >
                        批量添加
                      </Button>
                      <Button
                        color='danger'
                        size='small'
                        onClick={handleBatchRemoveUsers}
                      >
                        批量移除
                      </Button>
                    </Space>
                  </div>
                )}
              </Card>
            </div>

            <div className="space-y-4 mt-4">
              <Card 
                title={
                  <div className="flex items-center gap-2">
                    <TeamOutline className="text-primary" />
                    <span>当前成员</span>
                  </div>
                }
              >
                {groupMembers.length === 0 ? (
                  <AutoCenter className="py-12 text-gray-500">
                    暂无成员
                  </AutoCenter>
                ) : (
                  <List className="rounded-lg overflow-hidden">
                    {filterUsers(groupMembers).map(member => (
                      <SwipeAction
                        key={member.id}
                        rightActions={[
                          {
                            key: 'remove',
                            text: '移除',
                            color: 'danger',
                            onClick: () => handleRemoveUserFromGroup(member.id)
                          }
                        ]}
                      >
                        <List.Item
                          prefix={
                            <Checkbox
                              checked={selectedUsers.includes(member.id)}
                              onChange={(checked) => {
                                if (checked) {
                                  setSelectedUsers([...selectedUsers, member.id]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== member.id));
                                }
                              }}
                            />
                          }
                          className="bg-white"
                          description={
                            <div className="flex flex-col gap-1">
                              <span className={`text-sm ${member.userType === 'parent' ? 'text-blue-500' : 'text-green-500'}`}>
                                {member.userType === 'parent' ? '家长' : '孩子'}
                              </span>
                              {member.groups && member.groups.length > 0 && (
                                <span className="text-gray-500 text-sm">
                                  所属组: {member.groups.join(', ')}
                                </span>
                              )}
                            </div>
                          }
                        >
                          <div className="font-medium">{member.username}</div>
                        </List.Item>
                      </SwipeAction>
                    ))}
                  </List>
                )}
              </Card>

              <Card 
                title={
                  <div className="flex items-center gap-2">
                    <UserAddOutline className="text-primary" />
                    <span>可添加的用户</span>
                  </div>
                }
              >
                {filterUsers(availableUsers.filter(user => 
                  !groupMembers.some(member => member.id === user.id)
                )).length === 0 ? (
                  <AutoCenter className="py-12 text-gray-500">
                    没有可添加的用户
                  </AutoCenter>
                ) : (
                  <List className="rounded-lg overflow-hidden">
                    {filterUsers(availableUsers.filter(user => 
                      !groupMembers.some(member => member.id === user.id)
                    )).map(user => (
                      <SwipeAction
                        key={user.id}
                        rightActions={[
                          {
                            key: 'add',
                            text: '添加',
                            color: 'primary',
                            onClick: () => handleAddUserToGroup(user.id)
                          }
                        ]}
                      >
                        <List.Item
                          prefix={
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onChange={(checked) => {
                                if (checked) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                }
                              }}
                            />
                          }
                          className="bg-white"
                          description={
                            <div className="flex flex-col gap-1">
                              <span className={`text-sm ${user.userType === 'parent' ? 'text-blue-500' : 'text-green-500'}`}>
                                {user.userType === 'parent' ? '家长' : '孩子'}
                              </span>
                              {user.groups && user.groups.length > 0 && (
                                <span className="text-gray-500 text-sm">
                                  所属组: {user.groups.join(', ')}
                                </span>
                              )}
                            </div>
                          }
                        >
                          <div className="font-medium">{user.username}</div>
                        </List.Item>
                      </SwipeAction>
                    ))}
                  </List>
                )}
              </Card>
            </div>
          </>
        )}
      </div>

      <Dialog
        visible={showCreateForm}
        title={
          <div className="flex items-center gap-2">
            <AddOutline className="text-primary" />
            <span className="font-medium">创建新用户组</span>
          </div>
        }
        content={
          <Form
            form={groupForm}
            layout='vertical'
            onFinish={onCreateGroup}
            // footer={
            //   <Button block type='submit' color='primary'>
            //     创建
            //   </Button>
            // }
          >
            <Form.Item
              name='name'
              label='组名称'
              rules={[{ required: true, message: '请输入组名称' }]}
            >
              <Input placeholder='请输入组名称' />
            </Form.Item>
            <Form.Item
              name='description'
              label='组描述'
              rules={[{ required: true, message: '请输入组描述' }]}
            >
              <Input placeholder='请输入组描述' />
            </Form.Item>
          </Form>
        }
        closeOnAction
        onClose={() => setShowCreateForm(false)}
        actions={[
          {
            key: 'cancel',
            text: '取消',
          },
          {
            key: 'confirm',
            text: '确认',
            bold: true,
            onClick: () => groupForm.submit(),
          },
        ]}
      />
    </div>
  );
};

export default AdminPage; 