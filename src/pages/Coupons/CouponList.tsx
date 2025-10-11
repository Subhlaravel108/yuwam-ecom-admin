import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Plus, Search, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { fetchCoupons, deleteCoupon } from "@/lib/api";

const CouponsSkeleton = () => (
  <div className="p-4 space-y-4">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4 animate-pulse">
        <div className="h-8 w-10 bg-gray-200 rounded" />
        <div className="h-8 w-[300px] bg-gray-200 rounded" />
        <div className="h-8 w-[300px] bg-gray-200 rounded" />
        <div className="h-8 w-[200px] bg-gray-200 rounded" />
        <div className="h-8 w-20 bg-gray-200 rounded ml-auto" />
        <div className="h-8 w-20 bg-gray-200 rounded ml-auto" />
      </div>
    ))}
  </div>
);

const CouponList = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCouponList = async () => {
    setLoading(true);
    try {
      const res = await fetchCoupons({ page, search: searchTitle });
      setCoupons(res.data?.data || []);
      setTotalPages(res.data?.last_page || 1);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouponList();
  }, [page, searchTitle]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTitle(e.target.value);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the coupon permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await deleteCoupon(String(id));
        toast.success("Coupon deleted successfully");
        fetchCouponList();
      } catch (error) {
        toast.error("Failed to delete coupon");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
        <Button asChild>
          <Link to="/coupons/add">
            <Plus className="mr-2 h-4 w-4" />
            Add New Coupon
          </Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center mb-4">
          <Search className="w-5 h-5 text-gray-500 mr-2" />
          <Input
            placeholder="Search by code..."
            value={searchTitle}
            onChange={handleSearch}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border min-h-[200px]">
          {loading ? (
            <CouponsSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Max Discount</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Usage Limit</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      No coupons found.
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((coupon: any) => (
                    <TableRow key={coupon.id}>
                      <TableCell>{coupon.id}</TableCell>
                      <TableCell>
                        <Link to={`/coupons/edit/${coupon.id}`} className="text-blue-600 hover:underline">
                          {coupon.code}
                        </Link>
                      </TableCell>
                      <TableCell>{coupon.type}</TableCell>
                      <TableCell>{coupon.value}</TableCell>
                      <TableCell>{coupon.min_order_amount ?? '-'}</TableCell>
                      <TableCell>{coupon.max_discount_amount ?? '-'}</TableCell>
                      <TableCell>{coupon.start_at ? coupon.start_at.split('T')[0] : '-'}</TableCell>
                      <TableCell>{coupon.end_at ? coupon.end_at.split('T')[0] : '-'}</TableCell>
                      <TableCell>{coupon.usage_limit ?? '-'}</TableCell>
                      <TableCell>{coupon.used ?? 0}</TableCell>
                      <TableCell>{coupon.is_active ? 'Yes' : 'No'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="outline" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/coupons/edit/${coupon.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(coupon.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <div>
            Showing {coupons.length === 0 ? 0 : (page - 1) * 10 + 1} to {page * 10 > totalPages * 10 ? totalPages * 10 : page * 10} of {totalPages * 10} entries
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CouponList; 