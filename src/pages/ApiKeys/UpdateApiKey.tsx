import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { fetchViatorKey, updateViatorApiKey } from "@/lib/api";

const UpdateViatorApiKey = () => {
  // We assume there's only one API key to update.
  const [apiKey, setApiKey] = useState({ id: "", key: "" });
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const handleFetchKey = async () => {
    setFetching(true);
    try {
      const data = await fetchViatorKey();
      console.log("Fetched API Key:", data);
      setApiKey(data.data);
      setNewKey(data.key || "");
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

  // Initially fetch the API key on mount.
  useEffect(() => {
    handleFetchKey();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.id || !newKey) {
      toast.warning("Missing API key ID or new key value.");
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
      setApiKey((prev) => ({ ...prev, key: newKey }));
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
    <Card className="max-w-md mx-auto mt-10 shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Update Viator API Key</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              API Key ID
            </label>
            <Input value={apiKey.name} readOnly placeholder="API Key ID" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Existing API Key Value
            </label>
            <Input value={apiKey.key} readOnly placeholder="Current API Key" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              New API Key Value
            </label>
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Enter new API key value"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Updating..." : "Update API Key"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleFetchKey}
            disabled={fetching}
            className="w-full mt-2"
          >
            {fetching ? "Refreshing..." : "Refresh API Key"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UpdateViatorApiKey;