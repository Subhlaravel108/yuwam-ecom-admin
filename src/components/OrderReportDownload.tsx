import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { 
  Download, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { fetchScheduleList, createScheduleRequest } from "@/lib/api";

interface ScheduleItem {
  id: number;
  command_id: string;
  command: string;
  type: string;
  arguments: string | null;
  schedule_at: string | null;
  status: number;
  file_path: string | null;
  error_message: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderReportDownloadProps {
  onRefresh?: () => void;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  orderStatus: string;
}

const getStatusIcon = (status: number) => {
  switch (status) {
    case 0:
      return <Clock className="h-4 w-4 text-gray-500" />;
    case 1:
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 2:
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 3:
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusBadge = (status: number) => {
  const statusConfig: { [key: number]: { variant: "default" | "secondary" | "destructive" | "outline", label: string } } = {
    0: { variant: "outline", label: "Pending" },
    1: { variant: "secondary", label: "Processing" },
    2: { variant: "default", label: "Completed" },
    3: { variant: "destructive", label: "Failed" },
  };

  const config = statusConfig[status] || { variant: "outline", label: "Unknown" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const OrderReportDownload: React.FC<OrderReportDownloadProps> = ({ onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterCommand, setFilterCommand] = useState("all");
  
  // Report filters state
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    startDate: "",
    endDate: "",
    orderStatus: "all"
  });

  const fetchScheduleData = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const res = await fetchScheduleList({ 
        type: filterType === "all" ? "" : filterType, 
        command: filterCommand === "all" ? "" : filterCommand 
      });
      // console.log("Schedule data response:", res.data?.data);
      setScheduleList(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching schedule list:", error);
      toast.error("Failed to load report history");
      setScheduleList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Delay to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        fetchScheduleData();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCreateRequest = async () => {
    // Validate required fields
    if (!reportFilters.startDate || !reportFilters.endDate) {
      toast.error("Please select both start date and end date",{ duration: 1500});
      return;
    }

    // Validate date range
    const startDate = new Date(reportFilters.startDate);
    const endDate = new Date(reportFilters.endDate);
    
    if (startDate > endDate) {
      toast.error("Start date cannot be after end date", {
        position: "top-center", 
        // closeButton:true,// override if needed
        duration: 1500,
        style: {
          background: "#f87171",
          color: "#fff",
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "14px",
        },
      });
      return;
    }

    setCreating(true);
    try {
      // Prepare arguments object
      const argumentsObj: any = {
        start_date: reportFilters.startDate,
        end_date: reportFilters.endDate
      };

      // Add order status if not "all"
      if (reportFilters.orderStatus !== "all") {
        argumentsObj.order_status = reportFilters.orderStatus;
      }

      const argumentsArray = argumentsObj;

      await createScheduleRequest({
        command: "bulkOrderDownload",
        type: "order",
        arguments: argumentsArray
      });
      toast.success("Report generation request created successfully" ,{ duration: 1500});
      fetchScheduleData();
      onRefresh?.();
      
      // Reset filters after successful creation
      setReportFilters({
        startDate: "",
        endDate: "",
        orderStatus: "all"
      });
    } catch (error: any) {
      console.error("Error creating schedule request:", error);
      toast.error(
        error?.response?.data?.message || "Failed to create report request"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = (filePath: string, fileName?: string) => {
    if (!filePath) {
      toast.error("No file available for download");
      return;
    }

    
    // Replace localhost with local IP
    const updatedPath = filePath.replace('localhost', '192.168.1.6');

    const link = document.createElement('a');
    link.href = updatedPath;
    link.download = fileName || `order_report_${Date.now()}.xlsx`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Download started" ,{ duration: 1500});
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center">
          <Download className="mr-2 h-4 w-4" />
          Download Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Order Report Downloads
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Request Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Create New Report
              </CardTitle>
              <CardDescription>
                Generate a new order report download request with custom filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={reportFilters.startDate}
                      onChange={(e) => setReportFilters(prev => ({
                        ...prev,
                        startDate: e.target.value
                      }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={reportFilters.endDate}
                      onChange={(e) => setReportFilters(prev => ({
                        ...prev,
                        endDate: e.target.value
                      }))}
                      required
                    />
                  </div>
                </div>

                {/* Order Status */}
                <div>
                  <Label htmlFor="orderStatus">Order Status</Label>
                  <Select 
                    value={reportFilters.orderStatus} 
                    onValueChange={(value) => setReportFilters(prev => ({
                      ...prev,
                      orderStatus: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All order statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All order statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleCreateRequest}
                  disabled={creating || !reportFilters.startDate || !reportFilters.endDate}
                  className="flex items-center"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Request
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="order">Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Command</Label>
                  <Select value={filterCommand} onValueChange={setFilterCommand}>
                    <SelectTrigger>
                      <SelectValue placeholder="All commands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All commands</SelectItem>
                      <SelectItem value="bulkOrderDownload">Bulk Order Download</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Report History</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchScheduleData}
                  disabled={loading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p>Loading reports...</p>
                </div>
              ) : scheduleList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No reports found
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduleList.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(item.status)}
                          <div>
                            <div className="font-medium">
                              {item.command} - {item.type}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {item.command_id}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(item.status)}
                          {item.file_path && item.status === 2 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(item.file_path!, `order_report_${item.id}.xlsx`)}
                              className="flex items-center"
                            >
                              <Download className="mr-1 h-3 w-3" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="text-sm">
                        <div><strong>Created:</strong> {formatDate(item.created_at)}</div>
                        <div><strong>Status:</strong> {
                          item.status === 0 ? 'Pending' : 
                          item.status === 1 ? 'Processing' : 
                          item.status === 2 ? 'Completed' : 
                          item.status === 3 ? 'Failed' : 'Unknown'
                        }</div>
                      </div>

                      {item.error_message && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="text-sm font-medium text-red-800">Error:</div>
                          <div className="text-sm text-red-600">{item.error_message}</div>
                        </div>
                      )}

                      {item.file_path && item.status === 1 && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <div className="text-sm font-medium text-green-800">File Ready:</div>
                          <div className="text-sm text-green-600 break-all">{item.file_path}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderReportDownload; 