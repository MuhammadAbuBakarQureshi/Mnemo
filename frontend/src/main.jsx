import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import { ToastProvider } from "./components/Toast/Toast";
import AppPage from "./app/AppPage";
import LoginPage from "./app/auth/login/LoginPage";
import SignupPage from "./app/auth/register/SignupPage";  

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ToastProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Navigate to="/new" replace />} />
              <Route path="/new" element={<AppPage />} />
              <Route path="/projects/:projectId" element={<AppPage />} />
              <Route path="/projects/:projectId/chat/:chatId" element={<AppPage />} />
              <Route path="/login"  element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="*"       element={<Navigate to="/new" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
    </StrictMode>
  // <StrictMode>
  //   <AuthProvider>
  //     <ToastProvider>
  //       <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  //         <Routes>
  //           <Route path="/" element={<ProtectedRoute><AppPage /></ProtectedRoute>} />
  //           <Route path="/login"  element={<LoginPage />} />
  //           <Route path="/signup" element={<SignupPage />} />
  //           <Route path="*"       element={<Navigate to="/" replace />} />
  //         </Routes>
  //       </BrowserRouter>
  //     </ToastProvider>
  //   </AuthProvider>
  // </StrictMode>
);