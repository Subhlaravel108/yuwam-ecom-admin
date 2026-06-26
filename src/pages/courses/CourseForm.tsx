import React, { useEffect, useRef, useState } from "react";
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
import { ArrowLeft, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { fetchCourse, createCourse, updateCourse, uploadTourImage } from "@/lib/api";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

type CourseAttributeItem = {
  value: string;
  images: string[];
};

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

const parseAttributesFromApi = (raw: unknown): CourseAttributeItem[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    const items: CourseAttributeItem[] = [];
    for (const item of raw) {
      if (typeof item === "string") {
        const value = item.trim();
        if (value) items.push({ value, images: [] });
        continue;
      }
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const value = String(
          obj.value ?? obj.name ?? obj.attribute_value ?? ""
        ).trim();
        if (!value) continue;
        const images: string[] = [];

        const imageUrlRaw = obj.image_url ?? obj.image;
        if (imageUrlRaw) images.push(String(imageUrlRaw));

        const imageUrlsRaw = obj.image_urls ?? obj.images;
        if (Array.isArray(imageUrlsRaw)) {
          for (const u of imageUrlsRaw) {
            const s = String(u ?? "").trim();
            if (s) images.push(s);
          }
        } else if (typeof imageUrlsRaw === "string") {
          const trimmed = imageUrlsRaw.trim();
          if (trimmed) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                for (const u of parsed) {
                  const s = String(u ?? "").trim();
                  if (s) images.push(s);
                }
              } else {
                // fallback: treat as a single URL string
                images.push(trimmed);
              }
            } catch {
              // fallback: treat as a single URL string
              images.push(trimmed);
            }
          }
        }

        // de-dupe while preserving order
        const seen = new Set<string>();
        const uniq = images.filter((u) => {
          if (!u) return false;
          if (seen.has(u)) return false;
          seen.add(u);
          return true;
        });

        items.push({ value, images: uniq });
        continue;
      }
      const value = String(item ?? "").trim();
      if (value) items.push({ value, images: [] });
    }
    return items;
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
      .filter(Boolean)
      .map((value) => ({ value, images: [] }));
  }
  return [];
};

type AttributeImagePickerProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  variant?: "default" | "inline";
};

const AttributeImagePicker = ({
  value,
  onChange,
  disabled,
  variant = "default",
}: AttributeImagePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map(uploadTourImage));
      const next = [
        ...(Array.isArray(value) ? value : []),
        ...uploaded.filter((u): u is string => !!u),
      ];
      // de-dupe while preserving order
      const seen = new Set<string>();
      const uniq = next.filter((u) => {
        if (!u) return false;
        if (seen.has(u)) return false;
        seen.add(u);
        return true;
      });
      onChange(uniq);
    } catch {
      toast.error("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            Uploading…
          </>
        ) : value.length > 0 ? (
          "Change image"
        ) : (
          "Add image"
        )}
      </Button>
    </div>
  );

  const thumbnails =
    value?.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {value.map((u, idx) => (
          <div key={`${u}-${idx}`} className="relative h-14 w-14">
            <img
              src={u}
              alt=""
              className="h-14 w-14 rounded-lg border object-cover"
            />
            <button
              type="button"
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => onChange(value.filter((_, i) => i !== idx))}
              disabled={disabled || isUploading}
              aria-label="Remove this image"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    ) : null;

  if (variant === "inline") {
    return (
      <>
        {thumbnails}
        {actionButtons}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() =>
            !disabled && !isUploading && inputRef.current?.click()
          }
          disabled={disabled || isUploading}
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/40 transition-colors hover:border-primary/50 hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={
            value.length > 0 ? "Change attribute images" : "Upload attribute images"
          }
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : value.length > 0 ? (
            <img
              src={value[0]}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        {actionButtons}
      </div>

      {thumbnails}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
    </div>
  );
};

const CourseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [course, setCourse] = useState<CourseFormState>(initialCourse);
  const [addAttributes, setAddAttributes] = useState<CourseAttributeItem[]>([]);
  const [pendingAttributeImages, setPendingAttributeImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddAttributes = () => {
    const value = course.attributes_value.trim();
    if (!value) {
      toast.error("Please enter an attribute value.");
      return;
    }
    if (addAttributes.some((a) => a.value === value)) {
      toast.info("Attribute already added.");
      return;
    }
    setAddAttributes((prev) => [
      ...prev,
      { value, images: pendingAttributeImages },
    ]);
    setCourse((prev) => ({ ...prev, attributes_value: "" }));
    setPendingAttributeImages([]);
  };

  const handleAttributeImagesChange = (idx: number, urls: string[]) => {
    setAddAttributes((prev) =>
      prev.map((attr, i) =>
        i === idx ? { ...attr, images: urls } : attr
      )
    );
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
      price: Number(course.price),
      discounted_price: course.discounted_price
        ? Number(course.discounted_price)
        : null,
      status: course.status === "True",
      meta_title: course.meta_title || null,
      meta_description: course.meta_description || null,
      meta_keywords: course.meta_keywords || null,
      attributes: addAttributes.map((attr) => ({
        value: attr.value,
        images: attr.images,
      })),
      images: addAttributes.map((attr) => attr.images[0] ?? null),
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

              <div className="space-y-4 md:col-span-2">
                <div>
                  <label
                    htmlFor="attributes_value"
                    className="text-sm font-medium"
                  >
                    Course attributes
                  </label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add highlights or features (e.g. live classes, study material).
                    Each attribute can have optional images (multiple allowed).
                  </p>
                </div>

                <div className="rounded-lg border border-dashed bg-muted/30 p-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    New attribute
                  </p>
                  <div className="space-y-4">
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
                      placeholder="e.g. Live classes, Mock tests, Certificate"
                      disabled={isLoading}
                    />
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <AttributeImagePicker
                        value={pendingAttributeImages}
                        onChange={setPendingAttributeImages}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        onClick={handleAddAttributes}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add attribute
                      </Button>
                    </div>
                  </div>
                </div>

                {addAttributes.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Added attributes ({addAttributes.length})
                    </p>
                    <ul className="space-y-2">
                      {addAttributes.map((attr, idx) => (
                        <li
                          key={`${attr.value}-${idx}`}
                          className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {idx + 1}
                            </span>
                            {attr.images?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {attr.images.map((u, i) => (
                                  <img
                                    key={`${u}-${i}`}
                                    src={u}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-lg border object-cover"
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/50">
                                <ImagePlus className="h-5 w-5 text-muted-foreground/60" />
                              </div>
                            )}
                            <p className="min-w-0 flex-1 break-words pt-1 text-sm font-medium leading-snug sm:pt-0">
                              {attr.value}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 border-t pt-4 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
                            <AttributeImagePicker
                              variant="inline"
                              value={attr.images}
                              onChange={(urls) => handleAttributeImagesChange(idx, urls)}
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleRemoveAttribute(idx)}
                              disabled={isLoading}
                              aria-label={`Remove ${attr.value}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                    No attributes added yet. Use the form above to add one.
                  </p>
                )}
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
