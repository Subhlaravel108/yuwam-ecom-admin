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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  categoryCreate,
  fetchCategory,
  updateCategory,
  fetchAllCategories,
} from "@/lib/api";
import { ArrowLeft } from "lucide-react";

const CategoryForm = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all categories for parent selection
  useEffect(() => {
    fetchAllCategories()
        .then((res) => setCategories(res.data?.data || []))
        .catch((err) => {
        setCategories([]);
        console.error("Error fetching categories:", err);
        toast.error("Failed to load categories");
        });
    }, []);

  // Fetch category for edit
  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      fetchCategory(id)
        .then((res) => {
          setName(res.data?.name || "");
          setDescription(res.data?.description || "");
          setParentId(
            res.data?.parent_id ? String(res.data.parent_id) : null
          );
        })
        .catch(() => {
          toast.error("Failed to load category");
          navigate("/categories");
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setLoading(true);
    try {
      const payload: any = { name, description };
      if (parentId) payload.parent_id = parentId;
      if (isEdit && id) {
        await updateCategory(id, payload);
        toast.success("Category updated successfully");
      } else {
        await categoryCreate(payload);
        toast.success("Category created successfully");
      }
      navigate("/categories");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          (isEdit ? "Failed to update category" : "Failed to create category")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto mt-8">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" onClick={() => navigate("/categories")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit ? "Edit Category" : "Create New Category"}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? "Update an existing category."
              : "Add a new category to organize your content."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CategoryFormSkeleton />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Category Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter category name"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Input
                    id="description"
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="parent" className="text-sm font-medium">
                    Parent Category
                  </label>
                  <Select
                        value={parentId ?? "none"}
                        onValueChange={(value) => setParentId(value === "none" ? null : value)}
                        >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select parent category (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {categories
                            .filter((cat) => !isEdit || String(cat.id) !== id) // Prevent selecting self as parent
                            .map((cat) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>
              <CardFooter className="flex justify-between px-0">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate("/categories")}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading
                    ? isEdit
                      ? "Updating..."
                      : "Saving..."
                    : isEdit
                    ? "Update Category"
                    : "Create Category"}
                </Button>
              </CardFooter>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CategoryFormSkeleton = () => (
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

export default CategoryForm;