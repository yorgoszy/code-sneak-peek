
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Index from '@/pages/Index';
import Users from '@/pages/Users';
import Groups from '@/pages/Groups';
import Exercises from '@/pages/Exercises';
import Tests from '@/pages/Tests';
import Results from '@/pages/Results';
import Programs from '@/pages/Programs';
import ProgramBuilder from '@/pages/ProgramBuilder';
import ActivePrograms from '@/pages/ActivePrograms';
import UserProfile from '@/pages/UserProfile';
import RunMode from '@/pages/RunMode';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/auth" />} />
      <Route path="/dashboard/users" element={session ? <Users /> : <Navigate to="/auth" />} />
      <Route path="/dashboard/users/:userId" element={session ? <UserProfile /> : <Navigate to="/auth" />} />
      <Route path="/dashboard/groups" element={session ? <Groups /> : <Navigate to="/auth" />} />
      <Route path="/dashboard/exercises" element={session ? <Exercises /> : <Navigate to="/auth" />} />
      <Route path="/dashboard/tests" element={session ? <Tests /> : <Navigate to="/auth" />} />
      <Route path="/dashboard/results" element={session ? <Results /> : <Navigate to="/auth" />} />
      <Route path="/dashboard/programs" element={session ? <Programs /> : <Navigate to="/auth" />} />
      <Route path="/dashboard/programs/builder" element={session ? <ProgramBuilder /> : <Navigate to="/auth" />} />
      <Route path="/dashboard/active-programs" element={session ? <ActivePrograms /> : <Navigate to="/auth" />} />
      <Route path="/dashboard/run-mode" element={session ? <RunMode /> : <Navigate to="/auth" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes />
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
