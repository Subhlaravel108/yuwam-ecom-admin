import axios from "axios";

const api = axios.create({
  baseURL: "https://api.yuwam.jaipurschools.com/api/v1",
  // baseURL: "http://192.168.1.5:8000/api/v1",
});

export default api;

// Login Apis 
export const loginApi = async (email: string, password: string) => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("password", password);

  const response = await api.post("/login", formData);
  // console.log("Login response:", response.data);

  return response.data;
};

export const requestOtp = async (email: string) => {
  const formData = new FormData();
  formData.append("email", email);
  const response = await api.post("/request-otp", formData);
  return response.data;
};

export const verifyOtp = async (email: string, otp: string) => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("otp", otp);
  const response = await api.post("/verify-otp", formData);
  return response.data;
};

export const resetPassword = async (email: string, otp: string, password: string, password_confirmation: string) => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("otp", otp);
  formData.append("password", password);
  formData.append("password_confirmation", password_confirmation);
  const response = await api.post("/reset-password", formData);
  return response.data;
};

export const uploadTourImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const res = await api.post(
    "/i/upload-image",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log('test image ', res.data);
  return res.data.url || res.data.path || res.data.data?.url;
};


export const changePassword = async (payload: {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  // Using FormData so that the request mimics the provided curl command
  const formData = new FormData();
  formData.append("current_password", payload.current_password);
  formData.append("new_password", payload.new_password);
  formData.append("new_password_confirmation", payload.new_password_confirmation);

  const response = await api.post("/change-password", formData, {
    headers: {
      Authorization: `Bearer ${token}`
    },
  });
  return response.data;
};
// End of Login Apis

//User Apis
export const fetchUsers = async ({ page = 1, search = "" } = {}) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  let url = `/users-list?page=${page}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  const res = await api.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};

export const ChangeUserStatus = async (payload: any) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.post(
    "/user/status",
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
    }
  );
  return response.data;
};

//End of User Apis

// Category APIs

export const categoryFetchList = async ({ page = 1, search = "" } = {}) => {
  const token =
    JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";

  const response = await api.get(`/category/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      page,
      name: search || undefined, // will exclude `name` if search is empty
    },
  });

  return response.data;
};

export const fetchAllCategories = async () => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const res = await api.get("/category/list?per_page=1000", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const categoryCreate = async (payload: any) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.post(
    "/category/create",
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
    }
  );
  return response.data;
};

export const fetchCategory = async (slugOrId: string) => {
  const token =
    JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";

  const response = await api.get(`/category/${slugOrId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};


export const updateCategory = async (id: string, payload: any) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.put(
    `/category/update/${id}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
    }
  );
  return response.data;
}

export const deleteCategory = async (id: string) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.delete(
    `/category/delete/${id}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

//end of Category APIs

// other APIs

export const fetchBlogs = async ({ page = 1, search = "" } = {}) => {
  const params = new URLSearchParams();
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  params.append("page", String(page));
  if (search) params.append("title", search);
  // console.log("Fetching blogs with params:", params.toString());
  const response = await api.get(`/k/blogs?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const fetchBlog = async (slugOrId: string) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.get(`/k/blogs/${slugOrId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createBlog = async (payload: any) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.post(
    "/k/blogs/create",
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
    }
  );
  return response.data;
};

export const updateBlog = async (id: string, payload: any) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  console.log("Updating blog with ID:", id, "and payload:", payload);
  const response = await api.put(
    `/k/blogs/update/${id}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
    }
  );
  return response.data;
};

export const deleteBlog = async (id: string) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  console.log("token=", token)
  const response = await api.delete(
    `/k/blogs/delete/${id}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const fetchDashboardStats = async () => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const res = await api.get("/dashboard/stats", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};


export const fetchApiKey = async (id: string) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.get(`/viatorkeylist/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return response.data;
};

