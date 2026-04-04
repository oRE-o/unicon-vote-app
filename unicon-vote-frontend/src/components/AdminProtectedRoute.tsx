import React from "react";
import { Navigate } from "react-router-dom";
import { getValidTokenPayload } from "../utils/authToken";

interface DecodedToken {
  uuid: string;
  name: string;
  role: "user" | "admin";
}

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return <Navigate to="/admin-required" replace />;
  }

  const decodedToken = getValidTokenPayload(token) as DecodedToken | null;
  if (!decodedToken) {
    return <Navigate to="/admin-required?reason=expired" replace />;
  }

  if (decodedToken.role !== "admin") {
    return <Navigate to="/admin-required" replace />;
  }

  return <>{children}</>;
}

export default AdminProtectedRoute;
