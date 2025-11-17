"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Trash2,
  Ban,
  ShieldAlert,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  isCreator: boolean;
  balance: number;
  streamsCount: number;
  messagesCount: number;
  moderationActionsCount: number;
  createdAt: string;
  lastLoginAt: string | null;
  banExpiresAt: string | null;
  suspendExpiresAt: string | null;
  banReason: string | null;
  suspendReason: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Dialogs
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    userId: string | null;
    userName: string | null;
  }>({ open: false, userId: null, userName: null });

  const [banDialog, setBanDialog] = useState<{
    open: boolean;
    userId: string | null;
    userName: string | null;
    action: "BAN" | "UNBAN" | "SUSPEND" | "ACTIVATE" | null;
  }>({ open: false, userId: null, userName: null, action: null });

  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<string>("7d"); // Default 7 days
  const [suspendDuration, setSuspendDuration] = useState<string>("3h"); // Default 3 hours
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append("search", search);
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const response = await fetch(`/api/users?${params.toString()}`);

      if (response.status === 403) {
        toast.error("Access denied. Insufficient permissions.");
        router.push("/dashboard");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search, roleFilter, statusFilter]);

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!deleteDialog.userId) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/users?userId=${deleteDialog.userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast.success("User deleted successfully");
      setDeleteDialog({ open: false, userId: null, userName: null });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle ban/unban/suspend/activate user
  const handleUserAction = async () => {
    if (!banDialog.userId || !banDialog.action) return;

    try {
      setActionLoading(true);

      // Calculate duration in seconds
      let durationInSeconds = null;

      if (banDialog.action === "BAN") {
        if (banDuration === "permanent") {
          durationInSeconds = null; // Permanent ban
        } else {
          const durationMap: Record<string, number> = {
            "7d": 7 * 24 * 60 * 60,      // 7 days
            "30d": 30 * 24 * 60 * 60,    // 1 month
            "180d": 180 * 24 * 60 * 60,  // 6 months
            "365d": 365 * 24 * 60 * 60,  // 1 year
          };
          durationInSeconds = durationMap[banDuration] || null;
        }
      } else if (banDialog.action === "SUSPEND") {
        const durationMap: Record<string, number> = {
          "1h": 60 * 60,        // 1 hour
          "3h": 3 * 60 * 60,    // 3 hours
          "6h": 6 * 60 * 60,    // 6 hours
          "12h": 12 * 60 * 60,  // 12 hours
        };
        durationInSeconds = durationMap[suspendDuration];
      }

      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: banDialog.userId,
          action: banDialog.action,
          reason: banReason,
          duration: durationInSeconds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      toast.success(`User ${banDialog.action.toLowerCase()}ned successfully`);
      setBanDialog({ open: false, userId: null, userName: null, action: null });
      setBanReason("");
      setBanDuration("7d");
      setSuspendDuration("3h");
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper function to format time remaining
  const formatTimeRemaining = (expiresAt: string | null): string => {
    if (!expiresAt) return "Permanent";

    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  // Get status badge color with time remaining
  const getStatusBadge = (user: User) => {
    const status = user.status;

    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-600/20 text-green-400 border-green-500/50">
            Active
          </Badge>
        );
      case "BANNED":
        const banTime = formatTimeRemaining(user.banExpiresAt);
        return (
          <div className="flex flex-col gap-1">
            <Badge className="bg-red-600/20 text-red-400 border-red-500/50">
              Banned
            </Badge>
            <span className="text-xs text-red-400">{banTime}</span>
          </div>
        );
      case "SUSPENDED":
        const suspendTime = formatTimeRemaining(user.suspendExpiresAt);
        return (
          <div className="flex flex-col gap-1">
            <Badge className="bg-orange-600/20 text-orange-400 border-orange-500/50">
              Suspended
            </Badge>
            <span className="text-xs text-orange-400">{suspendTime}</span>
          </div>
        );
      case "PENDING_VERIFICATION":
        return (
          <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/50">
            Pending
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get role badge color
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge className="bg-red-900/30 text-red-400 border-red-500/50">
            Admin
          </Badge>
        );
      case "MODERATOR":
        return (
          <Badge className="bg-orange-900/30 text-orange-400 border-orange-500/50">
            Moderator
          </Badge>
        );
      case "CREATOR":
        return (
          <Badge className="bg-purple-900/30 text-purple-400 border-purple-500/50">
            Creator
          </Badge>
        );
      case "VIEWER":
        return (
          <Badge className="bg-blue-900/30 text-blue-400 border-blue-500/50">
            Viewer
          </Badge>
        );
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-white">User Management</h1>
      <div className="space-y-6">
        {/* Description */}
        <p className="text-gray-400">
          Manage users, view their information, and perform moderation actions
        </p>

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="pl-10 bg-gray-900/50 border-gray-700"
                />
              </div>
            </div>

            {/* Role Filter */}
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <SelectTrigger className="bg-gray-900/50 border-gray-700">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
                <SelectItem value="CREATOR">Creator</SelectItem>
                <SelectItem value="MODERATOR">Moderator</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <SelectTrigger className="bg-gray-900/50 border-gray-700">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="BANNED">Banned</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="PENDING_VERIFICATION">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No users found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-700/50">
                      <TableHead className="text-gray-300">User</TableHead>
                      <TableHead className="text-gray-300">Role</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Balance</TableHead>
                      <TableHead className="text-gray-300">Streams</TableHead>
                      <TableHead className="text-gray-300">Messages</TableHead>
                      <TableHead className="text-gray-300">Joined</TableHead>
                      <TableHead className="text-gray-300">
                        Last Login
                      </TableHead>
                      <TableHead className="text-gray-300 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user.id}
                        className="border-gray-700 hover:bg-gray-700/30"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.displayName || user.email}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                <span className="text-sm font-medium">
                                  {(user.displayName || user.email)
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {user.displayName || "No name"}
                              </p>
                              <p className="text-sm text-gray-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user)}</TableCell>
                        <TableCell>
                          ${Number(user.balance).toFixed(2)}
                        </TableCell>
                        <TableCell>{user.streamsCount}</TableCell>
                        <TableCell>{user.messagesCount}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Ban/Unban/Suspend/Activate */}
                            {user.status === "ACTIVE" ? (
                              <>
                                <button
                                  onClick={() =>
                                    setBanDialog({
                                      open: true,
                                      userId: user.id,
                                      userName: user.displayName || user.email,
                                      action: "SUSPEND",
                                    })
                                  }
                                  className="p-2 rounded-lg bg-orange-600/10 border border-orange-600/50 hover:bg-orange-600/20 text-orange-400 hover:text-orange-300 transition-colors"
                                  title="Suspend user"
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    setBanDialog({
                                      open: true,
                                      userId: user.id,
                                      userName: user.displayName || user.email,
                                      action: "BAN",
                                    })
                                  }
                                  className="p-2 rounded-lg bg-red-600/10 border border-red-600/50 hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-colors"
                                  title="Ban user"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  setBanDialog({
                                    open: true,
                                    userId: user.id,
                                    userName: user.displayName || user.email,
                                    action: "ACTIVATE",
                                  })
                                }
                                className="p-2 rounded-lg bg-green-600/10 border border-green-600/50 hover:bg-green-600/20 text-green-400 hover:text-green-300 transition-colors"
                                title="Activate user"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  userId: user.id,
                                  userName: user.displayName || user.email,
                                })
                              }
                              className="p-2 rounded-lg bg-red-600/10 border border-red-600/50 hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} users
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="bg-gray-900/50 border-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="text-sm text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="bg-gray-900/50 border-gray-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !actionLoading &&
          setDeleteDialog({ open, userId: null, userName: null })
        }
      >
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user{" "}
              <strong className="text-white">{deleteDialog.userName}</strong>?
              This action cannot be undone and will permanently remove all user
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={actionLoading}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban/Suspend/Activate Dialog */}
      <Dialog
        open={banDialog.open}
        onOpenChange={(open) => {
          if (!actionLoading) {
            setBanDialog({ open, userId: null, userName: null, action: null });
            setBanReason("");
            setBanDuration("7d");
            setSuspendDuration("3h");
          }
        }}
      >
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle>
              {banDialog.action === "BAN"
                ? "Ban User"
                : banDialog.action === "SUSPEND"
                  ? "Suspend User"
                  : banDialog.action === "ACTIVATE"
                    ? "Activate User"
                    : "Unban User"}
            </DialogTitle>
            <DialogDescription>
              {banDialog.action === "BAN" || banDialog.action === "SUSPEND"
                ? `You are about to ${banDialog.action.toLowerCase()} user `
                : "You are about to activate user "}
              <strong className="text-white">{banDialog.userName}</strong>.
            </DialogDescription>
          </DialogHeader>

          {banDialog.action === "BAN" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ban Duration</label>
                <Select value={banDuration} onValueChange={setBanDuration}>
                  <SelectTrigger className="bg-gray-900/50 border-gray-700">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">1 Month</SelectItem>
                    <SelectItem value="180d">6 Months</SelectItem>
                    <SelectItem value="365d">1 Year</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason (optional)</label>
                <Textarea
                  placeholder="Enter the reason for this ban..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="bg-gray-900/50 border-gray-700"
                  rows={3}
                />
              </div>
            </div>
          )}

          {banDialog.action === "SUSPEND" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Suspension Duration</label>
                <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                  <SelectTrigger className="bg-gray-900/50 border-gray-700">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="3h">3 Hours</SelectItem>
                    <SelectItem value="6h">6 Hours</SelectItem>
                    <SelectItem value="12h">12 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason (optional)</label>
                <Textarea
                  placeholder="Enter the reason for this suspension..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="bg-gray-900/50 border-gray-700"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBanDialog({
                  open: false,
                  userId: null,
                  userName: null,
                  action: null,
                });
                setBanReason("");
                setBanDuration("7d");
                setSuspendDuration("3h");
              }}
              disabled={actionLoading}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUserAction}
              disabled={actionLoading}
              className={
                banDialog.action === "BAN"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : banDialog.action === "SUSPEND"
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
              }
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm ${banDialog.action}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