export const fetchViatorKey = async () => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.get("/api-key/list", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  // Assuming the API returns an array; adjust if needed.
  return response.data; // Returns the first API key object.
};

export const updateViatorApiKey = async (id: string, key: string) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.put(
    `/api-key/update/${id}`,
    { key },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

//end of other APIs

// Product APIs

export const fetchProducts = async ({ page = 1, search = "" } = {}) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.get("/products", {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      page,
      name: search || undefined, // will exclude 'search' if empty
    },
  });
  return response.data;
};

export const fetchProduct = async (id: string) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.get(`/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createProduct = async (payload: any) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.post("/products/create", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": payload instanceof FormData ? "multipart/form-data" : "application/json"
    }
  });
  return response.data;
};

export const updateProduct = async (id: string, payload: any) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";

  // Laravel workaround for PUT/PATCH with multipart/form-data
  let finalPayload = payload;
  let method = "put";
  if (payload instanceof FormData) {
    payload.append("_method", "PUT");
    finalPayload = payload;
    method = "post"; // Use POST with _method=PUT
  }

  const response = await api({
    method: method,
    url: `/products/update/${id}`,
    data: finalPayload,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": payload instanceof FormData ? "multipart/form-data" : "application/json"
    }
  });
  
  return response.data;
};

export const deleteProduct = async (id: string) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.delete(`/products/delete/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
// Product APIs End

// Order APIs

export const fetchOrders = async ({ page = 1, search = "" } = {}) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.get("/k/orders", {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      page,
      search: search || undefined, // will exclude 'search' if empty
    },
  });
  return response.data;
};

export const fetchOrder = async (id: string) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.get(`/k/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};



export const deleteOrder = async (id: string) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.delete(`/k/orders/delete/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// chaneg order status
export const changeOrderStatus = async (id: string, payload: any) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.put(`/k/orders/${id}/status`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// update order tracking details
export const updateOrderTracking = async (id: string, payload: {
  courier_name: string;
  tracking_number: string;
  tracking_url: string;
}) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.put(`/k/orders/${id}/tracking`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// download order invoice
export const downloadOrderInvoice = async (id: string) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.get(`/k/orders/${id}/invoice`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/pdf, application/json'
    },
    responseType: 'blob'
  });
  console.log('response', response);
  // Check if response is actually a PDF
  const contentType = response.headers['content-type'];
  if (contentType && contentType.includes('application/json')) {
    // If it's JSON, it's probably an error message
    const text = await response.data.text();
    const error = JSON.parse(text);
    throw new Error(error.message || 'Failed to generate invoice');
  }

  return response.data;
};

// update order items packing status
export const updateOrderItemsPacking = async (orderId: string, payload: {
  items: Array<{
    order_item_id: number;
    stock_status: 'available' | 'partial' | 'unavailable';
    packed_quantity: number;
    admin_note?: string;
  }>;
}) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.post(`/k/orders/${orderId}/items/update-packing`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};


// Schedule/Report APIs
export const fetchScheduleList = async ({ page = 1, type = "", command = "" } = {}) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.get("/k/schedule/list", {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      page,
      type: type || undefined,
      command: command || undefined,
    },
  });
  return response.data;
};

export const createScheduleRequest = async (payload: {
  command: string;
  type: string;
  arguments?: any[];
}) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.post("/k/schedule/create", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Order APIs End

// Coupon APIs

export const fetchCoupons = async ({ page = 1, search = "" } = {}) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.get("/k/coupons", {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      page,
      search: search || undefined, // will exclude 'search' if empty
    },
  });
  return response.data;
};

export const fetchCoupon = async (id: string) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.get(`/k/coupons/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
export const createCoupon = async (payload: any) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.post("/k/coupons/create", payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateCoupon = async (id: string, payload: any) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.put(`/k/coupons/update/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteCoupon = async (id: string) => {
  const token = JSON.parse(localStorage.getItem("duser") || "{}")?.access_token || "";
  const response = await api.delete(`/k/coupons/delete/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Coupon APIs End

