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
  currency: "INR",
  stock: "",
  attributes: [] as { name: string; value: string }[],
  status: "1",
  category_id: "",
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
    }
    setErrors(newErrors);
    // if (Object.keys(newErrors).length > 0) {
    //   toast.error("Please fix the errors before proceeding.");
    // }
    return Object.keys(newErrors).length === 0;
  };

  // Step navigation
  const nextStep = () => {
    if (validateStep()) setStep((s) => s + 1);
  };
  const prevStep = () => setStep((s) => s - 1);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
    setDirty(true);
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setProduct((prev) => ({ ...prev, category_id: value }));
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
    if (!validateStep()) return;
    setIsLoading(true);
    try {
      const payload = { ...product, category_id: product.category_id };
      console.log("payload to save", payload);
      if (isEdit && product.id) {
        await updateProduct(product.id, payload);
        toast.success("Product updated successfully!", {
          closeButton: true,
        });
      } else {
        await createProduct(payload);
        toast.success("Product created successfully!", {
          closeButton: true,
        });
      }
      setTimeout(() => navigate("/products"), 800);
    } catch (error: any) {
      console.log("error in upload product", error);
      toast.error(error?.response?.data?.message || "Failed to save product.");
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
                    </div>
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

                {/* Step 5: Review & Submit */}
                {step === 4 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg mb-2">Review Your Product</h3>
                    <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">{JSON.stringify(product, null, 2)}</pre>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  {step > 0 && (
                    <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  )}
                  {step === 0 ? (
                    <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  ) : null}
                  {step < steps.length - 1 ? (
                    <Button type="button" onClick={nextStep} disabled={isLoading}>
                      Next
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isLoading}>
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
