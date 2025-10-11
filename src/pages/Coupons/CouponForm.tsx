import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { fetchCoupon, createCoupon, updateCoupon } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

const CouponForm = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const [type, setType] = useState("percent");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [value, setValue] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [used, setUsed] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      fetchCoupon(id)
        .then((res) => {
          const c = res.data;
          setType(c.type || "percent");
          setMinOrderAmount(c.min_order_amount !== null ? String(c.min_order_amount) : "");
          setMaxDiscountAmount(c.max_discount_amount !== null ? String(c.max_discount_amount) : "");
          setValue(c.value !== null ? String(c.value) : "");
          setStartAt(c.start_at ? c.start_at.slice(0, 10) : "");
          setEndAt(c.end_at ? c.end_at.slice(0, 10) : "");
          setUsageLimit(c.usage_limit !== null ? String(c.usage_limit) : "");
          setUsed(c.used !== null ? String(c.used) : "");
          setIsActive(!!c.is_active);
          setCode(c.code || "");
        })
        .catch(() => {
          toast.error("Failed to load coupon");
          navigate("/coupons");
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    if (!code.trim()) return toast.error("Coupon code is required");
    if (!type) return toast.error("Type is required");
    if (!value || isNaN(Number(value)) || Number(value) < 0) return toast.error("Value is required and must be >= 0");
    if (!startAt) return toast.error("Start date is required");
    if (endAt && startAt && new Date(endAt) <= new Date(startAt)) return toast.error("End date must be after start date");
    if (minOrderAmount && (isNaN(Number(minOrderAmount)) || Number(minOrderAmount) < 0)) return toast.error("Min order amount must be >= 0");
    if (maxDiscountAmount && (isNaN(Number(maxDiscountAmount)) || Number(maxDiscountAmount) < 0)) return toast.error("Max discount amount must be >= 0");
    if (usageLimit && (isNaN(Number(usageLimit)) || Number(usageLimit) < 1)) return toast.error("Usage limit must be >= 1");
    if (used && (isNaN(Number(used)) || Number(used) < 0)) return toast.error("Used must be >= 0");
    setLoading(true);
    try {
      const payload: any = {
        code,
        type,
        value: Number(value),
        min_order_amount: minOrderAmount ? Number(minOrderAmount) : null,
        max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        start_at: startAt,
        end_at: endAt || null,
        usage_limit: usageLimit ? Number(usageLimit) : null,
        used: used ? Number(used) : null,
        is_active: isActive,
      };
      if (isEdit && id) {
        delete payload.code;
        await updateCoupon(id, payload);
        toast.success("Coupon updated successfully");
      } else {
        await createCoupon(payload);
        toast.success("Coupon created successfully");
      }
      navigate("/coupons");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          (isEdit ? "Failed to update coupon" : "Failed to create coupon")
      );
    } finally {
      setLoading(false);
    }
  };

  const valuePlaceholder = type === 'percent' ? 'e.g. 20 for 20%' : 'e.g. 200 for ₹200';
  const valueHelper = type === 'percent' ? 'Enter percent (e.g., 20 for 20% off)' : 'Enter flat amount (e.g., 200 for ₹200 off)';

  return (
    <div className="space-y-6 max-w-2xl mx-auto mt-8">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" onClick={() => navigate("/coupons")}> <ArrowLeft className="mr-2 h-4 w-4" /> Back to Coupons </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Coupon" : "Create New Coupon"}</CardTitle>
          <CardDescription>
            {isEdit ? "Update an existing coupon." : "Add a new coupon for your customers."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CouponFormSkeleton />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="code" className="text-sm font-medium">Coupon Code *</label>
                  <Input id="code" name="code" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. SAVE20" required disabled={isEdit} />
                  <p className="text-xs text-muted-foreground">Unique code customers enter at checkout. Must be unique (e.g., SAVE20).</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">Discount Type *</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percent (e.g., 20% off)</SelectItem>
                      <SelectItem value="fixed">Fixed (e.g., ₹20 off)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Choose "percent" for percentage off, or "fixed" for flat ₹ off.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="value" className="text-sm font-medium">Discount Value *</label>
                  <Input id="value" name="value" type="number" min={0} value={value} onChange={e => setValue(e.target.value)} required placeholder={valuePlaceholder} />
                  <p className="text-xs text-muted-foreground">{valueHelper}</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="minOrderAmount" className="text-sm font-medium">Minimum Order Amount</label>
                  <Input id="minOrderAmount" name="minOrderAmount" type="number" min={0} value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} placeholder="e.g. 500" />
                  <p className="text-xs text-muted-foreground">Optional. Minimum cart value required to apply coupon (e.g., ₹500).</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="maxDiscountAmount" className="text-sm font-medium">Maximum Discount Amount</label>
                  <Input id="maxDiscountAmount" name="maxDiscountAmount" type="number" min={0} value={maxDiscountAmount} onChange={e => setMaxDiscountAmount(e.target.value)} placeholder="e.g. 200" />
                  <p className="text-xs text-muted-foreground">
                    Optional. Only for percent type. Caps the discount (e.g., max ₹200 off even if 20% &gt; 200).
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="startAt" className="text-sm font-medium">Start Date *</label>
                  <Input id="startAt" name="startAt" type="date" value={startAt} onChange={e => setStartAt(e.target.value)} required />
                  <p className="text-xs text-muted-foreground">When the coupon becomes valid. Must be today or a future date.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="endAt" className="text-sm font-medium">End Date</label>
                  <Input id="endAt" name="endAt" type="date" value={endAt} onChange={e => setEndAt(e.target.value)} min={startAt} />
                  <p className="text-xs text-muted-foreground">Optional. When the coupon expires. Must be after start date.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="usageLimit" className="text-sm font-medium">Usage Limit</label>
                  <Input id="usageLimit" name="usageLimit" type="number" min={1} value={usageLimit} onChange={e => setUsageLimit(e.target.value)} placeholder="e.g. 100" />
                  <p className="text-xs text-muted-foreground">Optional. Max number of total redemptions allowed. Leave blank for unlimited.</p>
                </div>
                {isEdit && (
                  <div className="space-y-2">
                    <label htmlFor="used" className="text-sm font-medium">Used</label>
                    <Input id="used" name="used" type="number" min={0} value={used} placeholder="e.g. 0" disabled />
                    <p className="text-xs text-muted-foreground">How many times this coupon has been used. This is updated automatically.</p>
                  </div>
                )}
                <div className="space-y-2 flex items-center ">
                  <label htmlFor="isActive" className="text-sm font-medium mr-2">Active *</label>
                  <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>
              <CardFooter className="flex justify-between px-0">
                <Button variant="outline" type="button" onClick={() => navigate("/coupons")}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? (isEdit ? "Updating..." : "Saving...") : isEdit ? "Update Coupon" : "Create Coupon"}</Button>
              </CardFooter>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CouponFormSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-6 w-1/3 bg-gray-200 rounded mb-2 animate-pulse" />
      <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
        <div className="h-40 bg-gray-100 rounded animate-pulse" />
      </div>
    </CardContent>
  </Card>
);

export default CouponForm;