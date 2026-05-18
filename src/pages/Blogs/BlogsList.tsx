import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Plus, Search, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';
import { fetchBlogs, deleteBlog } from "@/lib/api";
import Swal from "sweetalert2";

const BlogsSkeleton = () => (
  <div className="p-4 space-y-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4 animate-pulse">
        <div className="h-8 w-10 bg-gray-200 rounded" />
        <div className="h-8 w-[600px] bg-gray-200 rounded" />
        <div className="h-8 w-24 bg-gray-200 rounded" />
        <div className="h-8 w-24 bg-gray-200 rounded" />
        <div className="h-8 w-20 bg-gray-200 rounded" />
        <div className="h-8 w-16 bg-gray-200 rounded" />
        <div className="h-8 w-20 bg-gray-200 rounded ml-auto" />
      </div>
    ))}
  </div>
);

const BlogsList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetchBlogs({ page, search: searchQuery });
      const root = res as Record<string, unknown>;
      const inner = root?.data as Record<string, unknown> | unknown[] | undefined;
      let list: unknown[] = [];
      let lastPage = 1;
      let totalCount = 0;
      let pageSize = 10;

      // Laravel-style: { data: { data: [...], last_page, total, per_page } } and/or last_page on root
      if (inner && typeof inner === "object" && !Array.isArray(inner) && Array.isArray((inner as { data?: unknown[] }).data)) {
        const p = inner as { data: unknown[]; last_page?: number; total?: number; per_page?: number };
        list = p.data;
        lastPage = p.last_page ?? (root.last_page as number) ?? 1;
        totalCount = Number(p.total) || Number(root.total) || 0;
        pageSize = Number(p.per_page) || Number(root.per_page) || 10;
      } else if (inner && typeof inner === "object" && !Array.isArray(inner) && "last_page" in inner) {
        const p = inner as { data?: unknown[]; last_page?: number; total?: number; per_page?: number };
        list = Array.isArray(p.data) ? p.data : [];
        lastPage = p.last_page ?? (root.last_page as number) ?? 1;
        totalCount = Number(p.total) || Number(root.total) || 0;
        pageSize = Number(p.per_page) || Number(root.per_page) || 10;
      } else if (Array.isArray(inner)) {
        // Top-level paginator: { data: [...], last_page, ... } on same object as array
        list = inner;
        lastPage = (root.last_page as number) ?? 1;
        totalCount = Number(root.total) || inner.length;
        pageSize = Number(root.per_page) || 10;
      } else if (Array.isArray(root.data)) {
        list = root.data as unknown[];
        lastPage = (root.last_page as number) ?? 1;
        totalCount = Number(root.total) || list.length;
        pageSize = Number(root.per_page) || 10;
      }

      setBlogs(list as never[]);
      setTotalPages(Math.max(1, lastPage));
      setTotal(totalCount);
      setPerPage(pageSize || 10);
    } catch (e) {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
    // eslint-disable-next-line
  }, [page, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleDeleteBlog = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await deleteBlog(id);
        // const res=await api.delete("/")
        // setBlogs(blogs.filter((blog: any) => blog.slug !== slug));
        toast.success("Blog post deleted successfully");
        loadBlogs()
      } catch (e) {
        toast.error("Failed to delete blog");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
        <Button asChild>
          <Link to="/blogs/add">
            <Plus className="mr-2 h-4 w-4" />
            Add New Blog
          </Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center mb-4">
          <Search className="w-5 h-5 text-gray-500 mr-2" />
          <Input
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={handleSearch}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border min-h-[200px]">
          {loading ? (
            <BlogsSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Title</TableHead>
                  {/* <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead> */}
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No blogs found. Try a different search term or create a new blog.
                    </TableCell>
                  </TableRow>
                ) : (
                  blogs.map((blog: any) => (
                    <TableRow key={blog.id}>
                      <TableCell className="font-medium">{blog.id}</TableCell>
                      <TableCell>{blog.title}</TableCell>
                      {/* <TableCell>{blog.author}</TableCell>
                      <TableCell>{blog.category}</TableCell> */}
                      <TableCell>
                        {blog.published_at
                          ? format(new Date(blog.published_at), 'MMM d, yyyy')
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            blog.status === 1
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {blog.status === 1 ? "Published" : "Draft"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="outline" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/blogs/edit/${blog.slug}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteBlog(blog.id)}>
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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
          <div className="text-sm text-muted-foreground">
            {total > 0 ? (
              <>
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {(page - 1) * perPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground">
                  {(page - 1) * perPage + blogs.length}
                </span>{" "}
                of <span className="font-semibold text-foreground">{total}</span> entries
              </>
            ) : blogs.length === 0 && !loading ? (
              "No entries"
            ) : (
              <>
                Page <span className="font-semibold text-foreground">{page}</span> of{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BlogsList;
