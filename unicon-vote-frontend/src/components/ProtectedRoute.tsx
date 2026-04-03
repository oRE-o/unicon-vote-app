import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode; // 보호할 페이지 컴포넌트가 이 children으로 들어옵니다.
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  // 1. localStorage에서 인증 토큰을 가져옵니다.
  const authToken = localStorage.getItem("authToken");

  // 2. 토큰이 없다면(로그인하지 않았다면), '/login-required' 경로로 리디렉션합니다.
  if (!authToken) {
    return <Navigate to="/login-required" replace />;
  }

  // 3. 토큰이 있다면(로그인했다면), 보호하려던 페이지(children)를 그대로 보여줍니다.
  return <>{children}</>;
}

export default ProtectedRoute;
