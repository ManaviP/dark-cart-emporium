import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DonationRequest {
  id: string;
  organization_name: string;
  organization_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  food_types: string[];
  quantity: number;
  quantity_unit: string;
  urgency: string;
  status: string;
  created_at: string;
}

export default function DonationRequestsList() {
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("donation_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching donation requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Donation Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Food Types</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="font-medium">{request.organization_name}</div>
                  <div className="text-sm text-gray-500">{request.organization_type}</div>
                </TableCell>
                <TableCell>
                  <div>{request.contact_name}</div>
                  <div className="text-sm text-gray-500">{request.contact_email}</div>
                  <div className="text-sm text-gray-500">{request.contact_phone}</div>
                </TableCell>
                <TableCell>
                  {request.food_types.map((type, index) => (
                    <Badge key={index} variant="secondary" className="mr-1">
                      {type}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>
                  {request.quantity} {request.quantity_unit}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      request.urgency === "high"
                        ? "bg-red-100 text-red-800"
                        : request.urgency === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }
                  >
                    {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>
                  {format(new Date(request.created_at), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 