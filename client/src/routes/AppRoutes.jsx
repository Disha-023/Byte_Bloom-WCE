import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import CitizenDashboard from '../pages/CitizenDashboard';
import ReportIssue from '../pages/ReportIssue';
import TrackIssue from '../pages/TrackIssue';
import AuthorityDashboard from '../pages/authority/AuthorityDashboard';
import AuthorityComplaints from '../pages/authority/AuthorityComplaints';
import AuthorityComplaintDetails from '../pages/authority/AuthorityComplaintDetails';
import AuthorityAnalytics from '../pages/authority/AuthorityAnalytics';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<CitizenDashboard />} />
        <Route path="/report" element={<ReportIssue />} />
        <Route path="/track" element={<TrackIssue />} />
        <Route path="/authority" element={<AuthorityDashboard />} />
        <Route path="/authority/complaints" element={<AuthorityComplaints />} />
        <Route path="/authority/complaints/:id" element={<AuthorityComplaintDetails />} />
        <Route path="/authority/analytics" element={<AuthorityAnalytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
