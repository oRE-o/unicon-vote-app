import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import "./App.css";

const DefaultPage = lazy(() => import("./pages/DefaultPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const LoginRequiredPage = lazy(() => import("./pages/LoginRequiredPage"));
const MainPage = lazy(() => import("./pages/MainPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminRequiredPage = lazy(() => import("./pages/AdminRequiredPage"));

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-100 px-4">
      <div className="rounded-[1.5rem] border border-base-300 bg-base-200 px-6 py-5 text-center shadow-lg shadow-black/5">
        <div className="loading loading-spinner loading-md text-primary"></div>
        <p className="mt-3 text-sm text-base-content/70">화면을 준비하고 있어요...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
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
          <Route
            path="/admin/bracelets"
            element={
              <AdminProtectedRoute>
                <AdminPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/games"
            element={
              <AdminProtectedRoute>
                <AdminPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/results"
            element={
              <AdminProtectedRoute>
                <AdminPage />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
