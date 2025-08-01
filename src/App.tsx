
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";

import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import Groups from "@/pages/Groups";
import Exercises from "@/pages/Exercises";
import Programs from "@/pages/Programs";
import ActiveProgramsWithSidebar from "@/pages/ActiveProgramsWithSidebar";
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
import Shop from "@/pages/Shop";
import AdminShopWithSidebar from "@/pages/Dashboard/AdminShopWithSidebar";
import OnlineCoaching from "@/pages/OnlineCoaching";
import MeetingRoom from "@/pages/MeetingRoom";
import ShopWithSidebar from "@/pages/Dashboard/ShopWithSidebar";
import OnlineCoachingWithSidebar from "@/pages/OnlineCoachingWithSidebar";
import OnlineBookingWithSidebar from "@/pages/Dashboard/OnlineBookingWithSidebar";
import BookingSectionsWithSidebar from "@/pages/Dashboard/BookingSectionsWithSidebar";
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
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/users" element={<Users />} />
                <Route path="/dashboard/groups" element={<Groups />} />
                <Route path="/dashboard/subscriptions" element={<Subscriptions />} />
                <Route path="/dashboard/exercises" element={<Exercises />} />
                <Route path="/dashboard/programs" element={<Programs />} />
                <Route path="/dashboard/active-programs" element={<ActiveProgramsWithSidebar />} />
                <Route path="/dashboard/program-cards" element={<ProgramCards />} />
                <Route path="/dashboard/tests" element={<Tests />} />
                <Route path="/dashboard/analytics" element={<Analytics />} />
                <Route path="/dashboard/articles" element={<ArticlesWithSidebar />} />
                <Route path="/dashboard/results" element={<ResultsWithSidebar />} />
                <Route path="/dashboard/shop" element={<AdminShopWithSidebar />} />
                <Route path="/dashboard/offers" element={<Offers />} />
                <Route path="/dashboard/online-coaching" element={<OnlineCoachingWithSidebar />} />
                <Route path="/dashboard/online-booking" element={<OnlineBookingWithSidebar />} />
                <Route path="/dashboard/booking-sections" element={<BookingSectionsWithSidebar />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/online-coaching" element={<OnlineCoaching />} />
                <Route path="/meeting/:roomId" element={<MeetingRoom />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/user/:userId" element={<UserProfile />} />
                <Route path="/dashboard/user-profile/:userId" element={<UserProfile />} />
                <Route path="/dashboard/user-profile/:userId/edit" element={<ProfileEdit />} />
                <Route path="/dashboard/user-profile/:userId/shop" element={<ShopWithSidebar />} />
                <Route path="/program-builder" element={<ProgramBuilder />} />
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
