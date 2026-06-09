import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import OtpPage from './components/OtpPage';
import AdminDashboard from './components/AdminDashboard';
import OperatorDashboard from './components/OperatorDashboard';
import CounselorDashboard from './components/CounselorDashboard';
import CaseDetailWorkspace from './components/CaseDetailWorkspace';
import { Navigate } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-unLightBg text-slate-800 font-sans antialiased">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-otp" element={<OtpPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/operator/dashboard" element={<OperatorDashboard />} />
          <Route path="/counselor/dashboard" element={<CounselorDashboard />} />
          <Route path="/counselor/cases/:id" element={<CaseDetailWorkspace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;