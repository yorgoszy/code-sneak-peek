
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Authentication logic will be added when Supabase is connected
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900">
            <Heart className="h-8 w-8 text-pink-500" />
            <span>HyperKids</span>
          </Link>
          <p className="text-gray-600 mt-2">Καλώς ήρθατε πίσω!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Είσοδος στο λογαριασμό σας</CardTitle>
            <CardDescription className="text-center">
              Συνδεθείτε για να συνεχίσετε
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Σύνδεση</TabsTrigger>
                <TabsTrigger value="signup">Εγγραφή</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Κωδικός</Label>
                    <Input id="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full rounded-none" disabled={isLoading}>
                    {isLoading ? "Σύνδεση..." : "Σύνδεση"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Πλήρες Όνομα</Label>
                    <Input id="name" type="text" placeholder="Το όνομά σας" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="your@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Κωδικός</Label>
                    <Input id="signup-password" type="password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invitation-code">Κωδικός Πρόσκλησης</Label>
                    <Input id="invitation-code" type="text" placeholder="Εισάγετε τον κωδικό" required />
                  </div>
                  <Button type="submit" className="w-full rounded-none" disabled={isLoading}>
                    {isLoading ? "Εγγραφή..." : "Εγγραφή"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-blue-600 hover:underline">
                ← Επιστροφή στην αρχική
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
