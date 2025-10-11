import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { updateOrderItemsPacking } from "@/lib/api";

interface OrderItem {
  id: number;
  order_item_id: number;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  product?: {
    name: string;
    featured_image?: string;
  };
  stock_status?: 'available' | 'partial' | 'unavailable';
  packed_quantity?: number;
  admin_note?: string;
}

interface OrderFulfillmentProps {
  orderId: string;
  items: OrderItem[];
  onUpdate?: () => void;
}

const getStockStatusIcon = (status: string) => {
  switch (status) {
    case 'available':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'partial':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'unavailable':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Package className="h-4 w-4 text-gray-400" />;
  }
};

const getStockStatusBadge = (status: string) => {
  const statusConfig: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", label: string } } = {
    available: { variant: "default", label: "Available" },
    partial: { variant: "secondary", label: "Partial" },
    unavailable: { variant: "destructive", label: "Unavailable" },
  };

  const config = statusConfig[status] || { variant: "outline", label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const OrderFulfillment: React.FC<OrderFulfillmentProps> = ({ orderId, items, onUpdate }) => {
  const [fulfillmentData, setFulfillmentData] = useState<OrderItem[]>(
    items.map(item => ({
      ...item,
      stock_status: item.stock_status || 'available',
      packed_quantity: item.packed_quantity || item.quantity,
      admin_note: item.admin_note || ''
    }))
  );
  const [updating, setUpdating] = useState(false);

  const handleStockStatusChange = (itemId: number, status: 'available' | 'partial' | 'unavailable') => {
    setFulfillmentData(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, stock_status: status }
          : item
      )
    );
  };

  const handlePackedQuantityChange = (itemId: number, quantity: string) => {
    const numQuantity = parseInt(quantity) || 0;
    setFulfillmentData(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, packed_quantity: numQuantity }
          : item
      )
    );
  };

  const handleAdminNoteChange = (itemId: number, note: string) => {
    setFulfillmentData(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, admin_note: note }
          : item
      )
    );
  };

  const handleSubmit = async () => {
    setUpdating(true);
    try {
      const payload = {
        items: fulfillmentData.map(item => ({
          order_item_id: item.id,
          stock_status: item.stock_status!,
          packed_quantity: item.packed_quantity!,
          ...(item.admin_note && { admin_note: item.admin_note })
        }))
      };
      console.log(payload);
      console.log(orderId);
      await updateOrderItemsPacking(orderId, payload);
      toast.success("Order fulfillment updated successfully");
      onUpdate?.();
    } catch (error: any) {
      console.error("Error updating fulfillment:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update order fulfillment"
      );
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="mr-2 h-5 w-5" />
          Order Fulfillment
        </CardTitle>
        <CardDescription>
          Update packing status and quantities for each order item
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fulfillmentData.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-start space-x-4">
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
                    Ordered: {item.quantity} × {formatCurrency(parseFloat(item.price || '0'))}
                  </p>
                  <p className="text-sm text-gray-500">
                    Total: {formatCurrency(parseFloat(item.subtotal || '0'))}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`stock-status-${item.id}`}>Stock Status</Label>
                  <Select
                    value={item.stock_status}
                    onValueChange={(value: 'available' | 'partial' | 'unavailable') => 
                      handleStockStatusChange(item.id, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">
                        <div className="flex items-center space-x-2">
                          {getStockStatusIcon('available')}
                          <span>Available</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="partial">
                        <div className="flex items-center space-x-2">
                          {getStockStatusIcon('partial')}
                          <span>Partial</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="unavailable">
                        <div className="flex items-center space-x-2">
                          {getStockStatusIcon('unavailable')}
                          <span>Unavailable</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`packed-quantity-${item.id}`}>Packed Quantity</Label>
                  <Input
                    id={`packed-quantity-${item.id}`}
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={item.packed_quantity}
                    onChange={(e) => handlePackedQuantityChange(item.id, e.target.value)}
                    placeholder="Enter packed quantity"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max: {item.quantity}
                  </p>
                </div>

                <div>
                  <Label htmlFor={`admin-note-${item.id}`}>Admin Note (Optional)</Label>
                  <Textarea
                    id={`admin-note-${item.id}`}
                    value={item.admin_note}
                    onChange={(e) => handleAdminNoteChange(item.id, e.target.value)}
                    placeholder="Add notes about this item..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStockStatusBadge(item.stock_status!)}
                  <span className="text-sm text-gray-500">
                    Packed: {item.packed_quantity}/{item.quantity}
                  </span>
                </div>
                {item.packed_quantity! < item.quantity && (
                  <Badge variant="secondary">
                    Partial Fulfillment
                  </Badge>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={updating}
              className="w-full md:w-auto"
            >
              {updating ? "Updating..." : "Update Fulfillment"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderFulfillment; 