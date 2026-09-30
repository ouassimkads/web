import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router';
import Login from './pages/Login.tsx';
import DashboardLayout from './layouts/DashboardLayout.tsx';
import Archive from './pages/dashboard/Archive.tsx';
import Folders from './pages/dashboard/Folders.tsx';
import Overview from './pages/dashboard/Overview.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { AuthProvider } from './context/AuthContext.tsx'; // <--- 1. استيراد AuthProvider
import HomeRedirect from './components/HomeRedirect.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route path="overview" element={<Overview />} />
                <Route path="folders" element={<Folders />} />
                <Route path="archive" element={<Archive />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
