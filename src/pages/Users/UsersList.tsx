import React, { useEffect, useState } from "react";
import { fetchUsers, ChangeUserStatus } from "@/lib/api";
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
import { Button } from "@/components/ui/button";
import { Eye, Search } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Swal from "sweetalert2";

const UsersList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const data = await fetchUsers({ page, search: searchQuery });
        setUsers(data.data);
        setTotal(data.total);
        setLastPage(data.last_page);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [page, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (user.country?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  // Toggle user status (0 = inactive, 1 = active) with a Swal confirmation
  const handleChangeStatus = async (user: any) => {
    const newStatus = user.status === 1 ? 0 : 1;
    const result = await Swal.fire({
      title: "Change User Status",
      text: `Are you sure you want to set ${user.name}'s status to ${
        newStatus === 1 ? "Active" : "Inactive"
      }?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, change it!",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) {
      try {
        await ChangeUserStatus({ user_id: user.id, status: newStatus });
        Swal.fire({
          icon: "success",
          title: "Status Changed",
          text: `User status changed to ${
            newStatus === 1 ? "Active" : "Inactive"
          }`,
          timer: 1500,
          showConfirmButton: false,
        });
        // Update local state.
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error?.response?.data?.message || "Failed to change status",
        });
      }
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
      </div>

      <Card className="p-4 shadow-md">
        <div className="flex items-center mb-4">
          <Search className="w-5 h-5 text-gray-500 mr-2" />
          <Input
            placeholder="Search by name, email or country..."
            value={searchQuery}
            onChange={handleSearch}
            className="max-w-sm"
          />
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-2">User ID</TableHead>
                <TableHead className="px-4 py-2">Name</TableHead>
                <TableHead className="px-4 py-2">Email</TableHead>
                <TableHead className="px-4 py-2">Phone</TableHead>
                <TableHead className="px-4 py-2 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No users found. Try a different search term.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-4 py-2 font-medium">
                      {user.id}
                    </TableCell>
                    <TableCell className="px-4 py-2">{user.name}</TableCell>
                    <TableCell className="px-4 py-2">{user.email}</TableCell>
                    <TableCell className="px-4 py-2">{user.phone}</TableCell>
                    <TableCell className="px-4 py-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white shadow-lg border">
                          <DropdownMenuItem onClick={() => handleChangeStatus(user)}>
                            <span className="block w-full">
                              {user.status === 1 ? "Set Inactive" : "Set Active"}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setShowModal(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">User Details</h2>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Name:</span>{" "}
                {selectedUser.name || "-"}
              </div>
              <div>
                <span className="font-semibold">Email:</span>{" "}
                {selectedUser.email || "-"}
              </div>
              <div>
                <span className="font-semibold">Phone:</span>{" "}
                {selectedUser.phone || "-"}
              </div>
              <div>
                <span className="font-semibold">Country:</span>{" "}
                {selectedUser.country || "-"}
              </div>
              <div>
                <span className="font-semibold">Type:</span>{" "}
                {selectedUser.type || "-"}
              </div>
              <div>
                <span className="font-semibold">Created At:</span>{" "}
                {selectedUser.created_at
                  ? format(new Date(selectedUser.created_at), "MMM d, yyyy")
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
