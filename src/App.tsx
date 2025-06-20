
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import UserProfile from "./pages/UserProfile";
import Programs from "./pages/Programs";
import ProgramBuilder from "./pages/ProgramBuilder";
import ProgramCards from "./pages/ProgramCards";
import Exercises from "./pages/Exercises";
import Tests from "./pages/Tests";
import Results from "./pages/Results";
import Groups from "./pages/Groups";
import ActivePrograms from "./pages/ActivePrograms";
import Subscriptions from "./pages/Subscriptions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/users" element={<Users />} />
          <Route path="/dashboard/user-profile/:userId" element={<UserProfile />} />
          <Route path="/dashboard/programs" element={<Programs />} />
          <Route path="/dashboard/program-builder" element={<ProgramBuilder />} />
          <Route path="/dashboard/program-cards" element={<ProgramCards />} />
          <Route path="/dashboard/exercises" element={<Exercises />} />
          <Route path="/dashboard/tests" element={<Tests />} />
          <Route path="/dashboard/results" element={<Results />} />
          <Route path="/dashboard/groups" element={<Groups />} />
          <Route path="/dashboard/active-programs" element={<ActivePrograms />} />
          <Route path="/dashboard/subscriptions" element={<Subscriptions />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
