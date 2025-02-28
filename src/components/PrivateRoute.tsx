import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute: React.FC<{ element: ReactNode }> = ({ element }) => {
  const token = localStorage.getItem('token'); // 获取JWT令牌

  return token ? <>{element}</> : <Navigate to="/login" />;
};

export default PrivateRoute; 