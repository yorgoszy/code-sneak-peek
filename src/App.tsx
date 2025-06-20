import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient } from "react-query";

import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
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

function App() {
  return (
    <Router>
      <QueryClient>
        <div className="min-h-screen bg-gray-50">
          <Toaster />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/users" element={<Users />} />
            <Route path="/dashboard/groups" element={<Groups />} />
            <Route path="/dashboard/subscriptions" element={<Subscriptions />} />
            <Route path="/dashboard/exercises" element={<Exercises />} />
            <Route path="/dashboard/programs" element={<Programs />} />
            <Route path="/dashboard/active-programs" element={<ActivePrograms />} />
            <Route path="/dashboard/program-cards" element={<ProgramCards />} />
            <Route path="/dashboard/tests" element={<Tests />} />
            <Route path="/dashboard/results" element={<Results />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/program-builder" element={<ProgramBuilder />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </QueryClient>
    </Router>
  );
}

export default App;
