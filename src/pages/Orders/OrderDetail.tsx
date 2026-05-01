import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { fetchOrder, changeOrderStatus, updateOrderTracking, downloadOrderInvoice } from "@/lib/api";
import { ArrowLeft, Package, User, MapPin, CreditCard, Calendar, Truck, ExternalLink, Download } from "lucide-react";
import OrderFulfillment from "@/components/OrderFulfillment";

const OrderDetailSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center space-x-2">
      <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const getStatusBadge = (status: string) => {
  const statusConfig: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", label: string } } = {
    pending: { variant: "outline", label: "Pending" },
    processing: { variant: "secondary", label: "Processing" },
    shipped: { variant: "default", label: "Shipped" },
    delivered: { variant: "default", label: "Delivered" },
    cancelled: { variant: "destructive", label: "Cancelled" },
    refunded: { variant: "destructive", label: "Refunded" },
  };

  const config = statusConfig[status.toLowerCase()] || { variant: "outline", label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingTracking, setUpdatingTracking] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [trackingData, setTrackingData] = useState({
    courier_name: "",
    tracking_number: "",
    tracking_url: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchOrderData();
    }
  }, [id]);

  const fetchOrderData = async () => {
    setLoading(true);
    try {
      const res = await fetchOrder(id!);
      setOrder(res.data);
      // Initialize tracking data with existing values
      setTrackingData({
        courier_name: res.data.courier_name || "",
        tracking_number: res.data.tracking_number || "",
        tracking_url: res.data.tracking_url || ""
      });
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order details");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!order || order.status === newStatus) return;
    
    setUpdatingStatus(true);
    try {
      await changeOrderStatus(id!, { status: newStatus });
      toast.success("Order status updated successfully");
      fetchOrderData(); // Refresh order data
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update order status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleTrackingUpdate = async () => {
    if (!trackingData.courier_name || !trackingData.tracking_number) {
      toast.error("Courier name and tracking number are required");
      return;
    }

    setUpdatingTracking(true);
    try {
      await updateOrderTracking(id!, trackingData);
      toast.success("Tracking information updated successfully");
      setTrackingDialogOpen(false);
      fetchOrderData(); // Refresh order data
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to update tracking information"
      );
    } finally {
      setUpdatingTracking(false);
    }
  };

  const handleTrackingInputChange = (field: string, value: string) => {
    setTrackingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const blob = await downloadOrderInvoice(id!);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.order_number || order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Invoice downloaded successfully");
    } catch (error: any) {
      console.error("Error downloading invoice:", error?.response?.data?.message);
      toast.error(
        error?.response?.data?.message || "Failed to download invoice"
      );
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Order not found</p>
        <Button onClick={() => navigate("/orders")} className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" onClick={() => navigate("/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>

      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                Order #{order.order_number || order.id}
              </CardTitle>
              <CardDescription>
                Placed on {formatDate(order.created_at)}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatCurrency(parseFloat(order.final_amount || order.total_amount || 0))}
              </div>
              {getStatusBadge(order.status)}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button 
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              variant="outline"
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              {downloadingInvoice ? "Downloading..." : "Download Invoice"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {item.product?.featured_image ? (
                          <img 
                            src={item.product.featured_image} 
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product_name || item.product?.name || 'Product Name'}</h4>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} × {formatCurrency(parseFloat(item.price || 0))}
                        </p>
                        {item.sku && (
                          <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(parseFloat(item.subtotal || (item.price || 0) * (item.quantity || 1)))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No items found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Fulfillment */}
          {order.items && order.items.length > 0 && (
            <OrderFulfillment 
              orderId={id!}
              items={order.items}
              onUpdate={fetchOrderData}
            />
          )}

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Contact Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {order.user?.name || 'N/A'}</p>
                    <p><strong>Email:</strong> {order.user?.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {order.user?.phone || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Order Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Order Date:</strong> {formatDate(order.created_at)}</p>
                    <p><strong>Payment Method:</strong> {order.payment_method || 'N/A'}</p>
                    <p><strong>Payment Status:</strong> 
                      <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className="ml-2">
                        {order.payment_status || 'N/A'}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          {order.payment_info && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Payment Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Amount:</strong> {formatCurrency(parseFloat(order.payment_info.amount || 0))}</p>
                      <p><strong>Status:</strong> 
                        <Badge variant={order.payment_info.status === 'completed' ? 'default' : 'secondary'} className="ml-2">
                          {order.payment_info.status}
                        </Badge>
                      </p>
                      <p><strong>Razorpay Order ID:</strong> {order.payment_info.rzpay_order_id || 'N/A'}</p>
                      <p><strong>Transaction ID:</strong> {order.payment_info.rzpay_transaction_id || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Customer Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Name:</strong> {order.payment_info.user_name || 'N/A'}</p>
                      <p><strong>Email:</strong> {order.payment_info.user_email || 'N/A'}</p>
                      <p><strong>Phone:</strong> {order.payment_info.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipping Address */}
          {order.shipping_address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>{order.shipping_address.name}</p>
                  <p>{order.shipping_address.address_line_1}</p>
                  {order.shipping_address.address_line_2 && (
                    <p>{order.shipping_address.address_line_2}</p>
                  )}
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
                  </p>
                  <p>{order.shipping_address.country}</p>
                  {order.shipping_address.phone && (
                    <p>Phone: {order.shipping_address.phone}</p>
                  )}
                  {order.shipping_address.email && (
                    <p>Email: {order.shipping_address.email}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracking Information */}
          {(order.courier_name || order.tracking_number) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  Tracking Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Courier:</span>
                    <span>{order.courier_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Tracking Number:</span>
                    <span>{order.tracking_number}</span>
                  </div>
                  {order.tracking_url && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Tracking URL:</span>
                      <a 
                        href={order.tracking_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        Track Package <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
              <CardDescription>
                Change the order status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={order.status}
                onValueChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tracking Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Tracking</CardTitle>
              <CardDescription>
                Add or update shipping tracking information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Truck className="mr-2 h-4 w-4" />
                    Update Tracking
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Tracking Information</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="courier_name">Courier Name *</Label>
                      <Input
                        id="courier_name"
                        value={trackingData.courier_name}
                        onChange={(e) => handleTrackingInputChange('courier_name', e.target.value)}
                        placeholder="e.g., FedEx, UPS, DHL"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tracking_number">Tracking Number *</Label>
                      <Input
                        id="tracking_number"
                        value={trackingData.tracking_number}
                        onChange={(e) => handleTrackingInputChange('tracking_number', e.target.value)}
                        placeholder="Enter tracking number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tracking_url">Tracking URL</Label>
                      <Input
                        id="tracking_url"
                        value={trackingData.tracking_url}
                        onChange={(e) => handleTrackingInputChange('tracking_url', e.target.value)}
                        placeholder="https://tracking.example.com/track"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setTrackingDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleTrackingUpdate}
                        disabled={updatingTracking || !trackingData.courier_name || !trackingData.tracking_number}
                      >
                        {updatingTracking ? "Updating..." : "Update Tracking"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(parseFloat(order.total_amount || 0))}</span>
                </div>
                {order.tax && parseFloat(order.tax) > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(parseFloat(order.tax))}</span>
                  </div>
                )}
                {order.shipping_charge && parseFloat(order.shipping_charge) > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{formatCurrency(parseFloat(order.shipping_charge))}</span>
                  </div>
                )}
                {order.discount && parseFloat(order.discount) > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-{formatCurrency(parseFloat(order.discount))}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(parseFloat(order.final_amount || order.total_amount || 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail; 