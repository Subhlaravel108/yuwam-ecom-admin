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
import { Edit, Eye, Plus, Search, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';
import api, { fetchCourses, deleteCourse } from "@/lib/api";
import Swal from "sweetalert2";

const CourseSkeleton = () => (
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

const CourseList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadCourses = async () => {
    setLoading(true);
    try {
      // console.log("Loading blogs for page:", page, "with search query:", searchQuery);
      const res = await fetchCourses({ page, search: searchQuery });
      // console.log("API response:", res);
      setCourses(res.data.data || []);
      setTotalPages(res.last_page || 1);
    } catch (e) {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line
  }, [page, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleDeleteCourse = async (id: string) => {
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
        await deleteCourse(id);
        
        toast.success("Course deleted successfully");
        loadCourses()
      } catch (e) {
        toast.error("Failed to delete course");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
        <Button asChild>
          <Link to="/course/add">
            <Plus className="mr-2 h-4 w-4" />
            Add New Course
          </Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center mb-4">
          <Search className="w-5 h-5 text-gray-500 mr-2" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={handleSearch}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border min-h-[200px]">
          {loading ? (
            <CourseSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Discounted Price</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No courses found. Try a different search term or create a new course.
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((course: any) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.id}</TableCell>
                      <TableCell>{course.title}</TableCell>
                      <TableCell>{course.duration}</TableCell>
                      <TableCell>{course.price}</TableCell>
                      <TableCell>{course.discounted_price}</TableCell>
                      <TableCell>
                        {course.created_at
                          ? format(new Date(course.created_at), 'MMM d, yyyy')
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            course.status === 1
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {course.status === 1 ? "Published" : "Draft"}
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
                              <Link to={`/course/edit/${course.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteCourse(course.id)}>
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
            Showing{" "}
            <span className="font-semibold">
              {courses.length === 0 ? 0 : (page - 1) * 10 + 1}{" "}
              to{" "}
              <span className="font-semibold">
                {page * 10 > totalPages * 10 ? totalPages * 10 : page * 10}
              </span>{" "}
              of{" "}
              <span className="font-semibold">{totalPages * 10}</span>{" "}
              entries
            </span>
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

export default CourseList;
