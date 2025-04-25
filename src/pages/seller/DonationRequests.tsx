import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Utensils,
  Building,
  Truck,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import {
  DonationRequest,
  getDonationRequestsByStatus,
  getDonationRequestById,
  acceptDonationRequest
} from "@/services/donationRequestService";
import { getProducts } from "@/services/productService";
import { Product } from "@/types/product";
import { createClient } from '@supabase/supabase-js';

// Create a public Supabase client (no auth required)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const publicSupabase = createClient(supabaseUrl, supabaseAnonKey);

const DonationRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<DonationRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<DonationRequest[]>([]);
  const [fulfilledRequests, setFulfilledRequests] = useState<DonationRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRequests, setFilteredRequests] = useState<DonationRequest[]>([]);

  const [selectedRequest, setSelectedRequest] = useState<DonationRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);

  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Array<{productId: number, quantity: number}>>([]);
  const [donationNotes, setDonationNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch donation requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);

        // Fetch requests directly from Supabase using public client
        const fetchRequestsByStatus = async (status: string) => {
          const { data, error } = await publicSupabase
            .from('donation_requests')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data || [];
        };

        // Fetch requests by status
        const [pending, approved, fulfilled] = await Promise.all([
          fetchRequestsByStatus('pending'),
          fetchRequestsByStatus('approved'),
          fetchRequestsByStatus('fulfilled')
        ]);

        setPendingRequests(pending);
        setApprovedRequests(approved);
        setFulfilledRequests(fulfilled);

        // Set filtered requests based on active tab
        if (activeTab === 'pending') {
          setFilteredRequests(pending);
        } else if (activeTab === 'approved') {
          setFilteredRequests(approved);
        } else {
          setFilteredRequests(fulfilled);
        }
      } catch (error) {
        console.error('Error fetching donation requests:', error);
        toast({
          title: "Error",
          description: "Failed to load donation requests",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [activeTab, toast]);

  // Fetch seller products when accept dialog opens
  useEffect(() => {
    if (isAcceptDialogOpen && user) {
      const fetchProducts = async () => {
        try {
          const products = await getProducts();
          // Filter to only show products with quantity > 0
          const availableProducts = products.filter(p => p.quantity > 0);
          setSellerProducts(availableProducts);
        } catch (error) {
          console.error('Error fetching seller products:', error);
          toast({
            title: "Error",
            description: "Failed to load your products",
            variant: "destructive"
          });
        }
      };

      fetchProducts();
    }
  }, [isAcceptDialogOpen, user, toast]);

  // Filter requests based on search query
  useEffect(() => {
    let requests: DonationRequest[] = [];

    if (activeTab === 'pending') {
      requests = pendingRequests;
    } else if (activeTab === 'approved') {
      requests = approvedRequests;
    } else {
      requests = fulfilledRequests;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = requests.filter(request =>
        request.organization_name.toLowerCase().includes(query) ||
        request.contact_name.toLowerCase().includes(query) ||
        request.service_area.toLowerCase().includes(query)
      );
      setFilteredRequests(filtered);
    } else {
      setFilteredRequests(requests);
    }
  }, [searchQuery, activeTab, pendingRequests, approvedRequests, fulfilledRequests]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchQuery("");
  };

  // View request details
  const handleViewRequest = async (request: DonationRequest) => {
    try {
      // Get the latest data for this request using public client
      const { data, error } = await publicSupabase
        .from('donation_requests')
        .select('*')
        .eq('id', request.id)
        .single();

      if (error) throw error;

      setSelectedRequest(data || request);
    } catch (error) {
      console.error('Error fetching request details:', error);
      // Fall back to the request data we already have
      setSelectedRequest(request);
    }

    setIsViewDialogOpen(true);
  };

  // Open accept dialog
  const handleOpenAcceptDialog = (request: DonationRequest) => {
    setSelectedRequest(request);
    setSelectedProducts([]);
    setDonationNotes("");
    setIsAcceptDialogOpen(true);
  };

  // Add product to donation
  const handleAddProduct = () => {
    if (sellerProducts.length === 0) return;

    setSelectedProducts([
      ...selectedProducts,
      { productId: sellerProducts[0].id, quantity: 1 }
    ]);
  };

  // Remove product from donation
  const handleRemoveProduct = (index: number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
  };

  // Update product selection
  const handleProductChange = (index: number, productId: number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index].productId = productId;
    setSelectedProducts(updatedProducts);
  };

  // Update product quantity
  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index].quantity = quantity;
    setSelectedProducts(updatedProducts);
  };

  // Accept donation request
  const handleAcceptRequest = async () => {
    if (!selectedRequest || !user || selectedProducts.length === 0) return;

    try {
      setIsSubmitting(true);

      await acceptDonationRequest(
        selectedRequest.id,
        user.id,
        {
          products: selectedProducts,
          notes: donationNotes
        }
      );

      toast({
        title: "Success",
        description: "Donation request accepted successfully",
      });

      // Update local state
      const updatedRequest = { ...selectedRequest, status: 'fulfilled' };

      setPendingRequests(pendingRequests.filter(r => r.id !== selectedRequest.id));
      setApprovedRequests(approvedRequests.filter(r => r.id !== selectedRequest.id));
      setFulfilledRequests([updatedRequest, ...fulfilledRequests]);

      if (activeTab === 'pending' || activeTab === 'approved') {
        setFilteredRequests(filteredRequests.filter(r => r.id !== selectedRequest.id));
      } else {
        setFilteredRequests([updatedRequest, ...filteredRequests]);
      }

      setIsAcceptDialogOpen(false);
    } catch (error) {
      console.error('Error accepting donation request:', error);
      toast({
        title: "Error",
        description: "Failed to accept donation request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get urgency badge
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return <Badge className="bg-red-500">Immediate</Badge>;
      case '24hours':
        return <Badge className="bg-orange-500">Within 24 Hours</Badge>;
      case 'week':
        return <Badge className="bg-yellow-500">Within a Week</Badge>;
      case 'month':
        return <Badge className="bg-blue-500">Within a Month</Badge>;
      default:
        return <Badge>{urgency}</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500">Approved</Badge>;
      case 'fulfilled':
        return <Badge className="bg-green-500">Fulfilled</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Donation Requests</h1>
          <p className="text-muted-foreground">
            View and fulfill donation requests from organizations
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search requests..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="border border-border/40 bg-card/30 backdrop-blur-sm mb-8">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No donation requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Food Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.organization_name}</TableCell>
                    <TableCell>
                      {request.is_vegetarian && "Vegetarian, "}
                      {request.is_non_vegetarian && "Non-Vegetarian, "}
                      {request.is_perishable && "Perishable, "}
                      {request.is_non_perishable && "Non-Perishable"}
                    </TableCell>
                    <TableCell>{request.quantity_required}</TableCell>
                    <TableCell>{getUrgencyBadge(request.urgency_level)}</TableCell>
                    <TableCell>{request.service_area}</TableCell>
                    <TableCell>{formatDate(request.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          View
                        </Button>

                        {(activeTab === 'pending' || activeTab === 'approved') && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenAcceptDialog(request)}
                          >
                            Fulfill
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Donation Request Details</DialogTitle>
            <DialogDescription>
              View details for this donation request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Organization Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Organization Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                  <div>
                    <p className="text-sm text-muted-foreground">Organization Name</p>
                    <p className="font-medium">{selectedRequest.organization_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Organization Type</p>
                    <p className="font-medium">{selectedRequest.organization_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Person</p>
                    <p className="font-medium">{selectedRequest.contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Email</p>
                    <p className="font-medium">{selectedRequest.contact_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Phone</p>
                    <p className="font-medium">{selectedRequest.contact_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{getStatusBadge(selectedRequest.status)}</p>
                  </div>
                </div>
              </div>

              {/* Food Requirements */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Food Requirements</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                  <div>
                    <p className="text-sm text-muted-foreground">Food Types</p>
                    <p className="font-medium">
                      {selectedRequest.is_vegetarian && "Vegetarian, "}
                      {selectedRequest.is_non_vegetarian && "Non-Vegetarian, "}
                      {selectedRequest.is_perishable && "Perishable, "}
                      {selectedRequest.is_non_perishable && "Non-Perishable"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity Required</p>
                    <p className="font-medium">{selectedRequest.quantity_required}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Urgency Level</p>
                    <p className="font-medium">{getUrgencyBadge(selectedRequest.urgency_level)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">People Served</p>
                    <p className="font-medium">{selectedRequest.people_served}</p>
                  </div>
                </div>
                <div className="pl-7">
                  <p className="text-sm text-muted-foreground">Usage Purpose</p>
                  <p className="font-medium">{selectedRequest.usage_purpose}</p>
                </div>
                {selectedRequest.dietary_restrictions && (
                  <div className="pl-7">
                    <p className="text-sm text-muted-foreground">Dietary Restrictions</p>
                    <p className="font-medium">{selectedRequest.dietary_restrictions}</p>
                  </div>
                )}
              </div>

              {/* Logistics Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Logistics Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Preference</p>
                    <p className="font-medium">
                      {selectedRequest.delivery_preference === 'pickup' && 'Can pick up donations'}
                      {selectedRequest.delivery_preference === 'delivery' && 'Needs delivery'}
                      {selectedRequest.delivery_preference === 'both' && 'Both pickup or delivery'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle Available</p>
                    <p className="font-medium">{selectedRequest.vehicle_available ? 'Yes' : 'No'}</p>
                  </div>
                  {selectedRequest.pickup_dates && (
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Dates</p>
                      <p className="font-medium">{selectedRequest.pickup_dates}</p>
                    </div>
                  )}
                  {selectedRequest.pickup_times && (
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Times</p>
                      <p className="font-medium">{selectedRequest.pickup_times}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Location Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                  <div>
                    <p className="text-sm text-muted-foreground">Service Area</p>
                    <p className="font-medium">{selectedRequest.service_area}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Operating Hours</p>
                    <p className="font-medium">{selectedRequest.operating_hours}</p>
                  </div>
                </div>
                <div className="pl-7">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedRequest.address}</p>
                </div>
                {selectedRequest.landmark && (
                  <div className="pl-7">
                    <p className="text-sm text-muted-foreground">Landmark</p>
                    <p className="font-medium">{selectedRequest.landmark}</p>
                  </div>
                )}
              </div>

              {/* Supporting Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Supporting Information</h3>
                </div>
                <div className="pl-7">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedRequest.description}</p>
                </div>
                {selectedRequest.additional_info && (
                  <div className="pl-7">
                    <p className="text-sm text-muted-foreground">Additional Information</p>
                    <p className="font-medium">{selectedRequest.additional_info}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                Created: {selectedRequest && formatDate(selectedRequest.created_at)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              {selectedRequest && (selectedRequest.status === 'pending' || selectedRequest.status === 'approved') && (
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  handleOpenAcceptDialog(selectedRequest);
                }}>
                  Fulfill Request
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Request Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Fulfill Donation Request</DialogTitle>
            <DialogDescription>
              Select products to donate to {selectedRequest?.organization_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Request Details</h3>
              {selectedRequest && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Organization</p>
                    <p className="font-medium">{selectedRequest.organization_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity Required</p>
                    <p className="font-medium">{selectedRequest.quantity_required}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Food Types</p>
                    <p className="font-medium">
                      {selectedRequest.is_vegetarian && "Vegetarian, "}
                      {selectedRequest.is_non_vegetarian && "Non-Vegetarian, "}
                      {selectedRequest.is_perishable && "Perishable, "}
                      {selectedRequest.is_non_perishable && "Non-Perishable"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Urgency</p>
                    <p className="font-medium">{getUrgencyBadge(selectedRequest.urgency_level)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Select Products to Donate</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddProduct}
                  disabled={sellerProducts.length === 0}
                >
                  Add Product
                </Button>
              </div>

              {sellerProducts.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-md">
                  <p className="text-muted-foreground">You don't have any products in stock</p>
                </div>
              ) : selectedProducts.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-md">
                  <p className="text-muted-foreground">Add products to donate</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedProducts.map((product, index) => {
                    const productDetails = sellerProducts.find(p => p.id === product.productId);

                    return (
                      <div key={index} className="flex items-center gap-4 p-3 border rounded-md">
                        <div className="flex-1">
                          <Select
                            value={product.productId.toString()}
                            onValueChange={(value) => handleProductChange(index, parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {sellerProducts.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.name} ({p.quantity} in stock)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-24">
                          <Input
                            type="number"
                            min="1"
                            max={productDetails?.quantity || 1}
                            value={product.quantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveProduct(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Additional Notes</h3>
              <textarea
                className="w-full p-2 border rounded-md bg-background"
                rows={3}
                placeholder="Add any notes about this donation..."
                value={donationNotes}
                onChange={(e) => setDonationNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAcceptRequest}
              disabled={selectedProducts.length === 0 || isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Fulfill Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DonationRequests;
