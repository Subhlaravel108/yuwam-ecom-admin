import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { fetchViatorKey, updateViatorApiKey } from "@/lib/api";
import dayjs from "dayjs";

const UpdateViatorApiKey = () => {
  const [apiKey, setApiKey] = useState({
    id: "",
    key: "",
    name: "viator",
    created_at: "",
    updated_at: "",
    description: "",
  });
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const handleFetchKey = async () => {
    setFetching(true);
    try {
      const { data } = await fetchViatorKey();
      setApiKey({
        ...data,
        name: "viator",
        key: data.key?.trim() || "",
        created_at: data.created_at || "",
        updated_at: data.updated_at || "",
        description: data.description || "",
      });
    //   setNewKey(data.key?.trim() || "");
      Swal.fire({
        icon: "success",
        title: "Fetched",
        text: "Existing Viator API key fetched successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to fetch API key",
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    handleFetchKey();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.id || !newKey) {
      toast.warning("Missing API key or new value.");
      return;
    }

    const confirm = await Swal.fire({
      title: "Update API Key",
      text: "Are you sure you want to update the Viator API key?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, update it!",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      await updateViatorApiKey(apiKey.id, newKey);
      Swal.fire({
        icon: "success",
        title: "API Key Updated",
        text: "Viator API key updated successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
      setApiKey((prev) => ({ ...prev, key: newKey, updated_at: new Date().toISOString() }));
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to update API key",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto mt-10 shadow-lg border border-gray-200">
      <CardHeader className="bg-gray-50 px-6 py-4">
        <CardTitle className="text-2xl font-semibold text-center">
          🔐 Update Viator API Key
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-4 space-y-5">
        <form onSubmit={handleUpdate} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Key Name</label>
            <Input value={apiKey.name} readOnly />
          </div>

          {apiKey.description && (
            <div className="text-sm text-gray-500 italic">
              Description: {apiKey.description}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Current API Key</label>
            <Input value={apiKey.key} readOnly />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">New API Key</label>
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Enter new API key"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" disabled={loading} className="w-full sm:w-1/2">
              {loading ? "Updating..." : "Update API Key"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleFetchKey}
              disabled={fetching}
              className="w-full sm:w-1/2"
            >
              {fetching ? "Refreshing..." : "Refresh Key"}
            </Button>
          </div>

         
        </form>
      </CardContent>
    </Card>
  );
};

export default UpdateViatorApiKey;
