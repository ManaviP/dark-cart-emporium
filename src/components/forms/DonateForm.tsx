import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Product, DonationDetails } from "@/types/product";
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
import { getProductById } from "@/services/productService";

// Form schema
const donateFormSchema = z.object({
  quantity: z.coerce
    .number()
    .int()
    .positive({ message: "Quantity must be a positive integer." }),
  destination: z.string().min(5, {
    message: "Destination must be at least 5 characters.",
  }),
  notes: z.string().optional(),
});

type DonateFormValues = z.infer<typeof donateFormSchema>;

interface DonateFormProps {
  productId: number;
  onSubmit: (data: DonationDetails) => void;
  isSubmitting: boolean;
}

const DonateForm = ({ productId, onSubmit, isSubmitting }: DonateFormProps) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await getProductById(productId);
        setProduct(productData);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Initialize form
  const form = useForm<DonateFormValues>({
    resolver: zodResolver(donateFormSchema),
    defaultValues: {
      quantity: 1,
      destination: "",
      notes: "",
    },
  });

  // Watch quantity to calculate value
  const quantity = form.watch("quantity");
  const donationValue = product ? product.price * quantity : 0;

  // Handle form submission
  const handleSubmit = (data: DonateFormValues) => {
    if (!product) return;

    const donationDetails: DonationDetails = {
      productId: product.id,
      quantity: data.quantity,
      destination: data.destination,
      notes: data.notes,
      value: donationValue,
    };

    onSubmit(donationDetails);
  };

  if (loading) {
    return <div className="text-center py-8">Loading product details...</div>;
  }

  if (!product) {
    return (
      <div className="text-center py-8">
        Product not found. Please go back and try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Info */}
      <div className="flex flex-col md:flex-row gap-6 border rounded-md p-4">
        <div className="md:w-1/4">
          <div className="aspect-square overflow-hidden rounded-md border">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="md:w-3/4 space-y-2">
          <h2 className="text-xl font-bold">{product.name}</h2>
          <p className="text-muted-foreground">{product.description}</p>
          <div className="flex items-center gap-2">
            <span className="font-medium">Price:</span>
            <span>₹{product.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Available Quantity:</span>
            <span>{product.quantity}</span>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity to Donate</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max={product.quantity}
                      step="1"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum available: {product.quantity}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Destination */}
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Donation Destination</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Where is this donation going?"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    E.g., Charity name, organization, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information about this donation"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Donation Value */}
          <div className="border rounded-md p-4 bg-muted/30">
            <div className="flex justify-between items-center">
              <span className="font-medium">Donation Value:</span>
              <span className="text-xl font-bold">
                ₹{donationValue.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Confirm Donation"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default DonateForm;
