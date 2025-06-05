
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Groups from "./pages/Groups";
import Exercises from "./pages/Exercises";
import Tests from "./pages/Tests";
import Results from "./pages/Results";
import Programs from "./pages/Programs";
import ProgramBuilder from "./pages/ProgramBuilder";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/users" 
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/user-profile/:userId" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/groups" 
              element={
                <ProtectedRoute>
                  <Groups />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/exercises" 
              element={
                <ProtectedRoute>
                  <Exercises />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/tests" 
              element={
                <ProtectedRoute>
                  <Tests />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/results" 
              element={
                <ProtectedRoute>
                  <Results />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/programs" 
              element={
                <ProtectedRoute>
                  <Programs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/program-builder" 
              element={
                <ProtectedRoute>
                  <ProgramBuilder />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
