import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Gift } from "lucide-react";
import DonateForm from "@/components/forms/DonateForm";
import { donateProduct } from "@/services/productService";
import { DonationDetails } from "@/types/product";

const DonateProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: DonationDetails) => {
    setIsSubmitting(true);
    try {
      await donateProduct(data);
      
      toast({
        title: "Donation Successful",
        description: "Thank you for your donation!",
      });
      
      navigate("/seller/products");
    } catch (error) {
      console.error("Error processing donation:", error);
      toast({
        title: "Error",
        description: "There was an error processing your donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!id) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/seller/products")}>
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/seller/products")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>
      
      <Card className="border border-border/40 bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <CardTitle>Donate Product</CardTitle>
          </div>
          <CardDescription>
            Donate your products to those in need
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DonateForm 
            productId={parseInt(id)} 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DonateProduct;
