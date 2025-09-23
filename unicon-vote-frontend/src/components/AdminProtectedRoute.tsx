import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // jwt-decode 임포트

interface DecodedToken {
  uuid: string;
  name: string;
  role: "user" | "admin";
  // iat, exp 등 다른 속성도 포함될 수 있음
}

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return <Navigate to="/admin-required" replace />;
  }

  try {
    const decodedToken: DecodedToken = jwtDecode(token);
    // 토큰에서 role을 확인하여 관리자가 아니면 접근 불가 페이지로 보냄
    console.log("Decoded Token:", decodedToken); // 디버그용 로그
    if (decodedToken.role !== "admin") {
      return <Navigate to="/admin-required" replace />;
    }
    // 관리자면 페이지를 보여줌
    return <>{children}</>;
  } catch (error) {
    // 유효하지 않은 토큰일 경우
    return <Navigate to="/admin-required" replace />;
  }
}

export default AdminProtectedRoute;
