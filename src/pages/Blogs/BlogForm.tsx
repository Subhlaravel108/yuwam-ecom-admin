import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
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
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { fetchBlog, createBlog, updateBlog, uploadTourImage } from "@/lib/api"; // <-- import your API
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const BLOG_CATEGORIES = [
  { id: 1, name: "Book Reviews" },          // Reviews of academic & non-academic books
  { id: 2, name: "Study Tips & Techniques" }, // How to study effectively, productivity hacks
  { id: 3, name: "Exam Preparation" },      // Guides for competitive & school exams
  { id: 4, name: "Career Guidance" },       // Education to career paths, subject choices
  { id: 5, name: "Learning Resources" },    // Free/paid resources, online tools, apps
  { id: 6, name: "Author Insights" },       // Interviews, biographies, author stories
  { id: 7, name: "Education Trends" },      // Latest in education, EdTech, policies
  { id: 8, name: "Student Life" },          // Motivation, time management, experiences
];

const BlogForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [blog, setBlog] = useState({
    title: "",
    author: "",
    category: "",
    summary: "",
    content: "",
    featuredImage: "",
    publishDate: null as Date | null,
    status: "Draft",
    tags: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
  });

  const [loadingBlog, setLoadingBlog] = useState(() => !!id);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    const loadBlog = async () => {
      if (isEdit && id) {
        setLoadingBlog(true);
        try {
          const res = await fetchBlog(id);
          // console.log("Fetched blog data:", res.data);
          const data = res.data;
          setBlog({
            title: data.title || "",
            author: data.author_id || "", // You may want to fetch author name if needed
            category: data.category_id ? data.category_id.toString() : "",
            summary: data.short_description || "",
            content: data.content || "",
            featuredImage: data.thumbnail_image || "",
            publishDate: data.published_at ? new Date(data.published_at) : null,
            status: data.status === 1 ? "Published" : "Draft",
            tags: Array.isArray(data.tags)
              ? data.tags.join(", ")
              : (JSON.parse(data.tags || "[]") || []).join(", "),
            meta_title: data.meta_title || "",
            meta_description: data.meta_description || "",
            meta_keywords: data.meta_keywords || "",
          });
        } catch (error) {
          toast.error("Failed to fetch blog details.");
        } finally {
          setLoadingBlog(false);
        }
      }
    };
    loadBlog();
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBlog((prevBlog) => ({ ...prevBlog, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setBlog((prevBlog) => ({ ...prevBlog, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    setBlog((prevBlog) => ({ ...prevBlog, publishDate: date }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const url = await uploadTourImage(file);
      if (!url) {
        toast.error("Image upload did not return a URL.");
        return;
      }
      setBlog((prev) => ({ ...prev, featuredImage: url }));
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Image upload failed");
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Validate form
    if (!blog.title || !blog.category) {
      toast.error("Please fill in all required fields.");
      setSaving(false);
      return;
    }

    // Prepare payload
    const payload = {
      title: blog.title,
      short_description: blog.summary,
      content: blog.content,
      meta_title: blog.meta_title,
      meta_description: blog.meta_description,
      meta_keywords: blog.meta_keywords,
      thumbnail_image: blog.featuredImage,
      gallery_images: [], // Add support if you want
      category_id: blog.category,
      tags: blog.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: blog.status === "Published" ? 1 : 0,
      published_at: blog.publishDate ? blog.publishDate.toISOString().slice(0, 19).replace("T", " ") : null,
    };

    try {
      if (isEdit && id) {
        await updateBlog(id, payload);
        toast.success("Blog updated successfully!");
      } else {
        await createBlog(payload);
        toast.success("New blog created successfully!");
      }
      navigate("/blogs");
    } catch (error: any) {
      console.error("Error saving blog:", error);
      toast.error(error?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingBlog) {
    return <BlogFormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" onClick={() => navigate("/blogs")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blogs
        </Button>
      </div>
      <Card>
          <CardHeader>
            <CardTitle>{isEdit ? "Edit Blog Post" : "Create New Blog Post"}</CardTitle>
            <CardDescription>
              {isEdit
                ? "Update an existing blog post on your website."
                : "Create engaging content for your travel website."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Blog Title *
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={blog.title}
                    onChange={handleChange}
                    placeholder="Enter blog title"
                    required
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category *
                  </label>
                  <Select
                    value={blog.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {BLOG_CATEGORIES.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Status
                  </label>
                  <Select
                    value={blog.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="publishDate" className="text-sm font-medium">
                    Publish Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !blog.publishDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {blog.publishDate ? (
                          format(blog.publishDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={blog.publishDate || undefined}
                        onSelect={handleDateChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label htmlFor="tags" className="text-sm font-medium">
                    Tags
                  </label>
                  <Input
                    id="tags"
                    name="tags"
                    value={blog.tags}
                    onChange={handleChange}
                    placeholder="Enter tags separated by commas"
                  />
                </div>
                <div className="relative space-y-2 md:col-span-2">
                  <label htmlFor="featuredImage" className="text-sm font-medium">
                    Featured Image
                  </label>
                  <Input
                    id="featuredImage"
                    name="featuredImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading || saving}
                    className={imageUploading ? "opacity-60" : undefined}
                  />
                  {imageUploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      Uploading image…
                    </div>
                  )}
                  {blog.featuredImage && !imageUploading && (
                    <div className="mt-2">
                      <img
                        src={blog.featuredImage}
                        alt={blog.title}
                        className="max-h-60 rounded-md"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="summary" className="text-sm font-medium">
                    Summary
                  </label>
                  <Textarea
                    id="summary"
                    name="summary"
                    value={blog.summary}
                    onChange={handleChange}
                    placeholder="Enter a brief summary"
                    rows={2}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="content" className="text-sm font-medium">
                    Blog Content
                  </label>
                  <ReactQuill
                    id="content"
                    value={blog.content}
                    onChange={value => setBlog(prev => ({ ...prev, content: value }))}
                    placeholder="Write your blog content here"
                    theme="snow"
                    style={{ minHeight: 200 }}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="meta_title" className="text-sm font-medium">
                    Meta Title
                  </label>
                  <Input
                    id="meta_title"
                    name="meta_title"
                    value={blog.meta_title}
                    onChange={handleChange}
                    placeholder="Enter meta title"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="meta_description" className="text-sm font-medium">
                    Meta Description
                  </label>
                  <Textarea
                    id="meta_description"
                    name="meta_description"
                    value={blog.meta_description}
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
                    value={blog.meta_keywords}
                    onChange={handleChange}
                    placeholder="Enter meta keywords"
                  />
                </div>
              </div>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => navigate("/blogs")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || imageUploading} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : isEdit ? (
                    "Update Blog"
                  ) : (
                    "Save Blog"
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
    </div>
  );
};

const BlogFormSkeleton = () => (
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

export default BlogForm;
