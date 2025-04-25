
import { useState } from "react";
import { useAuth, Address, UserProfile } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Home, Edit, Plus, CheckCircle, Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Form schemas
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().optional(),
});

const addressFormSchema = z.object({
  name: z.string().min(2, { message: "Address name is required" }),
  line1: z.string().min(5, { message: "Address line 1 is required" }),
  line2: z.string().optional(),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  postal_code: z.string().min(3, { message: "Postal code is required" }),
  country: z.string().min(2, { message: "Country is required" }),
  is_default: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type AddressFormValues = z.infer<typeof addressFormSchema>;

const Profile = () => {
  const { user, updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth();
  const { toast } = useToast();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
    },
  });

  // Address form
  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      name: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      is_default: false,
    },
  });

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile({
        name: data.name,
        phone: data.phone,
      });

      setIsEditingProfile(false);

      toast({
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  // Handle address submission (add/edit)
  const onAddressSubmit = async (data: AddressFormValues) => {
    try {
      if (editingAddress) {
        // Update existing address
        await updateAddress(editingAddress.id, data);
        setEditingAddress(null);

        toast({
          description: "Address updated successfully",
        });
      } else {
        // Add new address
        await addAddress({
        name: data.name,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        country: data.country,
        is_default: data.is_default
      });
        setIsAddingAddress(false);

        toast({
          description: "Address added successfully",
        });
      }

      // Reset form
      addressForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive",
      });
    }
  };

  // Initialize edit address form
  const handleEditAddress = (address: Address) => {
    addressForm.reset({
      name: address.name,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    });
    setEditingAddress(address);
  };

  // Handle address deletion
  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);

      toast({
        description: "Address deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  // Handle setting default address
  const handleSetDefaultAddress = async (id: string) => {
    try {
      await setDefaultAddress(id);

      toast({
        description: "Default address updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update default address",
        variant: "destructive",
      });
    }
  };

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!user) {
    return null; // User should be redirected to login
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Profile Card */}
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Manage your personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditingProfile ? (
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center p-3 bg-muted/50 rounded-md">
                    <Mail className="h-5 w-5 text-muted-foreground mr-3" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email address</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Your phone number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Used for order notifications and delivery updates
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingProfile(false);
                        profileForm.reset({
                          name: user.name,
                          phone: user.phone || "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xl font-medium">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        {user.name}
                        <Badge className="ml-2 capitalize">{user.role}</Badge>
                      </h3>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.location.href = "/profile/edit"}
                    >
                      Change Account Type
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Addresses Card */}
        <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>My Addresses</CardTitle>
                <CardDescription>
                  Manage your shipping addresses
                </CardDescription>
              </div>
              <Dialog
                open={isAddingAddress}
                onOpenChange={setIsAddingAddress}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[475px]">
                  <DialogHeader>
                    <DialogTitle>Add New Address</DialogTitle>
                    <DialogDescription>
                      Enter your address details below
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...addressForm}>
                    <form
                      onSubmit={addressForm.handleSubmit(onAddressSubmit)}
                      className="space-y-4 py-4"
                    >
                      <FormField
                        control={addressForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Home, Work, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addressForm.control}
                        name="line1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 1</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addressForm.control}
                        name="line2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 2 (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Apartment, suite, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={addressForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={addressForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={addressForm.control}
                          name="postal_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={addressForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={addressForm.control}
                        name="is_default"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <input
                                type="checkbox"
                                className="accent-primary"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Make this my default shipping address
                              </FormLabel>
                              <FormDescription>
                                This address will be used as your default shipping address
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddingAddress(false);
                            addressForm.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Save Address</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {user.addresses.length === 0 ? (
              <div className="text-center py-8 border border-border/40 rounded-lg">
                <div className="rounded-full bg-muted/50 p-3 mx-auto w-fit mb-4">
                  <Home className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No addresses found</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any saved addresses yet.
                </p>
                <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
                  <DialogTrigger asChild>
                    <Button>Add Your First Address</Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            ) : (
              <div className="grid gap-4">
                {user.addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`p-4 rounded-lg border border-border/40 ${
                      address.is_default ? "bg-primary/5 border-primary/20" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium flex items-center">
                          {address.name}
                          {address.is_default && (
                            <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 text-xs">Default</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {address.line1}
                          {address.line2 && <>, {address.line2}</>}
                          <br />
                          {address.city}, {address.state} {address.postal_code}
                          <br />
                          {address.country}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Dialog
                          open={editingAddress?.id === address.id}
                          onOpenChange={(open) => {
                            if (!open) setEditingAddress(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAddress(address)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[475px]">
                            <DialogHeader>
                              <DialogTitle>Edit Address</DialogTitle>
                              <DialogDescription>
                                Update your address details
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...addressForm}>
                              <form
                                onSubmit={addressForm.handleSubmit(onAddressSubmit)}
                                className="space-y-4 py-4"
                              >
                                <FormField
                                  control={addressForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Address Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Home, Work, etc." {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={addressForm.control}
                                  name="line1"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Address Line 1</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Street address" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={addressForm.control}
                                  name="line2"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Address Line 2 (Optional)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Apartment, suite, etc." {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={addressForm.control}
                                    name="city"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={addressForm.control}
                                    name="state"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>State</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={addressForm.control}
                                    name="postal_code"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Postal Code</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={addressForm.control}
                                    name="country"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Country</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={addressForm.control}
                                  name="is_default"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                      <FormControl>
                                        <input
                                          type="checkbox"
                                          className="accent-primary"
                                          checked={field.value}
                                          onChange={field.onChange}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel>
                                          Make this my default shipping address
                                        </FormLabel>
                                        <FormDescription>
                                          This address will be used as your default shipping address
                                        </FormDescription>
                                      </div>
                                    </FormItem>
                                  )}
                                />

                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingAddress(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit">Update Address</Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>

                        {!address.is_default && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSetDefaultAddress(address.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAddress(address.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
