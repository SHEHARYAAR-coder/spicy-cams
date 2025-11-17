"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  MoreVertical,
  Eye,
  Trash2,
  StopCircle,
  PlayCircle,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Stream {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorAvatar: string | null;
  thumbnailUrl: string | null;
  livekitRoomName: string | null;
  recordingEnabled: boolean;
  recordingUrl: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  totalSessions: number;
  totalMessages: number;
  activeSessions: number;
  totalWatchTimeMs: number;
}

interface StreamManagementProps {
  streams: Stream[];
}

export function StreamManagement({ streams }: StreamManagementProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "delete" | "end" | "view" | null;
  }>({ open: false, action: null });
  const [isLoading, setIsLoading] = useState(false);

  // Filter streams based on search and status
  const filteredStreams = useMemo(() => {
    return streams.filter((stream) => {
      const matchesSearch =
        stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.creatorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || stream.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [streams, searchQuery, statusFilter]);

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return <Badge className="bg-red-500 hover:bg-red-600">Live</Badge>;
      case "SCHEDULED":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">Scheduled</Badge>
        );
      case "PAUSED":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">Paused</Badge>
        );
      case "ENDED":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Ended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format duration
  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle actions
  const handleAction = async (action: "delete" | "end", stream: Stream) => {
    setSelectedStream(stream);
    setActionDialog({ open: true, action });
  };

  const confirmAction = async () => {
    if (!selectedStream || !actionDialog.action) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/streams/${selectedStream.id}`, {
        method: actionDialog.action === "delete" ? "DELETE" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body:
          actionDialog.action === "end"
            ? JSON.stringify({ action: "end" })
            : undefined,
      });

      if (!response.ok) {
        throw new Error("Action failed");
      }

      toast.success(
        `Stream ${
          actionDialog.action === "delete" ? "deleted" : "ended"
        } successfully`
      );

      // Refresh the page
      router.refresh();

      setActionDialog({ open: false, action: null });
      setSelectedStream(null);
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("Failed to perform action. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 backdrop-blur-sm hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
          <p className="text-gray-400 text-sm">Total Streams</p>
          <p className="text-2xl font-bold text-white">{streams.length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 backdrop-blur-sm hover:border-red-500/50 transition-all hover:shadow-lg hover:shadow-red-500/10">
          <p className="text-gray-400 text-sm">Live Streams</p>
          <p className="text-2xl font-bold text-red-500">
            {streams.filter((s) => s.status === "LIVE").length}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 backdrop-blur-sm hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
          <p className="text-gray-400 text-sm">Scheduled</p>
          <p className="text-2xl font-bold text-blue-500">
            {streams.filter((s) => s.status === "SCHEDULED").length}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 backdrop-blur-sm hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
          <p className="text-gray-400 text-sm">Active Sessions</p>
          <p className="text-2xl font-bold text-green-500">
            {streams.reduce((total, s) => total + s.activeSessions, 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by title, creator, email, or stream ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px] bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="LIVE">Live</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="ENDED">Ended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Streams Table */}
      <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800/70 border-gray-700 hover:bg-gray-800/70">
              <TableHead className="text-gray-300">Stream</TableHead>
              <TableHead className="text-gray-300">Creator</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Category</TableHead>
              <TableHead className="text-gray-300">Sessions</TableHead>
              <TableHead className="text-gray-300">Watch Time</TableHead>
              <TableHead className="text-gray-300">Created</TableHead>
              <TableHead className="text-gray-300 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStreams.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-gray-400 py-8"
                >
                  No streams found
                </TableCell>
              </TableRow>
            ) : (
              filteredStreams.map((stream) => (
                <TableRow
                  key={stream.id}
                  className="border-gray-700 hover:bg-gray-800/30"
                >
                  <TableCell className="max-w-xs">
                    <div className="flex items-center gap-3">
                      {stream.thumbnailUrl ? (
                        <img
                          src={stream.thumbnailUrl}
                          alt={stream.title}
                          className="w-16 h-9 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-9 bg-gray-700 rounded flex items-center justify-center">
                          <PlayCircle className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">
                          {stream.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {stream.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={stream.creatorAvatar || undefined} />
                        <AvatarFallback>
                          {stream.creatorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">
                          {stream.creatorName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {stream.creatorEmail}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(stream.status)}</TableCell>
                  <TableCell className="text-gray-300">
                    {stream.category || "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-white">{stream.totalSessions}</p>
                      {stream.activeSessions > 0 && (
                        <p className="text-xs text-green-500">
                          {stream.activeSessions} active
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {formatDuration(stream.totalWatchTimeMs)}
                  </TableCell>
                  <TableCell className="text-gray-300 text-sm">
                    {formatDate(stream.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push(`/streaming/${stream.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Stream
                        </DropdownMenuItem>
                        {stream.status === "LIVE" && (
                          <DropdownMenuItem
                            onClick={() => handleAction("end", stream)}
                            className="text-yellow-500"
                          >
                            <StopCircle className="mr-2 h-4 w-4" />
                            End Stream
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleAction("delete", stream)}
                          className="text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Stream
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

      {/* Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
      >
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm{" "}
              {actionDialog.action === "delete" ? "Deletion" : "End Stream"}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {actionDialog.action === "delete" ? (
                <>
                  Are you sure you want to delete the stream "
                  <span className="font-semibold">{selectedStream?.title}</span>
                  "? This action cannot be undone and will permanently remove
                  all stream data, sessions, and chat messages.
                </>
              ) : (
                <>
                  Are you sure you want to end the stream "
                  <span className="font-semibold">{selectedStream?.title}</span>
                  "? This will immediately terminate the stream for all viewers.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, action: null })}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant={
                actionDialog.action === "delete" ? "destructive" : "default"
              }
              onClick={confirmAction}
              disabled={isLoading}
            >
              {isLoading
                ? "Processing..."
                : actionDialog.action === "delete"
                ? "Delete Stream"
                : "End Stream"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
