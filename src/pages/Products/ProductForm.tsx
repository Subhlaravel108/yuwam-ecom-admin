import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ImageUploader } from "@/components/ui/imageUploader";
import { toast } from "sonner";
import { fetchProduct, createProduct, updateProduct, fetchAllCategories } from "@/lib/api";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const steps = [
  "Title & Meta",
  "Images",
  "Price",
  "Attributes",
  "Review & Submit",
];

const initialProduct = {
  id: null,
  name: "",
  description: "",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  featured_image: "",
  gallery_images: [] as string[],
  price: "",
  discount_price: "",
  currency: "INR",
  stock: "",
  attributes: [] as { name: string; value: string }[],
  status: "1",
  category_id: "",
  product_type: "physical",
  ebook_pages: "",
  ebook_file: null as File | null,
  display_home: false,
  sort_order: "",
};

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [step, setStep] = useState(0);
  const [product, setProduct] = useState(initialProduct);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [inputAttr, setInputAttr] = useState({ name: "", value: "" });
  const [categories, setCategories] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const getCategoryName = (categoryId: string) => {
    const c = (Array.isArray(categories) ? categories : []).find(
      (cat) => String(cat.id) === String(categoryId)
    );
    return c?.name || "—";
  };

  const plainDescriptionPreview = (html: string) => {
    if (!html || !html.replace(/<[^>]*>/g, "").trim()) return "—";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const text = (tmp.textContent || tmp.innerText || "").trim();
    if (text.length > 400) return text.slice(0, 400) + "…";
    return text || "—";
  };

  const formatApiError = (err: any): string => {
    const data = err?.response?.data;
    if (!data) return err?.message || "Failed to save product.";
    if (typeof data.message === "string" && data.message) return data.message;
    if (data.message && typeof data.message === "object") {
      try {
        return Object.entries(data.message)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
          .join("\n");
      } catch {
        return String(data.message);
      }
    }
    if (data.errors && typeof data.errors === "object") {
      return Object.entries(data.errors)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
        .join("\n");
    }
    if (typeof data === "string") return data;
    return "Failed to save product.";
  };

  // Fetch categories
  useEffect(() => {
    setCatLoading(true);
    fetchAllCategories()
      .then((res) => {
        const cats = Array.isArray(res) ? res : Array.isArray(res?.data?.data) ? res.data.data : [];
        setCategories(cats);
        setCatError("");
      })
      .catch((err) => {
        console.log("error in fetch categories", err);
        setCategories([]);
        setCatError("Failed to load categories");
        toast.error("Failed to load categories");
      })
      .finally(() => setCatLoading(false));
  }, []);

  // Fetch product data for editing
  useEffect(() => {
    if (isEdit && id) {
      setIsLoading(true);
      fetchProduct(id)
        .then((data) => {
          const prod = data.data || data;
          console.log("fetched product", prod);
          // Map attributes to {name, value}
          const attributes = Array.isArray(prod.attributes)
            ? prod.attributes.map((attr: any) => ({
                name: attr.attribute_name,
                value: attr.attribute_value,
              }))
            : [];
          // Map images to gallery_images and featured_image
          let featured_image = "";
          let gallery_images: string[] = [];
          if (Array.isArray(prod.images)) {
            prod.images.forEach((img: any) => {
              if (img.is_primary) {
                featured_image = img.image_url;
              } else {
                gallery_images.push(img.image_url);
              }
            });
          }
          setProduct({
            ...initialProduct,
            ...prod,
            featured_image: prod.featured_image || featured_image,
            gallery_images,
            attributes,
            category_id: prod.category_id ? String(prod.category_id) : "",
          });
        })
        .catch(() => {
          toast.error("Failed to fetch product data.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, isEdit]);

  // Warn on browser/tab close if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  // Step validation
  const validateStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (step === 0) {
      if (!product.name) newErrors.name = "Title is required";
      if (!product.category_id) newErrors.category_id = "Category is required";
    }
    // if (step === 1) {
    //   if (!product.featured_image.length) newErrors.featured_image = "At least one image is required";
    // }
    if (step === 2) {
      if (!product.price) newErrors.price = "Price is required";
      if(!product.stock) newErrors.stock = "Stock is required";
      if (product.product_type === "digital") {
        if (!product.ebook_pages) newErrors.ebook_pages = "E-book pages count is required";
        if (!isEdit && !product.ebook_file) newErrors.ebook_file = "E-book file is required";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEntireForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!product.name) newErrors.name = "Title is required";
    if (!product.category_id) newErrors.category_id = "Category is required";
    if (!product.price) newErrors.price = "Price is required";
   
    if (product.product_type === "digital") {
      if (!product.ebook_pages) newErrors.ebook_pages = "E-book pages count is required";
      if (!isEdit && !product.ebook_file) newErrors.ebook_file = "E-book file is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step navigation
  const nextStep = () => {
    if (validateStep()) {
      setSubmitError(null);
      setStep((s) => s + 1);
    }
  };
  const prevStep = () => {
    setSubmitError(null);
    setStep((s) => s - 1);
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setDirty(true);
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setProduct((prev) => ({ ...prev, category_id: value }));
    setErrors((prev) => ({ ...prev, category_id: "" }));
    setDirty(true);
  };

  // Handle attribute add/remove
  const handleAddAttribute = () => {
    if (inputAttr.name && inputAttr.value) {
      setProduct((prev) => ({
        ...prev,
        attributes: [...prev.attributes, { ...inputAttr }],
      }));
      setInputAttr({ name: "", value: "" });
      setDirty(true);
      toast.success("Attribute added");
    } else {
      toast.error("Both name and value are required for attributes");
    }
  };
  const handleRemoveAttribute = (idx: number) => {
    setProduct((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== idx),
    }));
    setDirty(true);
    toast.info("Attribute removed");
  };

  // Handle image changes
  const handleFeaturedImageChange = (img: string) => {
    setProduct((prev) => ({ ...prev, featured_image: img }));
    setDirty(true);
  };
  const handleGalleryImagesChange = (imgs: string[] | string) => {
    setProduct((prev) => ({ ...prev, gallery_images: imgs as string[] }));
    setDirty(true);
  };

  // Custom back handler with confirmation
  const handleBack = () => {
    if (dirty) {
      setShowConfirmDialog(true);
    } else {
      navigate(-1);
    }
  };
  const handleConfirmLeave = () => {
    setShowConfirmDialog(false);
    navigate(-1);
  };
  const handleCancelLeave = () => {
    setShowConfirmDialog(false);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < steps.length - 1) return;
    if (!validateEntireForm()) {
      toast.error("Please fix the highlighted issues. Use Back to go to the right step.");
      return;
    }
    setSubmitError(null);
    setIsLoading(true);
    try {
      const formData = new FormData();

      // Basic fields
      formData.append("name", product.name);
      formData.append("description", product.description ?? "");
      formData.append("meta_title", product.meta_title ?? "");
      formData.append("meta_description", product.meta_description ?? "");
      formData.append("meta_keywords", product.meta_keywords ?? "");
      formData.append("category_id", product.category_id ?? "");
      formData.append("status", String(product.status ?? "1"));

      // Pricing & stock
      formData.append("price", product.price ?? "");
      if (product.discount_price !== "" && product.discount_price != null) {
        formData.append("discount_price", String(product.discount_price));
      }
      formData.append("currency", product.currency ?? "INR");
      formData.append("stock", product.stock ?? "");

      // Display options
      formData.append("product_type", product.product_type ?? "physical");
      formData.append("display_home", product.display_home ? "1" : "0");
      if (product.sort_order !== "" && product.sort_order != null) {
        formData.append("sort_order", String(product.sort_order));
      }

      // Digital (e-book) fields
      if (product.product_type === "digital") {
        formData.append("ebook_pages", product.ebook_pages ?? "");
        if (product.ebook_file instanceof File) {
          formData.append("ebook_file", product.ebook_file);
        }
      }

      // Images (URLs returned by ImageUploader)
      if (product.featured_image) {
        formData.append("featured_image", product.featured_image);
      }
      (product.gallery_images || []).forEach((url, idx) => {
        formData.append(`gallery_images[${idx}]`, url);
      });

      // Attributes
      (product.attributes || []).forEach((attr, idx) => {
        formData.append(`attributes[${idx}][name]`, attr.name);
        formData.append(`attributes[${idx}][value]`, attr.value);
      });

      if (isEdit && product.id) {
        await updateProduct(product.id, formData);
        toast.success("Product updated successfully!", {
          closeButton: true,
        });
      } else {
        await createProduct(formData);
        toast.success("Product created successfully!", {
          closeButton: true,
        });
      }
      setTimeout(() => navigate("/products"), 800);
    } catch (error: any) {
      console.log("error in upload product", error);
      const msg = formatApiError(error);
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Stepper UI
  const Stepper = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, idx) => (
        <div key={label} className="flex-1 flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
              ${idx === step ? "bg-blue-600 text-white" : idx < step ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-400"}
            `}
          >
            {idx + 1}
          </div>
          <span className={`text-xs mt-2 ${idx === step ? "text-blue-700 font-semibold" : "text-gray-500"}`}>{label}</span>
          {idx < steps.length - 1 && (
            <div className={`h-1 w-full ${idx < step ? "bg-blue-400" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
 
  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{step === steps.length - 1 ? "Review & Submit" : isEdit ? "Edit Product" : "Add Product"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Stepper />
          {isLoading ? (
            <div className="text-center py-12">Saving, please wait...</div>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                {/* Step 1: Title & Meta */}
                {step === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium">Title *</label>
                      <Input name="name" value={product.name} onChange={handleChange} disabled={isLoading} />
                      {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>
                    
                   
                    
                    <div>
                      <label className="font-medium">Meta Title</label>
                      <Input name="meta_title" value={product.meta_title} onChange={handleChange} disabled={isLoading} />
                    </div>
                    <div>
                      <label className="font-medium">Meta Description</label>
                      <Textarea name="meta_description" value={product.meta_description} onChange={handleChange} disabled={isLoading} />
                      
                    </div>
                    <div>
                      <label className="font-medium">Meta Keywords</label>
                      <Input name="meta_keywords" value={product.meta_keywords} onChange={handleChange} disabled={isLoading} />
                    </div>
                    <div>
                      <label className="font-medium">Product Type *</label>
                      <Select
                        value={product.product_type}
                        onValueChange={(value) => setProduct((prev) => ({ ...prev, product_type: value }))}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="physical">Physical</SelectItem>
                          <SelectItem value="digital">Digital (E-book)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="font-medium">Category *</label>
                      {catLoading ? (
                        <div className="text-sm text-gray-500">Loading categories...</div>
                      ) : catError ? (
                        <div className="text-sm text-red-500">{catError}</div>
                      ) : (
                        <Select
                          value={product.category_id || ""}
                          onValueChange={handleCategoryChange}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {(Array.isArray(categories) ? categories : []).map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {errors.category_id && <p className="text-xs text-red-500">{errors.category_id}</p>}
                    </div>

                    <div>
                      <label className="font-medium">Display on Home</label>
                      <Select
                        value={String(product.display_home ?? false)}
                        onValueChange={(value) => {
                          setProduct((prev) => ({ ...prev, display_home: value === "true" })); // Convert to boolean
                          setDirty(true);
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="font-medium">Sort Order</label>
                      <Input
                        name="sort_order"
                        type="number"
                        value={product.sort_order}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="e.g. 1, 2, 3"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="font-medium">Description</label>
                      {/* <Textarea name="description" value={product.description} onChange={handleChange} disabled={isLoading} /> */}

                        <ReactQuill
                                          id="description"
                                          value={product.description}
                                          onChange={value => setProduct(prev => ({ ...prev, description: value }))}
                                          placeholder="Write your product description here"
                                          theme="snow"
                                          style={{ minHeight: 200 }}
                                        />
                    </div>
                  </div>
                  
                )}

                {/* Step 2: Images */}
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <ImageUploader
                        label="Featured Image *"
                        value={product.featured_image}
                        onChange={handleFeaturedImageChange}
                      />
                      {errors.featured_image && <p className="text-xs text-red-500">{errors.featured_image}</p>}
                    </div>
                    <div>
                      <ImageUploader
                        label="Gallery Images"
                        value={product.gallery_images}
                        onChange={handleGalleryImagesChange}
                        multiple
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Price */}
                {step === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium">Price *</label>
                      <Input name="price" type="number" value={product.price} onChange={handleChange} disabled={isLoading} />
                      {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
                    </div>
                    <div>
                      <label className="font-medium">Currency</label>
                      <Input name="currency" value={product.currency} onChange={handleChange} disabled={isLoading} />
                    </div>
                    <div>
                      <label className="font-medium">Stock</label>
                      <Input name="stock" type="number" value={product.stock} onChange={handleChange} disabled={isLoading} />
                      {errors.stock && <p className="text-xs text-red-500">{errors.stock}</p> }
                    </div>
                    <div>
                      <label className="font-medium">Discounted price</label>
                      <Input name="discount_price" type="number" value={product.discount_price} onChange={handleChange} disabled={isLoading} />
                    </div>

                    {product.product_type === "digital" && (
                      <>
                        <div>
                          <label className="font-medium">E-book Pages *</label>
                          <Input
                            name="ebook_pages"
                            type="number"
                            value={product.ebook_pages}
                            onChange={handleChange}
                            disabled={isLoading}
                            placeholder="e.g. 1000"
                          />
                          {errors.ebook_pages && <p className="text-xs text-red-500">{errors.ebook_pages}</p>}
                        </div>
                        <div>
                          <label className="font-medium">E-book File (PDF) {isEdit ? "(Optional)" : "*"}</label>
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setProduct((prev) => ({ ...prev, ebook_file: file }));
                                setDirty(true);
                              }
                            }}
                            disabled={isLoading}
                          />
                          {errors.ebook_file && <p className="text-xs text-red-500">{errors.ebook_file}</p>}
                          {isEdit && <p className="text-xs text-gray-500 mt-1 italic">Leave empty to keep existing file.</p>}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Step 4: Attributes */}
                {step === 3 && (
                  <div>
                    <label className="font-medium">Product Attributes</label>
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="Attribute Name"
                        value={inputAttr.name}
                        onChange={e => setInputAttr(attr => ({ ...attr, name: e.target.value }))}
                        disabled={isLoading}
                      />
                      <Input
                        placeholder="Attribute Value"
                        value={inputAttr.value}
                        onChange={e => setInputAttr(attr => ({ ...attr, value: e.target.value }))}
                        disabled={isLoading}
                      />
                      <Button type="button" onClick={handleAddAttribute} disabled={isLoading}>Add</Button>
                    </div>
                    {product.attributes.length > 0 && (
                      <ul className="mb-4">
                        {product.attributes.map((attr, idx) => (
                          <li key={idx} className="flex items-center gap-2 mb-2">
                            <span className="flex-1">{attr.name}: {attr.value}</span>
                            <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveAttribute(idx)} disabled={isLoading}>Remove</Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Step 5: Review & Submit — readable summary + API/validation errors */}
                {step === 4 && (
                  <div className="space-y-6">
                    <h3 className="font-semibold text-lg text-gray-900">Summary</h3>
                    {submitError && (
                      <div
                        className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 whitespace-pre-wrap"
                        role="alert"
                      >
                        <p className="font-medium mb-1">Server error</p>
                        {submitError}
                      </div>
                    )}
                    {Object.keys(errors).length > 0 && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <p className="font-medium mb-1">Please fix the following</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {Object.entries(errors)
                            .filter(([, v]) => v)
                            .map(([k, v]) => (
                              <li key={k}>
                                <span className="font-medium">{k}:</span> {v}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                    <div className="grid gap-3 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Title</span>
                        <span className="sm:col-span-2 font-medium text-gray-900 break-words">{product.name || "—"}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Category</span>
                        <span className="sm:col-span-2 font-medium text-gray-900">{getCategoryName(product.category_id)}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Product type</span>
                        <span className="sm:col-span-2 font-medium text-gray-900">
                          {product.product_type === "digital" ? "Digital (E-book)" : "Physical"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Description</span>
                        <span className="sm:col-span-2 text-gray-800 break-words">{plainDescriptionPreview(product.description)}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Meta</span>
                        <div className="sm:col-span-2 space-y-1">
                          <p><span className="text-gray-500">Title: </span>{product.meta_title || "—"}</p>
                          <p><span className="text-gray-500">Description: </span>{product.meta_description || "—"}</p>
                          <p><span className="text-gray-500">Keywords: </span>{product.meta_keywords || "—"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Featured image</span>
                        <span className="sm:col-span-2 break-all text-blue-700">
                          {product.featured_image ? (
                            <img src={product?.featured_image} alt="Featured" className="max-h-32 object-contain border" />
                          ) : (
                            "—"
                          )}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Gallery</span>
                        <div className="sm:col-span-2 space-y-1">
                          {product.gallery_images.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {product.gallery_images.map((url, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                  <img src={url} alt={`Gallery ${i + 1}`} className="max-h-32 object-contain border" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Price & stock</span>
                        <div className="sm:col-span-2">
                          {product.price || "—"} {product.currency}
                          {product.discount_price ? ` (discount: ${product.discount_price})` : ""} · Stock: {product.stock || "0"}
                        </div>
                      </div>
                      {product.product_type === "digital" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 border-b border-gray-100 pb-2">
                          <span className="text-gray-500">E-book</span>
                          <div className="sm:col-span-2">
                            <p>Pages: {product.ebook_pages || "—"}</p>
                            <p>
                              File:{" "}
                              {product.ebook_file
                                ? (product.ebook_file as File).name
                                : isEdit
                                  ? "Not replaced (optional)"
                                  : "—"}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Attributes</span>
                        <div className="sm:col-span-2">
                          {product.attributes.length > 0 ? (
                            <ul className="space-y-1">
                              {product.attributes.map((attr, idx) => (
                                <li key={idx}>
                                  <span className="font-medium">{attr.name}:</span> {attr.value}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            "—"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  {step > 0 && (
                    <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  )}
                  {step === 0 ? (
                    <Button  type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  ) : null}
                  {step < steps.length - 1 ? (
                    <Button key="next-step-button" type="button" onClick={nextStep} disabled={isLoading}>
                      Next
                    </Button>
                  ) : (
                    <Button key="submit-button" type="submit" disabled={isLoading}>
                      {isLoading ? "Saving..." : "Submit"}
                    </Button>
                  )}
                </div>
              </form>
              <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Unsaved Changes</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">You have unsaved changes. Are you sure you want to leave?</div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCancelLeave}>Cancel</Button>
                    <Button variant="destructive" onClick={handleConfirmLeave}>Leave Page</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;
