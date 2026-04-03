import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import LoginRequiredPage from "./pages/LoginRequiredPage";
import MainPage from "./pages/MainPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./pages/AdminPage";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminRequiredPage from "./pages/AdminRequiredPage";

import "./App.css";
import DefaultPage from "./pages/DefaultPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* URL이 /login 이면 LoginPage를 보여줌 */}
        <Route path="/" element={<DefaultPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login-required" element={<LoginRequiredPage />} />
        <Route path="/admin-required" element={<AdminRequiredPage />} />
        <Route
          path="/main"
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminPage />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
