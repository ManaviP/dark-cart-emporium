import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from '@supabase/supabase-js';
import { Building, CalendarClock, MapPin, Truck, Utensils, Info } from "lucide-react";

// Create a public Supabase client (no auth required)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const publicSupabase = createClient(supabaseUrl, supabaseAnonKey);

// Define the form schema with Zod
const formSchema = z.object({
  // Organization Details
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  organizationType: z.string().min(1, "Organization type is required"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().min(10, "Phone number must be at least 10 digits"),

  // Food Requirements
  foodTypes: z.array(z.string()).min(1, "Select at least one food type"),
  isVegetarian: z.boolean().optional(),
  isNonVegetarian: z.boolean().optional(),
  isPerishable: z.boolean().optional(),
  isNonPerishable: z.boolean().optional(),
  quantityRequired: z.string().min(1, "Quantity is required"),
  urgencyLevel: z.enum(["immediate", "24hours", "week", "month"]),
  usagePurpose: z.string().min(5, "Usage purpose must be at least 5 characters"),
  dietaryRestrictions: z.string().optional(),

  // Logistics Information
  deliveryPreference: z.enum(["pickup", "delivery", "both"]),
  pickupDates: z.string().optional(),
  pickupTimes: z.string().optional(),
  storageCapability: z.array(z.string()).optional(),
  vehicleAvailable: z.boolean().optional(),

  // Location Details
  serviceArea: z.string().min(2, "Service area must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  landmark: z.string().optional(),
  operatingHours: z.string().min(2, "Operating hours must be at least 2 characters"),

  // Request Settings
  visibility: z.enum(["public", "private", "specific"]),
  duration: z.enum(["oneTime", "recurring"]),
  recurringFrequency: z.string().optional(),
  isPriority: z.boolean().optional(),

  // Supporting Information
  description: z.string().min(10, "Description must be at least 10 characters"),
  peopleServed: z.string().min(1, "Number of people served is required"),
  additionalInfo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const RequestDonation = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: "",
      organizationType: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",

      foodTypes: [],
      isVegetarian: false,
      isNonVegetarian: false,
      isPerishable: false,
      isNonPerishable: false,
      quantityRequired: "",
      urgencyLevel: "week",
      usagePurpose: "",
      dietaryRestrictions: "",

      deliveryPreference: "both",
      pickupDates: "",
      pickupTimes: "",
      storageCapability: [],
      vehicleAvailable: false,

      serviceArea: "",
      address: "",
      landmark: "",
      operatingHours: "",

      visibility: "public",
      duration: "oneTime",
      recurringFrequency: "",
      isPriority: false,

      description: "",
      peopleServed: "",
      additionalInfo: "",
    },
  });

  // Watch form values for conditional fields
  const deliveryPreference = form.watch("deliveryPreference");
  const duration = form.watch("duration");

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // Submit to Supabase using public client (no auth required)
      const { error } = await publicSupabase
        .from('donation_requests')
        .insert([
          {
            organization_name: data.organizationName,
            organization_type: data.organizationType,
            contact_name: data.contactName,
            contact_email: data.contactEmail,
            contact_phone: data.contactPhone,

            food_types: data.foodTypes,
            is_vegetarian: data.isVegetarian,
            is_non_vegetarian: data.isNonVegetarian,
            is_perishable: data.isPerishable,
            is_non_perishable: data.isNonPerishable,
            quantity_required: data.quantityRequired,
            urgency_level: data.urgencyLevel,
            usage_purpose: data.usagePurpose,
            dietary_restrictions: data.dietaryRestrictions,

            delivery_preference: data.deliveryPreference,
            pickup_dates: data.pickupDates,
            pickup_times: data.pickupTimes,
            storage_capability: data.storageCapability,
            vehicle_available: data.vehicleAvailable,

            service_area: data.serviceArea,
            address: data.address,
            landmark: data.landmark,
            operating_hours: data.operatingHours,

            visibility: data.visibility,
            duration: data.duration,
            recurring_frequency: data.recurringFrequency,
            is_priority: data.isPriority,

            description: data.description,
            people_served: data.peopleServed,
            additional_info: data.additionalInfo,

            status: 'pending',
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your donation request has been submitted successfully!",
      });

      // Reset form
      form.reset();

    } catch (error) {
      console.error("Error submitting donation request:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Request Donation</h1>
        <p className="text-muted-foreground">
          Fill out this form to request food donations for your organization
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Organization Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle>Organization Details</CardTitle>
              </div>
              <CardDescription>
                Provide information about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter organization name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Type*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organization type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ngo">NGO</SelectItem>
                          <SelectItem value="school">School</SelectItem>
                          <SelectItem value="shelter">Shelter</SelectItem>
                          <SelectItem value="community">Community Kitchen</SelectItem>
                          <SelectItem value="religious">Religious Institution</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Food Requirements */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                <CardTitle>Food Requirements</CardTitle>
              </div>
              <CardDescription>
                Specify the type and quantity of food needed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="foodTypes"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Food Types*</FormLabel>
                      <FormDescription>
                        Select all that apply
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="isVegetarian"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Vegetarian</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isNonVegetarian"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Non-Vegetarian</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isPerishable"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Perishable</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isNonPerishable"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Non-Perishable</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantityRequired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity Required*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 50 kg or 100 meals" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urgencyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency Level*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select urgency level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate (Today)</SelectItem>
                          <SelectItem value="24hours">Within 24 Hours</SelectItem>
                          <SelectItem value="week">Within a Week</SelectItem>
                          <SelectItem value="month">Within a Month</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="usagePurpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Purpose*</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe how the food will be used"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dietaryRestrictions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dietary Restrictions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any specific dietary restrictions or requirements"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Logistics Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <CardTitle>Logistics Information</CardTitle>
              </div>
              <CardDescription>
                Provide details about delivery or pickup preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="deliveryPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Preference*</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="pickup" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            We can pick up donations
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="delivery" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            We need donations delivered
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="both" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Both options work for us
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(deliveryPreference === "pickup" || deliveryPreference === "both") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pickupDates"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Pickup Dates</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Mon-Fri or specific dates" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pickupTimes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Pickup Times</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 9 AM - 5 PM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="vehicleAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>We have a vehicle available for collection</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Location Details</CardTitle>
              </div>
              <CardDescription>
                Provide information about your location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="serviceArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Area*</FormLabel>
                    <FormControl>
                      <Input placeholder="Area covered by your organization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address*</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Full address of your facility"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="landmark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Landmark</FormLabel>
                      <FormControl>
                        <Input placeholder="Nearby landmark for easy finding" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="operatingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operating Hours*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Mon-Fri: 9 AM - 5 PM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Request Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                <CardTitle>Request Settings</CardTitle>
              </div>
              <CardDescription>
                Configure your donation request settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Visibility*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public (Visible to all donors)</SelectItem>
                          <SelectItem value="private">Private (By invitation only)</SelectItem>
                          <SelectItem value="specific">Specific Donor Types</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Duration*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="oneTime">One-time Request</SelectItem>
                          <SelectItem value="recurring">Recurring Need</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {duration === "recurring" && (
                <FormField
                  control={form.control}
                  name="recurringFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurring Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="isPriority"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>This is a priority request</FormLabel>
                      <FormDescription>
                        Mark as priority if this is an urgent or critical need
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Supporting Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <CardTitle>Supporting Information</CardTitle>
              </div>
              <CardDescription>
                Additional details about your request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description*</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe how the donations will be used"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="peopleServed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of People Served*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 50-100 people" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any other relevant information"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default RequestDonation;
