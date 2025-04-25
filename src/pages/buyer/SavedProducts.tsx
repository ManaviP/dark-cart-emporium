import { useAuth } from "@/context/auth-context";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SavedProducts as SavedProductsComponent } from "@/components/saved/SavedProducts";

const SavedProducts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'buyer') {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'buyer') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Saved Products</h1>
      <SavedProductsComponent />
    </div>
  );
};

export default SavedProducts; 