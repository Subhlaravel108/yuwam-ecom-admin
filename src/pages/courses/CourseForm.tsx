import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Trash } from "lucide-react";
import { fetchCourse, createCourse, updateCourse } from "@/lib/api";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

type CourseFormState = {
  title: string;
  description: string;
  price: string;
  discounted_price: string;
  duration: string;
  attributes_value: string;
  status: "True" | "False";
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
};

const initialCourse: CourseFormState = {
  title: "",
  description: "",
  price: "",
  discounted_price: "",
  duration: "",
  attributes_value: "",
  status: "True",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
};

const parseAttributesFromApi = (raw: unknown): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          return String(obj.value ?? obj.name ?? obj.attribute_value ?? "");
        }
        return String(item ?? "");
      })
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parseAttributesFromApi(parsed);
    } catch {
      // not JSON — fall through to comma split
    }
    return trimmed
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const CourseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [course, setCourse] = useState<CourseFormState>(initialCourse);
  const [addAttributes, setAddAttributes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddAttributes = () => {
    const value = course.attributes_value.trim();
    if (!value) {
      toast.error("Please enter an attribute value.");
      return;
    }
    if (addAttributes.includes(value)) {
      toast.info("Attribute already added.");
      return;
    }
    setAddAttributes((prev) => [...prev, value]);
    setCourse((prev) => ({ ...prev, attributes_value: "" }));
  };

  const handleRemoveAttribute = (idx: number) => {
    setAddAttributes((prev) => prev.filter((_, i) => i !== idx));
  };

  // console.log("id=",id)
  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    const loadCourse = async () => {
      setIsLoading(true);
      try {
        const res = await fetchCourse(id);
        const data = res?.data ?? res;
        if (cancelled || !data) return;
        setCourse({
          title: data.title ?? "",
          description: data.description ?? data.discription ?? "",
          price: data.price != null ? String(data.price) : "",
          discounted_price:
            data.discounted_price != null ? String(data.discounted_price) : "",
          duration: data.duration ?? "",
          attributes_value: "",
          status: Number(data.status) === 1 ? "True" : "False",
          meta_title: data.meta_title ?? "",
          meta_description: data.meta_description ?? "",
          meta_keywords: data.meta_keywords ?? "",
        });
        setAddAttributes(
          parseAttributesFromApi(data.attributes ?? data.attributes_value)
        );
      } catch (error) {
        console.error("Failed to fetch course", error);
        toast.error("Failed to fetch course details.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadCourse();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCourse((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCourse((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!course.title || !course.duration || !course.price) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (
      course.discounted_price &&
      Number(course.discounted_price) > Number(course.price)
    ) {
      toast.error("Discounted price cannot be greater than price.");
      return;
    }

    setIsLoading(true);

    const payload = {
      title: course.title,
      description: course.description,
      duration: course.duration,
      price: course.price,
      discounted_price: course.discounted_price || null,
      status: course.status === "True" ? 1 : 0,
      meta_title: course.meta_title,
      meta_description: course.meta_description,
      meta_keywords: course.meta_keywords,
      attributes: addAttributes,
      attributes_value: addAttributes.join(", "),
    };

    
    try {
      if (isEdit && id) {
        await updateCourse(id, payload);
        toast.success("Course updated successfully!");
      } else {
        await createCourse(payload);
        toast.success("New Course created successfully!");
      }
      navigate("/courses");
    } catch (error: unknown) {
      console.error("Error saving course:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <CourseFormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" onClick={() => navigate("/courses")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to courses
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit ? "Edit Course Post" : "Create New Course Post"}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? "Update an existing course post on your website."
              : "Create engaging content for your travel website."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Course Title *
                </label>
                <Input
                  id="title"
                  name="title"
                  value={course.title}
                  onChange={handleChange}
                  placeholder="Enter course title"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">
                  Status
                </label>
                <Select
                  value={course.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="False">False</SelectItem>
                    <SelectItem value="True">True</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">
                  Price *
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  value={course.price}
                  onChange={handleChange}
                  placeholder="Enter course price"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="discounted_price"
                  className="text-sm font-medium"
                >
                  Discounted Price
                </label>
                <Input
                  id="discounted_price"
                  name="discounted_price"
                  type="number"
                  min="0"
                  value={course.discounted_price}
                  onChange={handleChange}
                  placeholder="Enter course discounted price"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="duration" className="text-sm font-medium">
                  Duration *
                </label>
                <Input
                  id="duration"
                  name="duration"
                  value={course.duration}
                  onChange={handleChange}
                  placeholder="90 hrs (1.30 hrs daily, 5 days a week, 3 months)"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <ReactQuill
                  id="description"
                  value={course.description}
                  onChange={(value) =>
                    setCourse((prev) => ({ ...prev, description: value }))
                  }
                  placeholder="Write your course description here"
                  theme="snow"
                  style={{ minHeight: 200 }}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="attributes_value"
                  className="text-sm font-medium"
                >
                  Attributes
                </label>
                <div className="flex gap-5">
                  <Input
                    id="attributes_value"
                    name="attributes_value"
                    value={course.attributes_value}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAttributes();
                      }
                    }}
                    placeholder="Enter attribute and press Enter or click Add"
                  /> 
                  <Button type="button" onClick={handleAddAttributes}>
                    Add
                  </Button>
                </div>
                <div className="px-4">
                  {addAttributes.length > 0 && (
                    <ol className="list-decimal mb-4">
                      {addAttributes.map((attr, idx) => (
                        <li key={idx} className="gap-2 mb-2">
                          <div className="flex gap-2">
                            <span className="flex-1">{attr}</span>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => handleRemoveAttribute(idx)}
                              disabled={isLoading}
                            >
                              <Trash />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="meta_title" className="text-sm font-medium">
                  Meta Title
                </label>
                <Input
                  id="meta_title"
                  name="meta_title"
                  value={course.meta_title}
                  onChange={handleChange}
                  placeholder="Enter meta title"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="meta_description"
                  className="text-sm font-medium"
                >
                  Meta Description
                </label>
                <Textarea
                  id="meta_description"
                  name="meta_description"
                  value={course.meta_description}
                  onChange={handleChange}
                  placeholder="Enter meta description"
                  rows={2}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="meta_keywords" className="text-sm font-medium">
                  Meta Keywords
                </label>
                <Input
                  id="meta_keywords"
                  name="meta_keywords"
                  value={course.meta_keywords}
                  onChange={handleChange}
                  placeholder="Enter meta keywords"
                />
              </div>
            </div>

            <CardFooter className="flex justify-between px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/courses")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Saving..."
                  : isEdit
                  ? "Update Course"
                  : "Save Course"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const CourseFormSkeleton = () => (
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

export default CourseForm;
