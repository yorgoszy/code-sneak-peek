
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import Groups from "@/pages/Groups";
import Exercises from "@/pages/Exercises";
import Programs from "@/pages/Programs";
import ActivePrograms from "@/pages/ActivePrograms";
import ProgramCards from "@/pages/ProgramCards";
import Tests from "@/pages/Tests";
import Results from "@/pages/Results";
import UserProfile from "@/pages/UserProfile";
import ProgramBuilder from "@/pages/ProgramBuilder";
import NotFound from "@/pages/NotFound";
import Subscriptions from "@/pages/Subscriptions";
import Analytics from "@/pages/Analytics";
import ArticlesWithSidebar from "@/pages/Dashboard/ArticlesWithSidebar";
import ResultsWithSidebar from "@/pages/Dashboard/ResultsWithSidebar";
import TestResultsWithSidebar from "@/pages/Dashboard/TestResultsWithSidebar";
import ProgressTrackingWithSidebar from "@/pages/Dashboard/ProgressTrackingWithSidebar";
import Shop from "@/pages/Shop";
import AdminShopWithSidebar from "@/pages/Dashboard/AdminShopWithSidebar";
import OnlineCoaching from "@/pages/OnlineCoaching";
import MeetingRoom from "@/pages/MeetingRoom";
import ShopWithSidebar from "@/pages/Dashboard/ShopWithSidebar";
import OnlineCoachingWithSidebar from "@/pages/OnlineCoachingWithSidebar";
import OnlineBookingWithSidebar from "@/pages/Dashboard/OnlineBookingWithSidebar";
import BookingSectionsWithSidebar from "@/pages/Dashboard/BookingSectionsWithSidebar";
import { SchoolNotesWithSidebar } from "@/pages/Dashboard/SchoolNotesWithSidebar";
import StretchesManagementWithSidebar from "@/pages/Dashboard/StretchesManagementWithSidebar";
import { OneRMManagementWithSidebar } from "@/pages/Dashboard/OneRMManagementWithSidebar";
import PaymentSuccess from "@/pages/PaymentSuccess";
import Offers from "@/pages/Offers";
import ProfileEdit from "@/pages/ProfileEdit";

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <AnalyticsProvider>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen bg-gray-50">
            <Toaster />
            <Suspense fallback={<CustomLoadingScreen />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/online-coaching" element={<OnlineCoaching />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                
                {/* Admin-only routes */}
                <Route path="/dashboard" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/users" element={<ProtectedRoute requireAdmin><Users /></ProtectedRoute>} />
                <Route path="/dashboard/groups" element={<ProtectedRoute requireAdmin><Groups /></ProtectedRoute>} />
                <Route path="/dashboard/subscriptions" element={<ProtectedRoute requireAdmin><Subscriptions /></ProtectedRoute>} />
                <Route path="/dashboard/exercises" element={<ProtectedRoute requireAdmin><Exercises /></ProtectedRoute>} />
                <Route path="/dashboard/programs" element={<ProtectedRoute requireAdmin><Programs /></ProtectedRoute>} />
                <Route path="/dashboard/active-programs" element={<ProtectedRoute requireAdmin><ActivePrograms /></ProtectedRoute>} />
                <Route path="/dashboard/program-cards" element={<ProtectedRoute requireAdmin><ProgramCards /></ProtectedRoute>} />
                <Route path="/dashboard/tests" element={<ProtectedRoute requireAdmin><Tests /></ProtectedRoute>} />
                <Route path="/dashboard/test-results" element={<ProtectedRoute requireAdmin><TestResultsWithSidebar /></ProtectedRoute>} />
                <Route path="/dashboard/progress" element={<ProtectedRoute requireAdmin><ProgressTrackingWithSidebar /></ProtectedRoute>} />
                <Route path="/dashboard/analytics" element={<ProtectedRoute requireAdmin><Analytics /></ProtectedRoute>} />
                <Route path="/dashboard/articles" element={<ProtectedRoute requireAdmin><ArticlesWithSidebar /></ProtectedRoute>} />
                <Route path="/dashboard/results" element={<ProtectedRoute requireAdmin><ResultsWithSidebar /></ProtectedRoute>} />
                <Route path="/dashboard/shop" element={<ProtectedRoute requireAdmin><AdminShopWithSidebar /></ProtectedRoute>} />
                <Route path="/dashboard/offers" element={<ProtectedRoute requireAdmin><Offers /></ProtectedRoute>} />
                <Route path="/dashboard/online-coaching" element={<ProtectedRoute requireAdmin><OnlineCoachingWithSidebar /></ProtectedRoute>} />
                <Route path="/dashboard/online-booking" element={<ProtectedRoute requireAdmin><OnlineBookingWithSidebar /></ProtectedRoute>} />
                <Route path="/dashboard/booking-sections" element={<ProtectedRoute requireAdmin><BookingSectionsWithSidebar /></ProtectedRoute>} />
                <Route path="/dashboard/school-notes" element={<ProtectedRoute requireAdmin><SchoolNotesWithSidebar /></ProtectedRoute>} />
                <Route path="/dashboard/stretches" element={<ProtectedRoute requireAdmin><StretchesManagementWithSidebar /></ProtectedRoute>} />
                <Route path="/dashboard/one-rm" element={<ProtectedRoute requireAdmin><OneRMManagementWithSidebar /></ProtectedRoute>} />
                <Route path="/program-builder" element={<ProtectedRoute requireAdmin><ProgramBuilder /></ProtectedRoute>} />
                
                {/* Protected user routes */}
                <Route path="/meeting/:roomId" element={<ProtectedRoute><MeetingRoom /></ProtectedRoute>} />
                <Route path="/user/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/dashboard/user-profile/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/dashboard/user-profile/:userId/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
                <Route path="/dashboard/user-profile/:userId/shop" element={<ProtectedRoute><ShopWithSidebar /></ProtectedRoute>} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </QueryClientProvider>
      </AnalyticsProvider>
    </Router>
  );
}

export default App;
