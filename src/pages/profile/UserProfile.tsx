import { useState, useEffect } from "react";
import { useAuth, UserProfile } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { UserRole } from "@/types/supabase";
import { useNavigate } from "react-router-dom";

const UserProfilePage = () => {
  const { user, updateProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: "",
    phone: "",
    role: "buyer" as UserRole,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        role: user.role || "buyer",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: UserRole) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Validate role
      if (!formData.role) {
        toast({
          title: "Error",
          description: "Please select a role",
          variant: "destructive",
        });
        return;
      }
      
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
      });
      
      toast({
        title: "Success",
        description: "Your profile has been updated successfully",
      });
      
      // Redirect based on new role
      if (formData.role === 'seller') {
        navigate('/seller');
      } else if (formData.role === 'buyer') {
        navigate('/dashboard');
      } else if (formData.role === 'admin') {
        navigate('/admin');
      } else if (formData.role === 'logistics') {
        navigate('/logistics');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-4 border-primary border-r-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Not Logged In</h1>
        <p className="mb-4">You need to be logged in to view your profile.</p>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                placeholder="Your phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Account Type</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => handleRoleChange(value as UserRole)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50">
                  <RadioGroupItem value="buyer" id="buyer" />
                  <Label htmlFor="buyer" className="cursor-pointer flex-1">
                    <div className="font-medium">Buyer</div>
                    <div className="text-sm text-muted-foreground">Shop for products</div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50">
                  <RadioGroupItem value="seller" id="seller" />
                  <Label htmlFor="seller" className="cursor-pointer flex-1">
                    <div className="font-medium">Seller</div>
                    <div className="text-sm text-muted-foreground">Sell your products</div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50">
                  <RadioGroupItem value="logistics" id="logistics" />
                  <Label htmlFor="logistics" className="cursor-pointer flex-1">
                    <div className="font-medium">Logistics</div>
                    <div className="text-sm text-muted-foreground">Deliver products</div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin" className="cursor-pointer flex-1">
                    <div className="font-medium">Admin</div>
                    <div className="text-sm text-muted-foreground">Manage the platform</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Updating...</span>
                    <div className="h-4 w-4 border-2 border-background border-r-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="destructive" onClick={() => navigate("/")}>
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UserProfilePage;
