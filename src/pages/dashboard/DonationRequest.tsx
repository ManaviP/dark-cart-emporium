import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Form validation schema
const formSchema = z.object({
  // Organization Details
  organization_name: z.string().min(2, "Organization name must be at least 2 characters"),
  organization_type: z.string().min(1, "Please select organization type"),
  contact_name: z.string().min(2, "Contact name must be at least 2 characters"),
  contact_email: z.string().email("Invalid email address"),
  contact_phone: z.string().min(10, "Phone number must be at least 10 digits"),
  verification_status: z.string().optional(),
  organization_profile: z.string().url("Must be a valid URL").optional(),

  // Food Requirements
  food_types: z.array(z.string()).min(1, "Select at least one food type"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  quantity_unit: z.string().min(1, "Please select quantity unit"),
  urgency: z.string().min(1, "Please select urgency level"),
  usage_purpose: z.string().min(1, "Please select usage purpose"),
  dietary_restrictions: z.string().optional(),

  // Logistics Information
  delivery_preference: z.string().min(1, "Please select delivery preference"),
  pickup_times: z.string().min(1, "Please specify pickup times"),
  storage_capabilities: z.string().min(1, "Please specify storage capabilities"),
  vehicle_availability: z.boolean(),
  handling_capacity: z.string().min(1, "Please specify handling capacity"),

  // Location Details
  service_area: z.string().min(1, "Please specify service area"),
  facility_address: z.string().min(1, "Please provide facility address"),
  landmark_instructions: z.string().optional(),
  operating_hours: z.string().min(1, "Please specify operating hours"),

  // Request Settings
  visibility: z.string().min(1, "Please select visibility"),
  request_duration: z.number().min(1, "Duration must be at least 1 day"),
  is_recurring: z.boolean(),
  recurrence_frequency: z.string().optional(),
  priority_level: z.string().min(1, "Please select priority level"),

  // Supporting Information
  description: z.string().min(10, "Description must be at least 10 characters"),
  people_served: z.number().min(1, "Must serve at least 1 person"),
  photos: z.array(z.string()).optional(),
  impact_stories: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const DonationRequest = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      food_types: [],
      vehicle_availability: false,
      is_recurring: false,
      photos: [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("donation_requests")
        .insert([{
          ...data,
          status: "pending",
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Donation request submitted successfully!",
      });

      form.reset();
    } catch (error) {
      console.error("Error submitting donation request:", error);
      toast({
        title: "Error",
        description: "Failed to submit donation request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Request Food Donation</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Organization Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Organization Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="organization_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter organization name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="organization_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ngo">NGO</SelectItem>
                            <SelectItem value="charity">Charity</SelectItem>
                            <SelectItem value="shelter">Shelter</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Add more organization fields here */}
              </div>

              {/* Food Requirements Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Food Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="food_types"
                    render={() => (
                      <FormItem>
                        <FormLabel>Food Types</FormLabel>
                        <div className="space-y-2">
                          {["Vegetarian", "Non-Vegetarian", "Perishable", "Non-Perishable"].map((type) => (
                            <FormField
                              key={type}
                              control={form.control}
                              name="food_types"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(type)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, type]);
                                        } else {
                                          field.onChange(current.filter((v) => v !== type));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{type}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Add more food requirement fields here */}
                </div>
              </div>

              {/* Add other sections similarly */}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DonationRequest; 