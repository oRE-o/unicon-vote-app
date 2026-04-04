import React from "react";
import { Navigate } from "react-router-dom";
import { getValidTokenPayload } from "../utils/authToken";

interface ProtectedRouteProps {
  children: React.ReactNode; // 보호할 페이지 컴포넌트가 이 children으로 들어옵니다.
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  // 1. localStorage에서 인증 토큰을 가져옵니다.
  const authToken = localStorage.getItem("authToken");

  if (!authToken) {
    return <Navigate to="/login-required" replace />;
  }

  const tokenPayload = getValidTokenPayload(authToken);
  if (!tokenPayload) {
    return <Navigate to="/login-required?reason=expired" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
