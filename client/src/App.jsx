import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { DashboardLayout } from './layouts/DashboardLayout.jsx';

import { AuthPage } from './pages/AuthPage.jsx';
import { CompleteProfilePage } from './pages/CompleteProfilePage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { AvailableCropsPage } from './pages/AvailableCropsPage.jsx';
import { BuyingRequirementsPage } from './pages/BuyingRequirementsPage.jsx';
import { OffersAndOrdersPage } from './pages/OffersAndOrdersPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Profile Completion Onboarding Route */}
          <Route path="/complete-profile" element={<CompleteProfilePage />} />

          {/* Protected Buyer Routes inside DashboardLayout */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/crops" element={<AvailableCropsPage />} />
            <Route path="/requirements" element={<BuyingRequirementsPage />} />
            <Route path="/orders" element={<OffersAndOrdersPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
