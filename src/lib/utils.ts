import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function showApiErrorToast(error: any, fallback = "Something went wrong") {
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    toast.error("You are not authorized as admin");
    return;
  }
  if (error?.response?.data?.errors) {
    const errors = error.response.data.errors;
    Object.values(errors).forEach((errArr: any) => {
      if (Array.isArray(errArr)) {
        errArr.forEach((msg: string) => toast.error(msg));
      } else if (typeof errArr === "string") {
        toast.error(errArr);
      }
    });
    return;
  }
  if (error?.response?.data?.message) {
    toast.error(error.response.data.message);
    return;
  }
  toast.error(fallback);
}

export function getUserRoles(): string[] {
  try {
    const userStr = localStorage.getItem('duser');
    if (!userStr) return [];
    const userObj = JSON.parse(userStr);
    if (userObj.roles && Array.isArray(userObj.roles)) {
      return userObj.roles;
    }
    // fallback: try user.roles[0].name if roles is an array of objects
    if (userObj.user && userObj.user.roles && Array.isArray(userObj.user.roles)) {
      return userObj.user.roles.map((r: any) => r.name);
    }
    return [];
  } catch {
    return [];
  }
}
