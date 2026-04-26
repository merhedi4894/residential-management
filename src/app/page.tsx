"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Building2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
  Search,
  AlertTriangle,
  Package,
  BedDouble,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Wrench,
  X,
  Edit3,
  ClipboardList,
  Eye,
  LogOut,
  KeyRound,
  Lock,
  UserCheck,
  Download,
  Shield,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ── Types ────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string;
  itemName: string;
  quantity: number;
  condition: string;
  roomNumber: string;
  tenantId?: string;
  roomId: string;
  addedDate: string;
  note?: string;
  tenant?: { id: string; name: string };
  room?: { id: string; roomNumber: string };
}

interface Tenant {
  id: string;
  name: string;
  designation?: string;
  phone?: string;
  roomId: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  room: { id: string; roomNumber: string; floorId: string };
  buildingName?: string;
  inventories?: InventoryItem[];
}

interface TroubleReport {
  id: string;
  roomNumber: string;
  roomId: string;
  description: string;
  reportedBy: string;
  reportedAt: string;
  status: string;
  resolvedAt?: string;
  resolutionNote?: string;
  resolvedBy?: string;
  room?: { id: string; roomNumber: string };
}

interface Floor {
  id: string;
  floorNumber: number;
  buildingId: string;
  rooms: Room[];
}

interface Room {
  id: string;
  roomNumber: string;
  floorId: string;
  tenants: { id: string; name: string; isActive: boolean }[];
  inventories: InventoryItem[];
  troubleReports: TroubleReport[];
}

interface Building {
  id: string;
  name: string;
  totalFloors: number;
  capacityPerRoom: number;
  createdAt: string;
  floors: Floor[];
}

interface Guest {
  id: string;
  name: string;
  address?: string;
  mobile?: string;
  referredBy?: string;
  checkInDate: string;
  checkOutDate?: string;
  totalBill?: string;
  note?: string;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Error Boundary ──────────────────────────────────────────────────────────

class TabErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-center">
          <p className="text-red-600 font-medium mb-2">একটি ত্রুটি ঘটেছে</p>
          <p className="text-red-400 text-xs mb-3">{this.state.error?.message}</p>
          <Button variant="outline" size="sm" onClick={() => this.setState({ hasError: false, error: null })}>আবার চেষ্টা করুন</Button>
        </CardContent></Card>
      );
    }
    return this.props.children;
  }
}

// ── Helper ───────────────────────────────────────────────────────────────

function toBanglaNumber(num: number | string): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "পেন্ডিং":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300">
          <Clock className="size-3 mr-1" />
          পেন্ডিং
        </Badge>
      );
    case "চলমান":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300">
          <Wrench className="size-3 mr-1" />
          চলমান
        </Badge>
      );
    case "সমাধান হয়েছে":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300">
          <CheckCircle2 className="size-3 mr-1" />
          সমাধান হয়েছে
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

const uid = () => Math.random().toString(36).substring(2, 9);

// Bengali months for search filters (shared between TenantsTab and TroublesTab)
const BENGALI_MONTHS = [
  { value: "1", label: "জানুয়ারি" }, { value: "2", label: "ফেব্রুয়ারি" }, { value: "3", label: "মার্চ" },
  { value: "4", label: "এপ্রিল" }, { value: "5", label: "মে" }, { value: "6", label: "জুন" },
  { value: "7", label: "জুলাই" }, { value: "8", label: "আগস্ট" }, { value: "9", label: "সেপ্টেম্বর" },
  { value: "10", label: "অক্টোবর" }, { value: "11", label: "নভেম্বর" }, { value: "12", label: "ডিসেম্বর" },
];

// ── Buildings Context (shared data for performance) ─────────────────────

const BuildingsContext = React.createContext<{
  buildings: Building[];
  reloadBuildings: () => void;
  counts: { buildingCount: number; roomCount: number; tenantCount: number };
}>({ buildings: [], reloadBuildings: () => {}, counts: { buildingCount: 0, roomCount: 0, tenantCount: 0 } });

function useBuildingsContext() {
  return React.useContext(BuildingsContext);
}

function BuildingsContextWrapper({ children }: { children: React.ReactNode }) {
  const [buildings, setBuildings] = useState<Building[]>([]);

  const loadBuildings = useCallback(async () => {
    try {
      const res = await fetch("/api/buildings");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBuildings(data);
    } catch { /* silent */ }
  }, []);

  // Compute counts directly from buildings data (no separate API call needed)
  const counts = React.useMemo(() => {
    let roomCount = 0;
    let tenantCount = 0;
    for (const b of buildings) {
      for (const f of b.floors || []) {
        roomCount += (f.rooms || []).length;
        for (const r of f.rooms || []) {
          tenantCount += (r.tenants || []).length;
        }
      }
    }
    return { buildingCount: buildings.length, roomCount, tenantCount };
  }, [buildings]);

  useEffect(() => {
    loadBuildings();
    const handler = () => { loadBuildings(); };
    window.addEventListener("dashboard-data-changed", handler);
    return () => window.removeEventListener("dashboard-data-changed", handler);
  }, [loadBuildings]);

  return (
    <BuildingsContext.Provider value={React.useMemo(() => ({ buildings, reloadBuildings: loadBuildings, counts }), [buildings, loadBuildings, counts])}>
      {children}
    </BuildingsContext.Provider>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export default function HomePage() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [checking, setChecking] = useState(true);
  // Change password dialog
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [changePassLoading, setChangePassLoading] = useState(false);
  // Auto-logout timer ref
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.ok) return r.json();
        throw new Error();
      })
      .then((data) => {
        setUser(data.user);
        setChecking(false);
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  // Auto-logout after 10 minutes of inactivity
  useEffect(() => {
    if (checking) return; // Don't start timer while checking auth

    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        toast.info("নিরাপত্তার জন্য অটো লগআউট হয়েছে");
        fetch("/api/auth/logout", { method: "POST" }).then(() => {
          window.location.href = "/login";
        });
      }, INACTIVITY_TIMEOUT);
    };

    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    activityEvents.forEach((evt) => {
      document.addEventListener(evt, resetTimer, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      activityEvents.forEach((evt) => {
        document.removeEventListener(evt, resetTimer);
      });
    };
  }, [checking]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleChangePassword = async () => {
    if (!currentPass.trim() || !newPass.trim()) {
      toast.error("বর্তমান ও নতুন পাসওয়ার্ড দিন");
      return;
    }
    try {
      setChangePassLoading(true);
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPass.trim(), newPassword: newPass.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "পাসওয়ার্ড পরিবর্তন ব্যর্থ");
        return;
      }
      toast.success("পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে");
      setChangePassOpen(false);
      setCurrentPass("");
      setNewPass("");
    } catch {
      toast.error("পাসওয়ার্ড পরিবর্তন করতে সমস্যা");
    } finally {
      setChangePassLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 flex items-center justify-center">
        <div className="size-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 flex flex-col">
      <Toaster position="top-right" richColors />
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex-1">
        <BuildingsContextWrapper>
          <DashboardHeader user={user} onLogout={handleLogout} onChangePassword={() => { setCurrentPass(""); setNewPass(""); setChangePassOpen(true); }} />
          <MainTabs />
        </BuildingsContextWrapper>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePassOpen} onOpenChange={setChangePassOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>পাসওয়ার্ড পরিবর্তন</DialogTitle>
            <DialogDescription>আপনার বর্তমান পাসওয়ার্ড দিয়ে নতুন পাসওয়ার্ড সেট করুন</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>বর্তমান পাসওয়ার্ড</Label>
              <Input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} placeholder="বর্তমান পাসওয়ার্ড" />
            </div>
            <div className="space-y-1.5">
              <Label>নতুন পাসওয়ার্ড</Label>
              <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর)" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePassOpen(false)}>বাতিল</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleChangePassword} disabled={changePassLoading}>
              {changePassLoading ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              পরিবর্তন করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Dashboard Header ─────────────────────────────────────────────────────

function DashboardHeader({ user, onLogout, onChangePassword }: {
  user: { id: string; username: string } | null;
  onLogout: () => void;
  onChangePassword: () => void;
}) {
  const { counts } = useBuildingsContext();

  return (
    <header className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
              <Building2 className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              আবাসিক ম্যানেজমেন্ট
            </h1>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
            <Building2 className="size-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">বিল্ডিং</span>
            <span className="text-lg font-bold text-emerald-700">
              {counts.buildingCount}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
            <BedDouble className="size-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">রুম</span>
            <span className="text-lg font-bold text-emerald-700">
              {counts.roomCount}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
            <Users className="size-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">ভাড়াটে</span>
            <span className="text-lg font-bold text-emerald-700">
              {counts.tenantCount}
            </span>
          </div>
          {/* User menu */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <div className="size-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                {user?.username?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <span className="text-sm font-medium text-emerald-800 hidden sm:inline">
                Admin
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="size-9 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
              onClick={onChangePassword}
              title="পাসওয়ার্ড পরিবর্তন"
            >
              <KeyRound className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="size-9 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={onLogout}
              title="লগআউট"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Main Tabs ────────────────────────────────────────────────────────────

function MainTabs() {
  const [activeTab, setActiveTab] = useState("buildings");
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(["buildings"]));

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setVisitedTabs(prev => new Set([...prev, value]));
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
        <TabsTrigger value="buildings" className="flex-1 sm:flex-auto gap-1.5 border border-gray-200">
          <Building2 className="size-4" />
          <span className="hidden sm:inline">বিল্ডিং ও রুম</span>
          <span className="sm:hidden">বিল্ডিং</span>
        </TabsTrigger>
        <TabsTrigger value="tenants" className="flex-1 sm:flex-auto gap-1.5 border border-gray-200">
          <Users className="size-4" />
          <span className="hidden sm:inline">ভাড়াটে ম্যানেজমেন্ট</span>
          <span className="sm:hidden">ভাড়াটে</span>
        </TabsTrigger>
        <TabsTrigger value="overview" className="flex-1 sm:flex-auto gap-1.5 border border-gray-200">
          <ClipboardList className="size-4" />
          <span className="hidden sm:inline">রুমভিত্তিক সার্চ</span>
          <span className="sm:hidden">সার্চ</span>
        </TabsTrigger>
        <TabsTrigger value="troubles" className="flex-1 sm:flex-auto gap-1.5 border border-gray-200">
          <AlertTriangle className="size-4" />
          <span className="hidden sm:inline">ট্রাবল রিপোর্ট</span>
          <span className="sm:hidden">ট্রাবল</span>
        </TabsTrigger>
        <TabsTrigger value="belongings" className="flex-1 sm:flex-auto gap-1.5 border border-gray-200">
          <Package className="size-4" />
          <span className="hidden sm:inline">কমন মালামাল</span>
          <span className="sm:hidden">মালামাল</span>
        </TabsTrigger>
        <a href="https://store-room-inventory.vercel.app/" className="flex-1 sm:flex-auto flex items-center justify-center gap-1.5 rounded-md border border-gray-200 px-2 py-1 text-sm font-medium text-foreground whitespace-nowrap transition-[color,box-shadow] min-w-0">
          <span className="hidden sm:inline">স্টোর রুম</span>
          <span className="sm:hidden">স্টোর</span>
        </a>
      </TabsList>

      <TabsContent value="buildings" className="mt-6">
        <TabErrorBoundary><BuildingsTab /></TabErrorBoundary>
      </TabsContent>
      <TabsContent value="tenants" className="mt-6">
        {visitedTabs.has("tenants") && <TabErrorBoundary><TenantsTab /></TabErrorBoundary>}
      </TabsContent>
      <TabsContent value="overview" className="mt-6">
        {visitedTabs.has("overview") && <TabErrorBoundary><OverviewTab /></TabErrorBoundary>}
      </TabsContent>
      <TabsContent value="troubles" className="mt-6">
        {visitedTabs.has("troubles") && <TabErrorBoundary><TroublesTab /></TabErrorBoundary>}
      </TabsContent>
      <TabsContent value="belongings" className="mt-6">
        {visitedTabs.has("belongings") && <TabErrorBoundary><BelongingsTab /></TabErrorBoundary>}
      </TabsContent>
    </Tabs>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — Buildings & Rooms
// ═══════════════════════════════════════════════════════════════════════════

function BuildingsTab() {
  const { buildings, reloadBuildings } = useBuildingsContext();
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(
    new Set()
  );

  // Dialog states
  const [addBuildingOpen, setAddBuildingOpen] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState("");
  const [newBuildingFloors, setNewBuildingFloors] = useState("");
  const [newBuildingCapacity, setNewBuildingCapacity] = useState("1");

  const [addRoomFloorId, setAddRoomFloorId] = useState("");
  const [addRoomNumber, setAddRoomNumber] = useState("");
  const [addRoomOpen, setAddRoomOpen] = useState(false);

  // Loading states
  const [creatingBuilding, setCreatingBuilding] = useState(false);
  const [deletingBuilding, setDeletingBuilding] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);

  // Edit building dialog
  const [editBuildingOpen, setEditBuildingOpen] = useState(false);
  const [editBuildingId, setEditBuildingId] = useState("");
  const [editBuildingName, setEditBuildingName] = useState("");
  const [editBuildingCapacity, setEditBuildingCapacity] = useState("");
  const [updatingBuilding, setUpdatingBuilding] = useState(false);

  // Edit room dialog
  const [editRoomOpen, setEditRoomOpen] = useState(false);
  const [editRoomId, setEditRoomId] = useState("");
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [updatingRoom, setUpdatingRoom] = useState(false);

  // Delete building password dialog
  const [deleteBuildingId, setDeleteBuildingId] = useState("");
  const [deleteBuildingName, setDeleteBuildingName] = useState("");
  const [deletePassOpen, setDeletePassOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const handleEditBuilding = async () => {
    if (!editBuildingName.trim()) {
      toast.error("বিল্ডিং এর নাম দিন");
      return;
    }
    setUpdatingBuilding(true);
    try {
      const body: any = { id: editBuildingId, name: editBuildingName.trim() };
      if (editBuildingCapacity) {
        body.capacityPerRoom = parseInt(editBuildingCapacity);
      }
      const res = await fetch("/api/buildings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "বিল্ডিং আপডেট করতে সমস্যা হয়েছে");
        return;
      }
      toast.success("বিল্ডিং আপডেট হয়েছে");
      setEditBuildingOpen(false);
      refreshData();
    } catch {
      toast.error("বিল্ডিং আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setUpdatingBuilding(false);
    }
  };

  const openEditBuildingDialog = (buildingId: string, buildingName: string, capacityPerRoom: number) => {
    setEditBuildingId(buildingId);
    setEditBuildingName(buildingName);
    setEditBuildingCapacity(String(capacityPerRoom || 1));
    setEditBuildingOpen(true);
  };

  const handleEditRoom = async () => {
    if (!editRoomNumber.trim()) {
      toast.error("রুম নম্বর দিন");
      return;
    }
    setUpdatingRoom(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editRoomId, roomNumber: editRoomNumber.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("রুম নম্বর আপডেট হয়েছে");
      setEditRoomOpen(false);
      refreshData();
    } catch {
      toast.error("রুম আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setUpdatingRoom(false);
    }
  };

  const openEditRoomDialog = (roomId: string, roomNumber: string) => {
    setEditRoomId(roomId);
    setEditRoomNumber(roomNumber);
    setEditRoomOpen(true);
  };

  const refreshData = useCallback(() => {
    window.dispatchEvent(new Event("dashboard-data-changed"));
    reloadBuildings();
  }, [reloadBuildings]);

  const toggleBuilding = (id: string) => {
    setExpandedBuildings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateBuilding = async () => {
    if (!newBuildingName.trim() || !newBuildingFloors) {
      toast.error("বিল্ডিং এর নাম এবং তলা সংখ্যা দিন");
      return;
    }
    setCreatingBuilding(true);
    try {
      const res = await fetch("/api/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBuildingName.trim(),
          totalFloors: parseInt(newBuildingFloors),
          capacityPerRoom: parseInt(newBuildingCapacity) || 1,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("বিল্ডিং তৈরি হয়েছে");
      setNewBuildingName("");
      setNewBuildingFloors("");
      setNewBuildingCapacity("1");
      setAddBuildingOpen(false);
      refreshData();
    } catch {
      toast.error("বিল্ডিং তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setCreatingBuilding(false);
    }
  };

  const handleDeleteBuilding = async () => {
    if (!deletePassword.trim()) {
      toast.error("এডমিন পাসওয়ার্ড দিন");
      return;
    }
    setDeletingBuilding(true);
    try {
      const res = await fetch("/api/buildings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteBuildingId, adminPassword: deletePassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "বিল্ডিং মুছে ফেলতে সমস্যা হয়েছে");
        return;
      }
      toast.success("বিল্ডিং মুছে ফেলা হয়েছে");
      setDeletePassOpen(false);
      setDeletePassword("");
      refreshData();
    } catch {
      toast.error("বিল্ডিং মুছে ফেলতে সমস্যা হয়েছে");
    } finally {
      setDeletingBuilding(false);
    }
  };

  const openDeleteDialog = (buildingId: string, buildingName: string) => {
    setDeleteBuildingId(buildingId);
    setDeleteBuildingName(buildingName);
    setDeletePassword("");
    setDeletePassOpen(true);
  };

  const handleCreateRoom = async () => {
    if (!addRoomNumber.trim() || !addRoomFloorId) {
      toast.error("রুম নম্বর দিন");
      return;
    }
    setCreatingRoom(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber: addRoomNumber.trim(),
          floorId: addRoomFloorId,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("রুম তৈরি হয়েছে");
      setAddRoomNumber("");
      setAddRoomFloorId("");
      setAddRoomOpen(false);
      refreshData();
    } catch {
      toast.error("রুম তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    setDeletingRoom(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("রুম মুছে ফেলা হয়েছে");
      refreshData();
    } catch {
      toast.error("রুম মুছে ফেলতে সমস্যা হয়েছে");
    } finally {
      setDeletingRoom(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="size-5 text-emerald-600" />
          বিল্ডিং ও রুম ম্যানেজমেন্ট
        </h2>
        <Dialog open={addBuildingOpen} onOpenChange={setAddBuildingOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="size-4" />
              নতুন বিল্ডিং
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>নতুন বিল্ডিং যোগ করুন</DialogTitle>
              <DialogDescription>
                বিল্ডিং এর নাম, মোট তলার সংখ্যা এবং প্রতি রুমে সিট সংখ্যা লিখুন
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bname">বিল্ডিং এর নাম</Label>
                <Input
                  id="bname"
                  placeholder="যেমন: এ ব্লক"
                  value={newBuildingName}
                  onChange={(e) => setNewBuildingName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bfloors">মোট তলা সংখ্যা</Label>
                <Input
                  id="bfloors"
                  type="number"
                  min={1}
                  placeholder="৩"
                  value={newBuildingFloors}
                  onChange={(e) => setNewBuildingFloors(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bcapacity">প্রতি রুমে সিট সংখ্যা</Label>
                <Input
                  id="bcapacity"
                  type="number"
                  min={1}
                  placeholder="১"
                  value={newBuildingCapacity}
                  onChange={(e) => setNewBuildingCapacity(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">প্রতি রুমে কয়জন ভাড়াটে থাকতে পারবে (যেমন: ১, ২, ৩...)</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddBuildingOpen(false)}
              >
                বাতিল
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleCreateBuilding}
                disabled={creatingBuilding}
              >
                {creatingBuilding ? "তৈরি হচ্ছে..." : "তৈরি করুন"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Building Password Dialog */}
        <Dialog open={deletePassOpen} onOpenChange={(open) => { setDeletePassOpen(open); if (!open) setDeletePassword(""); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Shield className="size-5" />
                বিল্ডিং মুছে ফেলবেন?
              </DialogTitle>
              <DialogDescription>
                &quot;{deleteBuildingName}&quot; বিল্ডিং এবং এর সকল তলা ও রুম স্থায়ীভাবে মুছে যাবে। নিশ্চিত করতে আপনার এডমিন পাসওয়ার্ড দিন।
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>এডমিন পাসওয়ার্ড</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    type="password"
                    placeholder="পাসওয়ার্ড লিখুন"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleDeleteBuilding(); }}
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDeletePassOpen(false); setDeletePassword(""); }}>বাতিল</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteBuilding}
                disabled={deletingBuilding || !deletePassword.trim()}
              >
                {deletingBuilding ? "মুছে ফেলা হচ্ছে..." : "মুছে ফেলুন"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Building Dialog */}
        <Dialog open={editBuildingOpen} onOpenChange={setEditBuildingOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-600">
                <Edit3 className="size-5" />
                বিল্ডিং এডিট করুন
              </DialogTitle>
              <DialogDescription>
                বিল্ডিং এর নাম এবং প্রতি রুমে সিট সংখ্যা পরিবর্তন করুন
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editBname">বিল্ডিং এর নাম</Label>
                <Input
                  id="editBname"
                  placeholder="নতুন নাম লিখুন"
                  value={editBuildingName}
                  onChange={(e) => setEditBuildingName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEditBuilding(); }}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editBcap">প্রতি রুমে সিট সংখ্যা</Label>
                <Input
                  id="editBcap"
                  type="number"
                  min={1}
                  placeholder="১"
                  value={editBuildingCapacity}
                  onChange={(e) => setEditBuildingCapacity(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEditBuilding(); }}
                />
                <p className="text-[11px] text-muted-foreground">প্রতি রুমে কয়জন ভাড়াটে থাকতে পারবে (যেমন: ১, ২, ৩...)</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditBuildingOpen(false)}>বাতিল</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleEditBuilding}
                disabled={updatingBuilding || !editBuildingName.trim() || !editBuildingCapacity}
              >
                {updatingBuilding ? "আপডেট হচ্ছে..." : "আপডেট করুন"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Room Dialog */}
        <Dialog open={editRoomOpen} onOpenChange={setEditRoomOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-600">
                <Edit3 className="size-5" />
                রুম নম্বর পরিবর্তন করুন
              </DialogTitle>
              <DialogDescription>
                রুম এর নতুন নম্বর লিখুন
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editRoom">রুম নম্বর</Label>
                <Input
                  id="editRoom"
                  placeholder="নতুন রুম নম্বর লিখুন"
                  value={editRoomNumber}
                  onChange={(e) => setEditRoomNumber(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEditRoom(); }}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRoomOpen(false)}>বাতিল</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleEditRoom}
                disabled={updatingRoom || !editRoomNumber.trim()}
              >
                {updatingRoom ? "আপডেট হচ্ছে..." : "আপডেট করুন"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {buildings.length === 0 && (
        <Alert>
          <Building2 className="size-4" />
          <AlertDescription>
            কোনো বিল্ডিং নেই। নতুন বিল্ডিং যোগ করুন।
          </AlertDescription>
        </Alert>
      )}

      {buildings.map((building) => (
        <Collapsible
          key={building.id}
          open={expandedBuildings.has(building.id)}
          onOpenChange={() => toggleBuilding(building.id)}
        >
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="w-full" asChild>
              <div>
              <CardHeader className="hover:bg-emerald-50/50 transition-colors cursor-pointer py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-100 text-emerald-700">
                      <Building2 className="size-5" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg">{building.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        মোট তলা: {building.totalFloors} • রুম:{" "}
                        {building.floors?.reduce(
                          (sum, f) => sum + (f.rooms?.length || 0),
                          0
                        )}{" "}
                        • মোট খালি সিট - {toBanglaNumber(
                          building.floors?.reduce((totalEmpty, f) => {
                            const cap = building.capacityPerRoom || 1;
                            return totalEmpty + (f.rooms || []).reduce((empty, r) => {
                              const active = (r.tenants?.length || 0);
                                      return empty + Math.max(0, cap - active);
                                    }, 0);
                                  }, 0) || 0
                        )} টি
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      onClick={(e) => { e.stopPropagation(); openEditBuildingDialog(building.id, building.name, building.capacityPerRoom); }}
                    >
                      <Edit3 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => { e.stopPropagation(); openDeleteDialog(building.id, building.name); }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    {expandedBuildings.has(building.id) ? (
                      <ChevronDown className="size-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="border-t">
                {building.floors?.length === 0 && (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    কোনো তলা নেই
                  </p>
                )}
                {building.floors?.map((floor) => (
                  <div
                    key={floor.id}
                    className="border-b last:border-b-0 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <span className="flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          {floor.floorNumber}
                        </span>
                        {floor.floorNumber === 1
                          ? "১ম তলা"
                          : floor.floorNumber === 2
                            ? "২য় তলা"
                            : floor.floorNumber === 3
                              ? "৩য় তলা"
                              : floor.floorNumber === 4
                                ? "৪র্থ তলা"
                                : floor.floorNumber === 5
                                  ? "৫ম তলা"
                                  : `${floor.floorNumber} তলা`}
                      </h4>
                      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => setAddRoomFloorId(floor.id)}
                          >
                            <Plus className="size-3" />
                            রুম যোগ করুন
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>নতুন রুম যোগ করুন</DialogTitle>
                            <DialogDescription>
                              {building.name} - {floor.floorNumber} তলায় নতুন
                              রুম যোগ করুন
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>রুম নম্বর</Label>
                              <Input
                                placeholder="যেমন: ১০১"
                                value={addRoomNumber}
                                onChange={(e) =>
                                  setAddRoomNumber(e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setAddRoomOpen(false)}
                            >
                              বাতিল
                            </Button>
                            <Button
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={handleCreateRoom}
                              disabled={creatingRoom}
                            >
                              {creatingRoom ? "যোগ হচ্ছে..." : "যোগ করুন"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {floor.rooms?.length === 0 && (
                      <p className="text-sm text-muted-foreground pl-8">
                        এই তলায় কোনো রুম নেই
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pl-8">
                      {floor.rooms?.map((room) => (
                        <div
                          key={room.id}
                          className="flex items-center justify-between bg-white rounded-lg border px-3 py-2 text-sm group"
                        >
                          <div className="flex items-center gap-2">
                            <BedDouble className="size-3.5 text-emerald-600" />
                            <span className="font-medium">
                              {room.roomNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {room.tenants?.length > 0 && (
                              <span className="size-2 rounded-full bg-emerald-500" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-6 p-0 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => openEditRoomDialog(room.id, room.roomNumber)}
                            >
                              <Edit3 className="size-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-6 p-0 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    রুম মুছে ফেলবেন?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    রুম {room.roomNumber} স্থায়ীভাবে মুছে যাবে।
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() =>
                                      handleDeleteRoom(room.id)
                                    }
                                    disabled={deletingRoom}
                                  >
                                    মুছে ফেলুন
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2 — Tenant Management
// ═══════════════════════════════════════════════════════════════════════════

function TenantsTab() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const { buildings } = useBuildingsContext();
  const [loading, setLoading] = useState(true);
  const [showGuestView, setShowGuestView] = useState(false);

  // Month/Year search filter
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [tenantPage, setTenantPage] = useState(1);
  const TENANT_PAGE_SIZE = 10;

  // Edit tenant dialog
  const [editTenantOpen, setEditTenantOpen] = useState(false);
  const [editTenantData, setEditTenantData] = useState<{ id: string; name: string; designation: string; phone: string }>({ id: "", name: "", designation: "", phone: "" });
  const [savingTenant, setSavingTenant] = useState(false);

  // Delete tenant dialog
  const [deleteTenantId, setDeleteTenantId] = useState("");
  const [deleteTenantName, setDeleteTenantName] = useState("");
  const [deleteTenantOpen, setDeleteTenantOpen] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState(false);

  // Add tenant dialog
  const [addOpen, setAddOpen] = useState(false);
  // Tenant 1
  const [tName, setTName] = useState("");
  const [tDesignation, setTDesignation] = useState("");
  const [tPhone, setTPhone] = useState("");
  const [tStartDate, setTStartDate] = useState("");
  // Tenant 2 (optional co-tenant)
  const [t2Name, setT2Name] = useState("");
  const [t2Designation, setT2Designation] = useState("");
  const [t2Phone, setT2Phone] = useState("");
  const [t2StartDate, setT2StartDate] = useState("");
  const [showTenant2, setShowTenant2] = useState(false);
  // Room selection
  const [tBuildingId, setTBuildingId] = useState("");
  const [tFloorId, setTFloorId] = useState("");
  const [tRoomId, setTRoomId] = useState("");
  const [tRoomNumber, setTRoomNumber] = useState("");
  const [invItems, setInvItems] = useState<
    { itemName: string; quantity: string; condition: string }[]
  >([{ itemName: "", quantity: "1", condition: "ভালো" }]);
  const [editingInvIdx, setEditingInvIdx] = useState<number | null>(null);
  const [previousTenantName, setPreviousTenantName] = useState("");
  const [loadingPrevItems, setLoadingPrevItems] = useState(false);
  const [loadingCommonItems, setLoadingCommonItems] = useState(false);

  // Add dialog sub-tabs
  const [addDialogTab, setAddDialogTab] = useState<"add" | "empty">("add");
  const [emptyBuildingId, setEmptyBuildingId] = useState("");

  // Vacate dialog
  const [vacateOpen, setVacateOpen] = useState(false);
  const [vacateTenant, setVacateTenant] = useState<Tenant | null>(null);
  const [vacateItems, setVacateItems] = useState<VacateInventoryItem[]>([]);
  const [vacateLoading, setVacateLoading] = useState(false);
  const [editingVacateIdx, setEditingVacateIdx] = useState<number | null>(null);

  // Loading states
  const [addingTenant, setAddingTenant] = useState(false);
  const [vacateLoading2, setVacateLoading2] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const tRes = await fetch("/api/tenants");
      if (!tRes.ok) throw new Error();
      const data = await tRes.json();
      setTenants(data);
      const yearSet = new Set<number>();
      data.forEach((t: Tenant) => yearSet.add(new Date(t.startDate).getFullYear()));
      setAvailableYears([...yearSet].sort((a, b) => b - a));
      window.dispatchEvent(new Event("dashboard-data-changed"));
    } catch {
      toast.error("তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedBuilding = buildings.find((b) => b.id === tBuildingId);
  const selectedFloor = selectedBuilding?.floors?.find(
    (f) => f.id === tFloorId
  );
  const selectedRoom = selectedFloor?.rooms?.find((r) => r.id === tRoomId);



  // When room is selected, set room number and load previous inventory
  useEffect(() => {
    if (selectedRoom) {
      setTRoomNumber(selectedRoom.roomNumber);
      // Auto-load previous tenant's inventory items
      loadPreviousInventory(selectedRoom.id);
    } else {
      setTRoomNumber("");
      setPreviousTenantName("");
    }
  }, [selectedRoom]);

  const loadPreviousInventory = async (roomId: string) => {
    try {
      setLoadingPrevItems(true);
      const res = await fetch(`/api/inventory?roomId=${roomId}&lastTenant=true`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      // data can be [] (no items) or { tenantName, tenantId, items: [...] }
      if (Array.isArray(data) || !data.items || data.items.length === 0) {
        // No previous items, keep empty form
        setInvItems([{ itemName: "", quantity: "1", condition: "ভালো" }]);
        setPreviousTenantName("");
      } else {
        // Auto-fill inventory from previous tenant
        setInvItems(
          data.items.map((item: { itemName: string; quantity: number; condition: string }) => ({
            itemName: item.itemName,
            quantity: String(item.quantity),
            condition: item.condition,
          }))
        );
        setPreviousTenantName(data.tenantName || "");
      }
    } catch {
      setInvItems([{ itemName: "", quantity: "1", condition: "ভালো" }]);
      setPreviousTenantName("");
    } finally {
      setLoadingPrevItems(false);
    }
  };

  const loadCommonBelongings = async (buildingId: string) => {
    try {
      setLoadingCommonItems(true);
      const res = await fetch(`/api/belongings?buildingId=${buildingId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setInvItems(
          data.map((item: { itemName: string; quantity: number }) => ({
            itemName: item.itemName,
            quantity: String(item.quantity),
            condition: "ভালো",
          }))
        );
        setPreviousTenantName("");
        toast.success(`${toBanglaNumber(data.length)} টি কমন মালামাল লোড হয়েছে`);
      } else {
        toast.error("এই বিল্ডিংয়ে কোনো কমন মালামাল নেই। প্রথমে কমন মালামাল ট্যাবে যোগ করুন।");
      }
    } catch {
      toast.error("কমন মালামাল লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoadingCommonItems(false);
    }
  };

  const handleAddTenant = async () => {
    if (!tName.trim() || !tRoomId || !tStartDate) {
      toast.error("নাম, রুম এবং শুরুর তারিখ দিন");
      return;
    }
    if (showTenant2 && !t2Name.trim()) {
      toast.error("২য় ভাড়াটের নাম দিন");
      return;
    }
    setAddingTenant(true);
    try {
      // Create tenant 1
      const res1 = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tName.trim(),
          designation: tDesignation.trim() || null,
          phone: tPhone.trim() || null,
          roomId: tRoomId,
          roomNumber: tRoomNumber,
          startDate: tStartDate,
          inventoryItems: invItems.filter((i) => i.itemName.trim()),
        }),
      });
      if (!res1.ok) throw new Error();

      // If tenant 2 exists, create without deactivating tenant 1
      if (showTenant2 && t2Name.trim()) {
        const res2 = await fetch("/api/tenants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: t2Name.trim(),
            designation: t2Designation.trim() || null,
            phone: t2Phone.trim() || null,
            roomId: tRoomId,
            roomNumber: tRoomNumber,
            startDate: t2StartDate || tStartDate,
            inventoryItems: invItems.filter((i) => i.itemName.trim()),
            skipDeactivate: true,
          }),
        });
        if (!res2.ok) throw new Error();
      }

      toast.success(showTenant2 ? "দুইজন ভাড়াটে যোগ হয়েছে" : "ভাড়াটে যোগ হয়েছে");
      resetAddForm();
      setAddOpen(false);
      loadData();
    } catch {
      toast.error("ভাড়াটে যোগ করতে সমস্যা হয়েছে");
    } finally {
      setAddingTenant(false);
    }
  };

  const resetAddForm = () => {
    setTName("");
    setTDesignation("");
    setTPhone("");
    setTStartDate("");
    setT2Name("");
    setT2Designation("");
    setT2Phone("");
    setT2StartDate("");
    setShowTenant2(false);
    setTBuildingId("");
    setTFloorId("");
    setTRoomId("");
    setTRoomNumber("");
    setInvItems([{ itemName: "", quantity: "1", condition: "ভালো" }]);
    setPreviousTenantName("");
    setAddDialogTab("add");
    setEmptyBuildingId("");
  };

  const addInvRow = () =>
    setInvItems((prev) => [
      ...prev,
      { itemName: "", quantity: "1", condition: "ভালো" },
    ]);

  const removeInvRow = (idx: number) =>
    setInvItems((prev) => prev.filter((_, i) => i !== idx));

  const updateInvRow = (
    idx: number,
    field: "itemName" | "quantity" | "condition",
    value: string
  ) =>
    setInvItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );

  const handleVacate = async () => {
    if (!vacateTenant) return;
    try {
      setVacateLoading(true);
      const res = await fetch("/api/vacate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: vacateTenant.id,
          inventoryItems: vacateItems.filter((item) => item.itemName.trim() || item.id),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("ভাড়াটে রুম ছেড়ে দিয়েছেন");
      setVacateOpen(false);
      setVacateTenant(null);
      loadData();
      window.dispatchEvent(new Event("dashboard-data-changed"));
    } catch {
      toast.error("আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setVacateLoading(false);
    }
  };

  // Vacate inventory helpers
  const updateVacateItem = (idx: number, field: keyof VacateInventoryItem, value: string | number) => {
    setVacateItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };
  const removeVacateItem = (idx: number) => {
    if (vacateItems.length <= 1) return;
    setVacateItems((prev) => prev.filter((_, i) => i !== idx));
  };
  const addVacateItem = () => {
    setVacateItems((prev) => [...prev, { itemName: "", quantity: 1, condition: "ভালো" }]);
  };

  // Filter tenants by building/month/year
  const filteredTenants = React.useMemo(() => {
    if (!filterMonth && !filterYear && !filterBuilding) return tenants;
    return tenants.filter((t) => {
      const d = new Date(t.startDate);
      const mOk = !filterMonth || d.getMonth() + 1 === parseInt(filterMonth);
      const yOk = !filterYear || d.getFullYear() === parseInt(filterYear);
      const bOk = !filterBuilding || t.buildingName === filterBuilding;
      return mOk && yOk && bOk;
    });
  }, [tenants, filterMonth, filterYear, filterBuilding]);

  const totalTenantPages = Math.max(1, Math.ceil(filteredTenants.length / TENANT_PAGE_SIZE));
  const paginatedTenants = filteredTenants.slice((tenantPage - 1) * TENANT_PAGE_SIZE, tenantPage * TENANT_PAGE_SIZE);

  // Reset page on filter change
  useEffect(() => { setTenantPage(1); }, [filterMonth, filterYear, filterBuilding]);

  // Edit tenant handlers
  const openEditTenant = (tenant: Tenant) => {
    setEditTenantData({ id: tenant.id, name: tenant.name, designation: tenant.designation || "", phone: tenant.phone || "" });
    setEditTenantOpen(true);
  };

  const handleSaveTenant = async () => {
    if (!editTenantData.name.trim()) { toast.error("ভাড়াটের নাম দিন"); return; }
    setSavingTenant(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editTenantData.id, action: "updateInfo", name: editTenantData.name.trim(), designation: editTenantData.designation.trim() || null, phone: editTenantData.phone.trim() || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("ভাড়াটে তথ্য আপডেট হয়েছে");
      setEditTenantOpen(false);
      loadData();
    } catch { toast.error("আপডেট করতে সমস্যা হয়েছে"); }
    finally { setSavingTenant(false); }
  };

  const openDeleteTenant = (tenant: Tenant) => {
    setDeleteTenantId(tenant.id);
    setDeleteTenantName(tenant.name);
    setDeleteTenantOpen(true);
  };

  const handleDeleteTenant = async () => {
    setDeletingTenant(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTenantId }),
      });
      if (!res.ok) throw new Error();
      toast.success("ভাড়াটে মুছে ফেলা হয়েছে");
      setDeleteTenantOpen(false);
      loadData();
      window.dispatchEvent(new Event("dashboard-data-changed"));
    } catch { toast.error("মুছে ফেলতে সমস্যা হয়েছে"); }
    finally { setDeletingTenant(false); }
  };

  // XLSX download
  const handleDownloadTenants = async () => {
    if (filteredTenants.length === 0) { toast.error("ডাউনলোড করার মতো কোনো ভাড়াটে নেই"); return; }
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("ভাড়াটে তালিকা");

      // Green header style
      const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF22C55E" } };
      const headerFont = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      const border = { bottom: { style: "thin", color: { argb: "FF000000" } } };

      const headers = ["ক্রম", "বিল্ডিং নাম", "নাম", "পদবী", "রুম নম্বর", "ফোন", "শুরুর তারিখ", "রুম ছাড়ার তারিখ", "অবস্থা"];
      const headerRow = sheet.addRow(headers);
      headerRow.eachCell((cell) => { cell.fill = headerFill; cell.font = headerFont; cell.border = border; cell.alignment = { horizontal: "center", vertical: "middle" }; });
      headerRow.height = 28;

      filteredTenants.forEach((t, idx) => {
        const row = sheet.addRow([
          idx + 1,
          t.buildingName || "-",
          t.name,
          t.designation || "-",
          t.room?.roomNumber || "-",
          t.phone || "-",
          t.startDate ? new Date(t.startDate).toLocaleDateString("bn-BD") : "-",
          t.endDate ? new Date(t.endDate).toLocaleDateString("bn-BD") : "-",
          t.isActive ? "সক্রিয়" : "অসক্রিয়",
        ]);
        row.eachCell((cell, colNumber) => {
          cell.border = border;
          cell.alignment = { horizontal: colNumber <= 1 ? "center" : "left", vertical: "middle" };
        });
      });

      // Auto column widths
      sheet.columns.forEach((col) => { col.width = 18; });
      sheet.getColumn(1).width = 6;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ভাড়াটে_তালিকা${filterBuilding ? `_${filterBuilding}` : ""}${filterMonth ? `_${BENGALI_MONTHS[parseInt(filterMonth) - 1]?.label}` : ""}${filterYear ? `_${filterYear}` : ""}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("XLSX ডাউনলোড হয়েছে");
    } catch { toast.error("ডাউনলোড করতে সমস্যা হয়েছে"); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="size-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="size-5 text-emerald-600" />
          ভাড়াটে ম্যানেজমেন্ট
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${!showGuestView ? "bg-emerald-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"}`}
              onClick={() => setShowGuestView(false)}
            >
              <Users className="size-3.5" />
              ভাড়াটে
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${showGuestView ? "bg-blue-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"}`}
              onClick={() => setShowGuestView(true)}
            >
              <UserCheck className="size-3.5" />
              গেস্ট
            </button>
          </div>
          {!showGuestView && (
        <Dialog
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open);
            if (!open) resetAddForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="size-4" />
              নতুন ভাড়াটে যোগ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>নতুন ভাড়াটে যোগ করুন</DialogTitle>
              <DialogDescription>
                ভাড়াটে এর তথ্য এবং কমন মালামালের তালিকা দিন
              </DialogDescription>
            </DialogHeader>

            {/* Dialog Sub-Tabs */}
            <div className="flex border-b mb-4">
              <button
                type="button"
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  addDialogTab === "add"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setAddDialogTab("add")}
              >
                <Users className="size-4 inline-block mr-1.5 -mt-0.5" />
                নতুন ভাড়াটে যোগ
              </button>
              <button
                type="button"
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  addDialogTab === "empty"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setAddDialogTab("empty")}
              >
                <BedDouble className="size-4 inline-block mr-1.5 -mt-0.5" />
                খালি রুম/সিট
              </button>
            </div>

            {addDialogTab === "add" && (
            <div className="space-y-4">
              {/* Room selection cascade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>বিল্ডিং নির্বাচন</Label>
                  <Select
                    value={tBuildingId}
                    onValueChange={(v) => {
                      setTBuildingId(v);
                      setTFloorId("");
                      setTRoomId("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="বিল্ডিং বেছে নিন" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>তলা নির্বাচন</Label>
                  <Select
                    value={tFloorId}
                    onValueChange={(v) => {
                      setTFloorId(v);
                      setTRoomId("");
                    }}
                    disabled={!tBuildingId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="তলা বেছে নিন" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedBuilding?.floors?.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.floorNumber} তলা
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>রুম নির্বাচন</Label>
                  <Select
                    value={tRoomId}
                    onValueChange={setTRoomId}
                    disabled={!tFloorId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="রুম বেছে নিন" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedFloor?.rooms?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.roomNumber}
                          {(r.tenants?.length || 0) >= (selectedBuilding?.capacityPerRoom || 1) && " (ভর্তি)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tenant 1 details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-emerald-600" />
                  <span className="font-medium text-sm">১ম ভাড়াটে</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>নাম *</Label>
                    <Input
                      placeholder="ভাড়াটে এর নাম"
                      value={tName}
                      onChange={(e) => setTName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>পদবী</Label>
                    <Input
                      placeholder="যেমন: ছাত্র, চাকরিজীবী"
                      value={tDesignation}
                      onChange={(e) => setTDesignation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ফোন নম্বর</Label>
                    <Input
                      placeholder="০১XXXXXXXXX"
                      value={tPhone}
                      onChange={(e) => setTPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>শুরুর তারিখ *</Label>
                  <Input
                    type="date"
                    value={tStartDate}
                    onChange={(e) => setTStartDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Add 2nd tenant toggle */}
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm text-muted-foreground">একই রুমে আরেকজন ভাড়াটে থাকবেন?</span>
                <Button
                  type="button"
                  variant={showTenant2 ? "default" : "outline"}
                  size="sm"
                  className={showTenant2 ? "bg-emerald-600 hover:bg-emerald-700 text-white gap-1" : "gap-1"}
                  onClick={() => setShowTenant2(!showTenant2)}
                >
                  <Plus className="size-3" />
                  {showTenant2 ? "২য় ভাড়াটে সরান" : "২য় ভাড়াটে যোগ"}
                </Button>
              </div>

              {/* Tenant 2 details */}
              {showTenant2 && (
                <div className="space-y-3 bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-blue-600" />
                    <span className="font-medium text-sm">২য় ভাড়াটে</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>নাম *</Label>
                      <Input
                        placeholder="২য় ভাড়াটে এর নাম"
                        value={t2Name}
                        onChange={(e) => setT2Name(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>পদবী</Label>
                      <Input
                        placeholder="যেমন: ছাত্র, চাকরিজীবী"
                        value={t2Designation}
                        onChange={(e) => setT2Designation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>ফোন নম্বর</Label>
                      <Input
                        placeholder="০১XXXXXXXXX"
                        value={t2Phone}
                        onChange={(e) => setT2Phone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>শুরুর তারিখ</Label>
                    <Input
                      type="date"
                      value={t2StartDate}
                      onChange={(e) => setT2StartDate(e.target.value)}
                      placeholder="১ম ভাড়াটে এর তারিখ ব্যবহার হবে"
                    />
                    <p className="text-xs text-muted-foreground">
                      খালি রাখলে ১ম ভাড়াটে এর তারিখ ব্যবহার হবে
                    </p>
                  </div>
                </div>
              )}

              {/* Inventory items */}
              <div className="space-y-3">
                {/* Auto-load banner */}
                {previousTenantName && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Package className="size-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          আগের মালামাল অটো লোড হয়েছে
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          &quot;{previousTenantName}&quot; এর মালামালের তালিকা নিচে
                          দেওয়া হয়েছে। প্রয়োজনে এডিট, মুছুন বা নতুন যোগ করুন।
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>কমন মালামাল</Label>
                  <div className="flex gap-2">
                    {tBuildingId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                        onClick={() => loadCommonBelongings(tBuildingId)}
                        disabled={loadingCommonItems}
                      >
                        {loadingCommonItems ? <div className="size-3 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /> : <Package className="size-3" />}
                        কমন মালামাল থেকে লোড করুন
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={addInvRow}
                    >
                      <Plus className="size-3" />
                      আইটেম যোগ
                    </Button>
                  </div>
                </div>

                {loadingPrevItems && (
                  <div className="flex items-center justify-center py-4">
                    <div className="size-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground ml-2">
                      আগের মালামাল লোড হচ্ছে...
                    </span>
                  </div>
                )}

                {!loadingPrevItems && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {invItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`grid gap-2 items-end ${editingInvIdx === idx ? "grid-cols-[1fr_80px_100px_32px_32px]" : "grid-cols-[1fr_80px_100px_32px_32px]"}`}
                    >
                      {editingInvIdx === idx ? (
                        <>
                          <div className="space-y-1">
                            {idx === 0 && (
                              <span className="text-xs text-muted-foreground">
                                মালামালের নাম
                              </span>
                            )}
                            <Input
                              placeholder="নাম"
                              value={item.itemName}
                              onChange={(e) =>
                                updateInvRow(idx, "itemName", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            {idx === 0 && (
                              <span className="text-xs text-muted-foreground">
                                পরিমাণ
                              </span>
                            )}
                            <Input
                              placeholder="১"
                              value={item.quantity}
                              onChange={(e) =>
                                updateInvRow(idx, "quantity", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            {idx === 0 && (
                              <span className="text-xs text-muted-foreground">
                                অবস্থা
                              </span>
                            )}
                            <Select
                              value={item.condition}
                              onValueChange={(v) =>
                                updateInvRow(idx, "condition", v)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ভালো">ভালো</SelectItem>
                                <SelectItem value="মাঝারি">মাঝারি</SelectItem>
                                <SelectItem value="খারাপ">খারাপ</SelectItem>
                                <SelectItem value="নস্ট">নস্ট</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 size-8 p-0"
                            onClick={() => setEditingInvIdx(null)}
                          >
                            <Edit3 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 size-8 p-0"
                            onClick={() => removeInvRow(idx)}
                            disabled={invItems.length <= 1}
                          >
                            <X className="size-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1">
                            {idx === 0 && (
                              <span className="text-xs text-muted-foreground">
                                মালামালের নাম
                              </span>
                            )}
                            <div className="flex items-center h-9 px-3 rounded-md border bg-white text-sm">
                              {item.itemName || <span className="text-muted-foreground">নাম</span>}
                            </div>
                          </div>
                          <div className="space-y-1">
                            {idx === 0 && (
                              <span className="text-xs text-muted-foreground">
                                পরিমাণ
                              </span>
                            )}
                            <div className="flex items-center h-9 px-3 rounded-md border bg-white text-sm">
                              {item.quantity}
                            </div>
                          </div>
                          <div className="space-y-1">
                            {idx === 0 && (
                              <span className="text-xs text-muted-foreground">
                                অবস্থা
                              </span>
                            )}
                            <div className="flex items-center h-9 px-3 rounded-md border bg-white">
                              {getConditionBadge(item.condition)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 size-8 p-0"
                            onClick={() => setEditingInvIdx(idx)}
                          >
                            <Edit3 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 size-8 p-0"
                            onClick={() => removeInvRow(idx)}
                            disabled={invItems.length <= 1}
                          >
                            <X className="size-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>
            )}

            {addDialogTab === "empty" && (
            <div className="space-y-4">
              {/* Building selector */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">বিল্ডিং নির্বাচন করুন</Label>
                <Select value={emptyBuildingId} onValueChange={(v) => {
                  setEmptyBuildingId(v);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="বিল্ডিং বেছে নিন" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Floor-wise empty rooms list */}
              {emptyBuildingId && (() => {
                const bldg = buildings.find(b => b.id === emptyBuildingId);
                if (!bldg || !bldg.floors?.length) return (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="size-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">এই বিল্ডিংয়ে কোন তলা নেই</p>
                  </div>
                );

                const capacity = bldg.capacityPerRoom || 1;

                // Compute stats
                let totalRooms = 0;
                let totalEmptySeats = 0;
                let totalFullRooms = 0;
                bldg.floors.forEach(floor => {
                  (floor.rooms || []).forEach(room => {
                    totalRooms++;
                    const active = (room.tenants?.filter(t => t.isActive) || []).length;
                    const empty = capacity - active;
                    if (empty > 0) totalEmptySeats += empty;
                    else totalFullRooms++;
                  });
                });

                const sortedFloors = [...bldg.floors].sort((a, b) => b.floorNumber - a.floorNumber);

                return (
                  <div className="space-y-3">
                    {/* Summary cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-lg font-bold text-blue-700">{toBanglaNumber(totalRooms)}</p>
                        <p className="text-[10px] text-blue-500 mt-0.5">মোট রুম</p>
                      </div>
                      <div className="text-center p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-lg font-bold text-amber-600">{toBanglaNumber(totalEmptySeats)}</p>
                        <p className="text-[10px] text-amber-500 mt-0.5">খালি সিট</p>
                      </div>
                      <div className="text-center p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                        <p className="text-lg font-bold text-emerald-600">{toBanglaNumber(totalFullRooms)}</p>
                        <p className="text-[10px] text-emerald-500 mt-0.5">পূর্ণ রুম</p>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-3 px-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="inline-block size-2.5 rounded bg-amber-400" /> খালি সিট</span>
                      <span className="flex items-center gap-1"><span className="inline-block size-2.5 rounded bg-emerald-500" /> ভর্তি সিট</span>
                      {capacity > 1 && <span className="flex items-center gap-1"><BedDouble className="size-3 text-blue-500" /> প্রতি রুমে {toBanglaNumber(capacity)} সিট</span>}
                    </div>

                    {/* Visual Floor Plan */}
                    <div className="space-y-2">
                      {sortedFloors.map(floor => {
                        const floorRooms = floor.rooms || [];
                        const roomsWithStatus = floorRooms.map(room => {
                          const activeTenants = room.tenants?.filter(t => t.isActive) || [];
                          const emptySeats = capacity - activeTenants.length;
                          return { ...room, activeTenants, emptySeats, isFull: emptySeats <= 0 };
                        });
                        const emptyRoomCount = roomsWithStatus.filter(r => r.emptySeats > 0).length;
                        const hasEmpty = emptyRoomCount > 0;
                        const totalSeats = floorRooms.length * capacity;
                        const emptySeatCount = roomsWithStatus.reduce((sum, r) => sum + r.emptySeats, 0);

                        return (
                          <div key={floor.id} className={`${hasEmpty ? "bg-gradient-to-r from-amber-50/80 to-transparent border-amber-200" : "bg-gray-50/50 border-gray-200"} border rounded-xl overflow-hidden`}>
                            {/* Floor header */}
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl ${hasEmpty ? "bg-gradient-to-r from-indigo-600 to-purple-600" : "bg-gradient-to-r from-slate-500 to-slate-600"}`}>
                              <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-md text-white ${hasEmpty ? "bg-white/20" : "bg-white/15"}`}>
                                {toBanglaNumber(floor.floorNumber)}
                              </span>
                              <span className="text-sm font-semibold text-white tracking-wide">
                                {toBanglaNumber(floor.floorNumber)} তলা
                              </span>
                              <div className="ml-auto flex items-center gap-1.5">
                                {hasEmpty && (
                                  <span className="text-[10px] font-bold text-indigo-900 bg-yellow-300 px-2 py-0.5 rounded-full shadow-sm">
                                    খালি {toBanglaNumber(emptySeatCount)}
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold text-white bg-white/15 px-2 py-0.5 rounded-full">
                                  সিট {toBanglaNumber(totalSeats)}
                                </span>
                              </div>
                            </div>

                            {/* Room grid */}
                            <div className="p-2 grid gap-1.5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${capacity > 1 ? "155px" : "130px"}, 1fr))` }}>
                              {roomsWithStatus.map(room => {
                                if (room.isFull) {
                                  return (
                                    <div key={room.id} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 opacity-60">
                                      <div className="shrink-0">
                                        <div className="flex gap-0.5">
                                          {Array.from({ length: capacity }).map((_, i) => (
                                            <div key={i} className="size-2.5 bg-emerald-500 rounded-full" />
                                          ))}
                                        </div>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-emerald-700 truncate">{room.roomNumber}</p>
                                        <p className="text-[10px] text-emerald-500 truncate">{room.activeTenants.map(t => t.name).join(", ")}</p>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    key={room.id}
                                    type="button"
                                    className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border-2 border-amber-300 hover:bg-amber-100 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
                                    onClick={() => {
                                      setTBuildingId(bldg.id);
                                      setTFloorId(floor.id);
                                      setTRoomId(room.id);
                                      setAddDialogTab("add");
                                    }}
                                  >
                                    {/* Seat indicators */}
                                    <div className="flex gap-1 shrink-0">
                                      {Array.from({ length: capacity }).map((_, i) => (
                                        <div
                                          key={i}
                                          className={`size-4 rounded-full flex items-center justify-center ${room.activeTenants[i] ? "bg-emerald-500" : "border-2 border-dashed border-amber-400 bg-amber-100"}`}
                                          title={room.activeTenants[i]?.name || `সিট ${toBanglaNumber(i + 1)} - খালি`}
                                        >
                                          {!room.activeTenants[i] && <div className="size-1.5 bg-amber-500 rounded-full" />}
                                        </div>
                                      ))}
                                    </div>

                                    <div className="min-w-0 text-left">
                                      <p className="text-xs font-bold text-amber-800 truncate">{room.roomNumber}</p>
                                      {room.activeTenants.length > 0 && (
                                        <p className="text-[10px] text-gray-500 truncate">{room.activeTenants.map(t => t.name).join(", ")}</p>
                                      )}
                                      {room.activeTenants.length === 0 && (
                                        <p className="text-[10px] text-amber-500 font-medium">সম্পূর্ণ খালি</p>
                                      )}
                                    </div>
                                    <Plus className="size-3 text-amber-400 group-hover:text-amber-600 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Click hint */}
                    <p className="text-center text-[10px] text-muted-foreground mt-1">
                      খালি রুমে ক্লিক করুন — ভাড়াটে যোগ করুন
                    </p>
                  </div>
                );
              })()}

              {!emptyBuildingId && (
                <div className="text-center py-10 text-muted-foreground">
                  <BedDouble className="size-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">বিল্ডিং নির্বাচন করলে খালি রুম ও সিটের তালিকা দেখা যাবে</p>
                </div>
              )}
            </div>
            )}

            {addDialogTab === "add" && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddOpen(false);
                  resetAddForm();
                }}
              >
                বাতিল
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleAddTenant}
                disabled={addingTenant}
              >
                {addingTenant ? "যোগ হচ্ছে..." : "যোগ করুন"}
              </Button>
            </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
          )}
        </div>
      </div>

      {showGuestView ? (
        <GuestsTab />
      ) : (
        <>
      {/* Search filters */}
      <Card><CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">সার্চ:</span>
          <Select value={filterBuilding || "__all"} onValueChange={(v) => setFilterBuilding(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="বিল্ডিং বেছে নিন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">সব বিল্ডিং</SelectItem>
              {buildings.map((b) => (<SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterMonth} onValueChange={(v) => setFilterMonth(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="মাস বেছে নিন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">সব মাস</SelectItem>
              {BENGALI_MONTHS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterYear || "__all"} onValueChange={(v) => setFilterYear(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder="বছর" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">সব বছর</SelectItem>
              {availableYears.map((y) => (<SelectItem key={y} value={String(y)}>{toBanglaNumber(y)}</SelectItem>))}
            </SelectContent>
          </Select>
          {(filterBuilding || filterMonth || filterYear) && (<Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => { setFilterBuilding(""); setFilterMonth(""); setFilterYear(""); }}><X className="size-3 mr-1" />মুছুন</Button>)}
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 ml-auto" onClick={handleDownloadTenants}>
            <Download className="size-3" />
            XLSX ডাউনলোড
          </Button>
          <span className="text-xs text-muted-foreground">মোট: {toBanglaNumber(filteredTenants.length)} জন</span>
        </div>
      </CardContent></Card>

      {filteredTenants.length === 0 && !loading && (
        <Alert>
          <Users className="size-4" />
          <AlertDescription>
            কোনো ভাড়াটে নেই। নতুন ভাড়াটে যোগ করুন।
          </AlertDescription>
        </Alert>
      )}

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-emerald-50/50">
                <TableHead>নাম</TableHead>
                <TableHead>বিল্ডিং নাম</TableHead>
                <TableHead>পদবী</TableHead>
                <TableHead>রুম নম্বর</TableHead>
                <TableHead>ফোন</TableHead>
                <TableHead>শুরুর তারিখ</TableHead>
                <TableHead>অবস্থা</TableHead>
                <TableHead className="text-center">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">{tenant.buildingName || "-"}</Badge></TableCell>
                  <TableCell>{tenant.designation || "-"}</TableCell>
                  <TableCell>{tenant.room?.roomNumber}</TableCell>
                  <TableCell>{tenant.phone || "-"}</TableCell>
                  <TableCell>{formatDate(tenant.startDate)}</TableCell>
                  <TableCell>
                    {tenant.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300">
                        সক্রিয়
                      </Badge>
                    ) : (
                      <Badge variant="secondary">অসক্রিয়</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="size-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEditTenant(tenant)} title="এডিট করুন">
                        <Edit3 className="size-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="size-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openDeleteTenant(tenant)} title="মুছে ফেলুন">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>&quot;{deleteTenantName}&quot; কে মুছে ফেলবেন?</AlertDialogTitle>
                            <AlertDialogDescription>এই ভাড়াটের তথ্য স্থায়ীভাবে মুছে যাবে।</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>বাতিল</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteTenant} disabled={deletingTenant}>
                              {deletingTenant ? "মুছে ফেলা হচ্ছে..." : "মুছে ফেলুন"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      {tenant.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-orange-600 border-orange-300 hover:bg-orange-50 text-[11px]"
                          disabled={vacateLoading2}
                          onClick={async () => {
                            setVacateLoading2(true);
                            try {
                              setVacateTenant(tenant);
                              const res = await fetch(`/api/inventory?tenantId=${tenant.id}`);
                              if (res.ok) {
                                const items = await res.json();
                                if (Array.isArray(items) && items.length > 0) {
                                  setVacateItems(items.map((inv: any) => ({
                                    id: inv.id, itemName: inv.itemName, quantity: inv.quantity, condition: inv.condition, note: inv.note,
                                  })));
                                } else {
                                  setVacateItems([{ itemName: "", quantity: 1, condition: "ভালো" }]);
                                }
                              } else {
                                setVacateItems([{ itemName: "", quantity: 1, condition: "ভালো" }]);
                              }
                              setEditingVacateIdx(null);
                              setVacateOpen(true);
                            } catch {
                              setVacateItems([{ itemName: "", quantity: 1, condition: "ভালো" }]);
                            } finally {
                              setVacateLoading2(false);
                            }
                          }}
                        >
                          রুম ছাড়ুন
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {paginatedTenants.map((tenant) => (
          <Card key={tenant.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base">{tenant.name}</p>
                  {tenant.designation && <p className="text-xs text-blue-600 mt-0.5">{tenant.designation}</p>}
                  <p className="text-xs text-purple-600 font-medium mt-1">
                    <Building2 className="size-3 inline-block -mt-0.5 mr-1" />
                    {tenant.buildingName || "-"}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <BedDouble className="size-3" />
                    <span>রুম: {tenant.room?.roomNumber}</span>
                  </div>
                  {tenant.phone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <Phone className="size-3" />
                      <span>{tenant.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <Calendar className="size-3" />
                    <span>শুরু: {formatDate(tenant.startDate)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="size-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEditTenant(tenant)}>
                    <Edit3 className="size-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="size-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openDeleteTenant(tenant)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>&quot;{deleteTenantName}&quot; কে মুছে ফেলবেন?</AlertDialogTitle>
                        <AlertDialogDescription>এই ভাড়াটের তথ্য স্থায়ীভাবে মুছে যাবে।</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteTenant} disabled={deletingTenant}>
                          {deletingTenant ? "মুছে ফেলা হচ্ছে..." : "মুছে ফেলুন"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {tenant.isActive ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300">সক্রিয়</Badge>
                ) : (
                  <Badge variant="secondary">অসক্রিয়</Badge>
                )}
                {tenant.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-orange-600 border-orange-300 hover:bg-orange-50 text-[11px] flex-1"
                    disabled={vacateLoading2}
                    onClick={async () => {
                      setVacateLoading2(true);
                      try {
                        setVacateTenant(tenant);
                        const res = await fetch(`/api/inventory?tenantId=${tenant.id}`);
                        if (res.ok) {
                          const items = await res.json();
                          if (Array.isArray(items) && items.length > 0) {
                            setVacateItems(items.map((inv: any) => ({
                              id: inv.id, itemName: inv.itemName, quantity: inv.quantity, condition: inv.condition, note: inv.note,
                            })));
                          } else {
                            setVacateItems([{ itemName: "", quantity: 1, condition: "ভালো" }]);
                          }
                        } else {
                          setVacateItems([{ itemName: "", quantity: 1, condition: "ভালো" }]);
                        }
                        setEditingVacateIdx(null);
                        setVacateOpen(true);
                      } catch {
                        setVacateItems([{ itemName: "", quantity: 1, condition: "ভালো" }]);
                      } finally {
                        setVacateLoading2(false);
                      }
                    }}
                  >
                    রুম ছাড়ুন
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalTenantPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-3">
          <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={tenantPage <= 1} onClick={() => setTenantPage(tenantPage - 1)}>আগে</Button>
          {Array.from({ length: totalTenantPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={p === tenantPage ? "default" : "outline"} size="sm" className="h-7 w-7 text-xs p-0" onClick={() => setTenantPage(p)}>{p}</Button>
          ))}
          <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={tenantPage >= totalTenantPages} onClick={() => setTenantPage(tenantPage + 1)}>পরে</Button>
        </div>
      )}

      {/* Edit Tenant Dialog */}
      <Dialog open={editTenantOpen} onOpenChange={setEditTenantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Edit3 className="size-5" />
              ভাড়াটে তথ্য এডিট করুন
            </DialogTitle>
            <DialogDescription>
              ভাড়াটের নাম, পদবী বা ফোন নম্বর পরিবর্তন করুন
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTName">নাম</Label>
              <Input id="editTName" value={editTenantData.name} onChange={(e) => setEditTenantData(prev => ({ ...prev, name: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") handleSaveTenant(); }} autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTDesig">পদবী</Label>
              <Input id="editTDesig" value={editTenantData.designation} onChange={(e) => setEditTenantData(prev => ({ ...prev, designation: e.target.value }))} placeholder="পদবী" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTPhone">ফোন নম্বর</Label>
              <Input id="editTPhone" value={editTenantData.phone} onChange={(e) => setEditTenantData(prev => ({ ...prev, phone: e.target.value }))} placeholder="ফোন নম্বর" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTenantOpen(false)}>বাতিল</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveTenant} disabled={savingTenant || !editTenantData.name.trim()}>
              {savingTenant ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vacate Dialog */}
      <Dialog open={vacateOpen} onOpenChange={setVacateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ভাড়াটে রুম ছেড়ে দিন</DialogTitle>
            <DialogDescription>
              {vacateTenant?.name} রুম ছেড়ে দিচ্ছেন। মালামালের অবস্থা যাচাই করুন।
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">রুম নম্বর</p>
                <p className="font-semibold">
                  {vacateTenant?.room?.roomNumber}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">ভাড়াটে</p>
                <p className="font-semibold">
                  {vacateTenant?.name}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>মালামালের তালিকা</Label>
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={addVacateItem}>
                  <Plus className="size-3" />আইটেম যোগ
                </Button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {vacateItems.map((item, idx) => (
                  <div key={idx} className={`rounded-lg border p-2 ${editingVacateIdx === idx ? "bg-emerald-50/50 border-emerald-200" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-2">
                      {editingVacateIdx === idx ? (
                        <>
                          <div className="flex-1 grid grid-cols-[1fr_70px_100px_100px] gap-2 items-end">
                            {idx === 0 && (
                              <div className="col-span-4 grid grid-cols-[1fr_70px_100px_100px] gap-2">
                                <span className="text-[10px] text-muted-foreground">নাম</span>
                                <span className="text-[10px] text-muted-foreground">পরিমাণ</span>
                                <span className="text-[10px] text-muted-foreground">অবস্থা</span>
                                <span className="text-[10px] text-muted-foreground">নোট</span>
                              </div>
                            )}
                            <Input className="h-8 text-xs" value={item.itemName} onChange={(e) => updateVacateItem(idx, "itemName", e.target.value)} placeholder="মালামালের নাম" />
                            <Input className="h-8 text-xs" type="number" min={1} value={item.quantity} onChange={(e) => updateVacateItem(idx, "quantity", parseInt(e.target.value) || 1)} />
                            <Select value={item.condition} onValueChange={(v) => updateVacateItem(idx, "condition", v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ভালো">ভালো</SelectItem>
                                <SelectItem value="মাঝারি">মাঝারি</SelectItem>
                                <SelectItem value="খারাপ">খারাপ</SelectItem>
                                <SelectItem value="নস্ট">নস্ট</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input className="h-8 text-xs" value={item.note || ""} onChange={(e) => updateVacateItem(idx, "note", e.target.value)} placeholder="নোট" />
                          </div>
                          <Button variant="ghost" size="sm" className="size-7 p-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 shrink-0" onClick={() => setEditingVacateIdx(null)}>
                            <Edit3 className="size-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 flex items-center gap-3 text-sm min-w-0">
                            <span className="font-medium truncate min-w-0 flex-1">{item.itemName || "—"}</span>
                            <span className="text-xs text-muted-foreground shrink-0">×{item.quantity}</span>
                            <span className="shrink-0">{getConditionBadge(item.condition)}</span>
                            {item.note && <span className="text-[10px] text-muted-foreground truncate shrink-0 hidden sm:inline">({item.note})</span>}
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            <Button variant="ghost" size="sm" className="size-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => setEditingVacateIdx(idx)}>
                              <Edit3 className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="size-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeVacateItem(idx)} disabled={vacateItems.length <= 1}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVacateOpen(false)}>
              বাতিল
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleVacate}
              disabled={vacateLoading}
            >
              {vacateLoading ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              নিশ্চিত করুন — রুম ছেড়ে দিন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3 — Trouble Reports (Pending/Solved tabs + Month/Year search + Pagination)
// ═══════════════════════════════════════════════════════════════════════════

function TroublesTab() {
  const [reports, setReports] = useState<TroubleReport[]>([]);
  const { buildings } = useBuildingsContext();
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"pending" | "solved">("pending");
  const [searchMonth, setSearchMonth] = useState("");
  const [searchYear, setSearchYear] = useState("");
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [solvedPage, setSolvedPage] = useState(1);
  const PAGE_SIZE = 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [crBuildingId, setCrBuildingId] = useState("");
  const [crFloorId, setCrFloorId] = useState("");
  const [crRoomId, setCrRoomId] = useState("");
  const [crRoomNumber, setCrRoomNumber] = useState("");
  const [crDescription, setCrDescription] = useState("");
  const [crReportedBy, setCrReportedBy] = useState("");

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveReport, setResolveReport] = useState<TroubleReport | null>(null);
  const [rsNote, setRsNote] = useState("");
  const [rsResolvedBy, setRsResolvedBy] = useState("");
  const [rsNewItems, setRsNewItems] = useState<
    { itemName: string; quantity: string; condition: string; note: string }[]
  >([]);

  // Loading states
  const [creatingTrouble, setCreatingTrouble] = useState(false);
  const [resolvingTrouble, setResolvingTrouble] = useState(false);
  const [deletingTrouble, setDeletingTrouble] = useState(false);

  // Edit trouble dialog
  const [editTroubleOpen, setEditTroubleOpen] = useState(false);
  const [editTroubleData, setEditTroubleData] = useState<{ id: string; description: string; reportedBy: string }>({ id: "", description: "", reportedBy: "" });
  const [savingTrouble, setSavingTrouble] = useState(false);

  // Delete trouble dialog
  const [deleteTroubleId, setDeleteTroubleId] = useState("");
  const [deleteTroubleDesc, setDeleteTroubleDesc] = useState("");
  const [deleteTroubleOpen, setDeleteTroubleOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const tRes = await fetch("/api/troubles");
      if (!tRes.ok) throw new Error();
      const allReports: TroubleReport[] = await tRes.json();
      setReports(allReports);
      const years = [...new Set(allReports.map((r) => new Date(r.reportedAt).getFullYear()))].sort((a, b) => b - a);
      setAvailableYears(years);
    } catch {
      toast.error("তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getFilteredReports = useCallback(() => {
    if (!searchMonth && !searchYear) return reports;
    return reports.filter((r) => {
      const d = new Date(r.reportedAt);
      const mOk = !searchMonth || d.getMonth() + 1 === parseInt(searchMonth);
      const yOk = !searchYear || d.getFullYear() === parseInt(searchYear);
      return mOk && yOk;
    });
  }, [reports, searchMonth, searchYear]);

  const pendingReports = getFilteredReports().filter((r) => r.status !== "সমাধান হয়েছে");
  const solvedReports = getFilteredReports().filter((r) => r.status === "সমাধান হয়েছে");

  const totalPendingPages = Math.max(1, Math.ceil(pendingReports.length / PAGE_SIZE));
  const totalSolvedPages = Math.max(1, Math.ceil(solvedReports.length / PAGE_SIZE));
  const paginatedPending = pendingReports.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE);
  const paginatedSolved = solvedReports.slice((solvedPage - 1) * PAGE_SIZE, solvedPage * PAGE_SIZE);

  const crBuilding = buildings.find((b) => b.id === crBuildingId);
  const crFloor = crBuilding?.floors?.find((f) => f.id === crFloorId);
  const crRoom = crFloor?.rooms?.find((r) => r.id === crRoomId);

  useEffect(() => { if (crRoom) setCrRoomNumber(crRoom.roomNumber); else setCrRoomNumber(""); }, [crRoom]);
  useEffect(() => { setPendingPage(1); setSolvedPage(1); }, [searchMonth, searchYear]);

  const handleCreate = async () => {
    if (!crRoomId || !crDescription.trim() || !crReportedBy.trim()) { toast.error("রুম, বিবরণ ও প্রতিবেদকের নাম দিন"); return; }
    setCreatingTrouble(true);
    try {
      const res = await fetch("/api/troubles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomNumber: crRoomNumber, roomId: crRoomId, description: crDescription.trim(), reportedBy: crReportedBy.trim() }) });
      if (!res.ok) throw new Error();
      toast.success("ট্রাবল রিপোর্ট তৈরি হয়েছে");
      setCreateOpen(false); setCrBuildingId(""); setCrFloorId(""); setCrRoomId(""); setCrRoomNumber(""); setCrDescription(""); setCrReportedBy("");
      loadData();
    } catch { toast.error("ট্রাবল রিপোর্ট তৈরি করতে সমস্যা হয়েছে"); } finally { setCreatingTrouble(false); }
  };

  const handleResolve = async () => {
    if (!resolveReport || !rsResolvedBy.trim()) { toast.error("সমাধানকারীর নাম দিন"); return; }
    setResolvingTrouble(true);
    try {
      const res = await fetch("/api/troubles", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: resolveReport.id, resolutionNote: rsNote.trim() || null, resolvedBy: rsResolvedBy.trim(), newItems: rsNewItems.filter((i) => i.itemName.trim()) }) });
      if (!res.ok) throw new Error();
      toast.success("সমস্যা সমাধান হয়েছে");
      setResolveOpen(false); setResolveReport(null); setRsNote(""); setRsResolvedBy(""); setRsNewItems([]);
      loadData();
    } catch { toast.error("সমস্যা সমাধান করতে সমস্যা হয়েছে"); } finally { setResolvingTrouble(false); }
  };

  const addRsItem = useCallback(() => setRsNewItems((prev) => [...prev, { itemName: "", quantity: "1", condition: "ভালো", note: "" }]), []);
  const removeRsItem = useCallback((idx: number) => setRsNewItems((prev) => prev.filter((_, i) => i !== idx)), []);
  const updateRsItem = useCallback((idx: number, field: string, value: string) => setRsNewItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))), []);

  // Edit trouble handler
  const openEditTrouble = (report: TroubleReport) => {
    setEditTroubleData({ id: report.id, description: report.description, reportedBy: report.reportedBy });
    setEditTroubleOpen(true);
  };
  const handleSaveTrouble = async () => {
    if (!editTroubleData.description.trim()) { toast.error("বিবরণ দিন"); return; }
    setSavingTrouble(true);
    try {
      const res = await fetch("/api/troubles", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editTroubleData.id, description: editTroubleData.description.trim(), reportedBy: editTroubleData.reportedBy.trim() }) });
      if (!res.ok) throw new Error();
      toast.success("রিপোর্ট আপডেট হয়েছে");
      setEditTroubleOpen(false);
      loadData();
    } catch { toast.error("আপডেট করতে সমস্যা হয়েছে"); } finally { setSavingTrouble(false); }
  };

  // Delete trouble handler
  const openDeleteTrouble = (report: TroubleReport) => {
    setDeleteTroubleId(report.id);
    setDeleteTroubleDesc(report.description);
    setDeleteTroubleOpen(true);
  };
  const handleDeleteTrouble = async () => {
    setDeletingTrouble(true);
    try {
      const res = await fetch("/api/troubles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteTroubleId }) });
      if (!res.ok) throw new Error();
      toast.success("রিপোর্ট মুছে ফেলা হয়েছে");
      setDeleteTroubleOpen(false);
      loadData();
    } catch { toast.error("মুছে ফেলতে সমস্যা হয়েছে"); } finally { setDeletingTrouble(false); }
  };

  // XLSX download for trouble reports
  const handleDownloadTroubles = async () => {
    const filtered = getFilteredReports();
    if (filtered.length === 0) { toast.error("ডাউনলোড করার মতো কোনো রিপোর্ট নেই"); return; }
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("ট্রাবল রিপোর্ট");
      const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF22C55E" } };
      const headerFont = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      const border = { bottom: { style: "thin", color: { argb: "FF000000" } } };
      const headers = ["ক্রম", "রুম", "বিবরণ", "প্রতিবেদক", "রিপোর্টের তারিখ", "অবস্থা", "সমাধানকারী", "সমাধানের তারিখ", "সমাধানের বিবরণ"];
      const headerRow = sheet.addRow(headers);
      headerRow.eachCell((cell) => { cell.fill = headerFill; cell.font = headerFont; cell.border = border; cell.alignment = { horizontal: "center", vertical: "middle" }; });
      headerRow.height = 28;
      filtered.forEach((r, idx) => {
        const row = sheet.addRow([idx + 1, r.roomNumber, r.description, r.reportedBy, r.reportedAt ? new Date(r.reportedAt).toLocaleDateString("bn-BD") : "-", r.status, r.resolvedBy || "-", r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString("bn-BD") : "-", r.resolutionNote || "-"]);
        row.eachCell((cell, colNumber) => { cell.border = border; cell.alignment = { horizontal: colNumber <= 1 ? "center" : "left", vertical: "middle" }; });
      });
      sheet.columns.forEach((col) => { col.width = 18; });
      sheet.getColumn(1).width = 6;
      sheet.getColumn(3).width = 30;
      sheet.getColumn(9).width = 25;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ট্রাবল_রিপোর্ট${searchMonth ? `_${BENGALI_MONTHS[parseInt(searchMonth) - 1]?.label}` : ""}${searchYear ? `_${searchYear}` : ""}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("XLSX ডাউনলোড হয়েছে");
    } catch { toast.error("ডাউনলোড করতে সমস্যা হয়েছে"); }
  };

  if (loading) return (<div className="flex flex-col items-center justify-center py-20 gap-3"><div className="size-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /><p className="text-sm text-muted-foreground">তথ্য লোড হচ্ছে...</p></div>);

  const Pagination = ({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-1 mt-3">
        <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>আগে</Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (<Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-7 w-7 text-xs p-0" onClick={() => onPageChange(p)}>{p}</Button>))}
        <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>পরে</Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold flex items-center gap-2"><AlertTriangle className="size-5 text-emerald-600" />ট্রাবল রিপোর্ট</h2>
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setCrBuildingId(""); setCrFloorId(""); setCrRoomId(""); setCrRoomNumber(""); setCrDescription(""); setCrReportedBy(""); } }}>
          <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"><Plus className="size-4" />নতুন রিপোর্ট</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>নতুন ট্রাবল রিপোর্ট</DialogTitle><DialogDescription>সমস্যার বিবরণ এবং রুম নির্বাচন করুন</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label>বিল্ডিং</Label><Select value={crBuildingId} onValueChange={(v) => { setCrBuildingId(v); setCrFloorId(""); setCrRoomId(""); }}><SelectTrigger className="w-full"><SelectValue placeholder="বিল্ডিং" /></SelectTrigger><SelectContent>{buildings.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>তলা</Label><Select value={crFloorId} onValueChange={(v) => { setCrFloorId(v); setCrRoomId(""); }} disabled={!crBuildingId}><SelectTrigger className="w-full"><SelectValue placeholder="তলা" /></SelectTrigger><SelectContent>{crBuilding?.floors?.map((f) => (<SelectItem key={f.id} value={f.id}>{f.floorNumber} তলা</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>রুম</Label><Select value={crRoomId} onValueChange={setCrRoomId} disabled={!crFloorId}><SelectTrigger className="w-full"><SelectValue placeholder="রুম" /></SelectTrigger><SelectContent>{crFloor?.rooms?.map((r) => (<SelectItem key={r.id} value={r.id}>{r.roomNumber}</SelectItem>))}</SelectContent></Select></div>
              </div>
              <div className="space-y-1.5"><Label>সমস্যার বিবরণ *</Label><Textarea placeholder="সমস্যার বিস্তারিত লিখুন..." value={crDescription} onChange={(e) => setCrDescription(e.target.value)} rows={3} /></div>
              <div className="space-y-1.5"><Label>প্রতিবেদকের নাম *</Label><Input placeholder="যে রিপোর্ট করছেন" value={crReportedBy} onChange={(e) => setCrReportedBy(e.target.value)} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>বাতিল</Button><Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreate} disabled={creatingTrouble}>{creatingTrouble ? "জমা হচ্ছে..." : "জমা দিন"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search filters */}
      <Card><CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">সার্চ:</span>
          <Select value={searchMonth} onValueChange={(v) => setSearchMonth(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="মাস বেছে নিন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">সব মাস</SelectItem>
              {BENGALI_MONTHS.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={searchYear || "__all"} onValueChange={(v) => setSearchYear(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue placeholder="বছর" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">সব বছর</SelectItem>
              {availableYears.map((y) => (<SelectItem key={y} value={String(y)}>{toBanglaNumber(y)}</SelectItem>))}
            </SelectContent>
          </Select>
          {(searchMonth || searchYear) && (<Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => { setSearchMonth(""); setSearchYear(""); }}><X className="size-3 mr-1" />মুছুন</Button>)}
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 ml-auto" onClick={handleDownloadTroubles}><Download className="size-3" />XLSX ডাউনলোড</Button>
        </div>
      </CardContent></Card>

      {/* Sub-tabs */}
      <div className="flex bg-gray-100 rounded-lg p-0.5">
        <button type="button" className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeSubTab === "pending" ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"}`} onClick={() => setActiveSubTab("pending")}>
          <Clock className="size-3.5" />কাজ চলমান<Badge variant="secondary" className={`text-[10px] h-4 px-1.5 ${activeSubTab === "pending" ? "bg-white/20 text-white border-white/30" : ""}`}>{pendingReports.length}</Badge>
        </button>
        <button type="button" className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeSubTab === "solved" ? "bg-emerald-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"}`} onClick={() => setActiveSubTab("solved")}>
          <CheckCircle2 className="size-3.5" />সমাধান হয়েছে
        </button>
      </div>

      {/* Pending */}
      {activeSubTab === "pending" && (
        paginatedPending.length === 0 ? (
          <Alert><Clock className="size-4" /><AlertDescription>কোনো পেন্ডিং ট্রাবল রিপোর্ট নেই।</AlertDescription></Alert>
        ) : (<>
          <Card className="hidden md:block"><CardContent className="p-0"><Table><TableHeader><TableRow className="bg-orange-50/50"><TableHead>রুম</TableHead><TableHead>বিবরণ</TableHead><TableHead>প্রতিবেদক</TableHead><TableHead>তারিখ</TableHead><TableHead>অবস্থা</TableHead><TableHead className="text-center">অ্যাকশন</TableHead></TableRow></TableHeader><TableBody>
            {paginatedPending.map((report) => (<TableRow key={report.id}><TableCell className="font-medium">{report.roomNumber}</TableCell><TableCell className="max-w-xs truncate">{report.description}</TableCell><TableCell>{report.reportedBy}</TableCell><TableCell className="text-sm text-muted-foreground">{formatDate(report.reportedAt)}</TableCell><TableCell>{getStatusBadge(report.status)}</TableCell><TableCell><div className="flex items-center justify-center gap-1"><Button variant="ghost" size="sm" className="size-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEditTrouble(report)} title="এডিট"><Edit3 className="size-3.5" /></Button><Button variant="outline" size="sm" className="gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50 text-[11px]" onClick={() => { setResolveReport(report); setRsNote(""); setRsResolvedBy(""); setRsNewItems([]); setResolveOpen(true); }}><CheckCircle2 className="size-3" />সমাধান</Button><Button variant="ghost" size="sm" className="size-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openDeleteTrouble(report)} title="মুছুন"><Trash2 className="size-3.5" /></Button></div></TableCell></TableRow>))}
          </TableBody></Table></CardContent></Card>
          <div className="md:hidden space-y-3">
            {paginatedPending.map((report) => (<Card key={report.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-2"><div className="flex-1"><div className="flex items-center gap-2 mb-1"><BedDouble className="size-3.5 text-emerald-600" /><span className="font-semibold">রুম: {report.roomNumber}</span></div><p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p><div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground"><span>প্রতিবেদক: {report.reportedBy}</span><span>{formatDate(report.reportedAt)}</span></div></div><div className="flex gap-1 shrink-0"><Button variant="ghost" size="sm" className="size-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEditTrouble(report)}><Edit3 className="size-3.5" /></Button><Button variant="ghost" size="sm" className="size-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openDeleteTrouble(report)}><Trash2 className="size-3.5" /></Button><div>{getStatusBadge(report.status)}</div></div></div><Button variant="outline" size="sm" className="mt-3 w-full gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => { setResolveReport(report); setRsNote(""); setRsResolvedBy(""); setRsNewItems([]); setResolveOpen(true); }}><CheckCircle2 className="size-3" />সমাধান</Button></CardContent></Card>))}
          </div>
          <Pagination page={pendingPage} totalPages={totalPendingPages} onPageChange={setPendingPage} />
        </>)
      )}

      {/* Solved */}
      {activeSubTab === "solved" && (
        paginatedSolved.length === 0 ? (
          <Alert><CheckCircle2 className="size-4" /><AlertDescription>কোনো সমাধান হওয়া রিপোর্ট নেই।</AlertDescription></Alert>
        ) : (<>
          <Card className="hidden md:block"><CardContent className="p-0"><Table><TableHeader><TableRow className="bg-emerald-50/50"><TableHead>রুম</TableHead><TableHead>বিবরণ</TableHead><TableHead>প্রতিবেদক</TableHead><TableHead>তারিখ</TableHead><TableHead>সমাধানকারী</TableHead><TableHead>সমাধানের তারিখ</TableHead><TableHead className="text-center">অ্যাকশন</TableHead></TableRow></TableHeader><TableBody>
            {paginatedSolved.map((report) => (<TableRow key={report.id}><TableCell className="font-medium">{report.roomNumber}</TableCell><TableCell className="max-w-xs truncate">{report.description}</TableCell><TableCell>{report.reportedBy}</TableCell><TableCell className="text-sm text-muted-foreground">{formatDate(report.reportedAt)}</TableCell><TableCell>{report.resolvedBy || "-"}</TableCell><TableCell className="text-sm text-muted-foreground">{report.resolvedAt ? formatDate(report.resolvedAt) : "-"}</TableCell><TableCell><div className="flex items-center justify-center gap-1"><Button variant="ghost" size="sm" className="size-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEditTrouble(report)} title="এডিট"><Edit3 className="size-3.5" /></Button><Button variant="ghost" size="sm" className="size-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openDeleteTrouble(report)} title="মুছুন"><Trash2 className="size-3.5" /></Button></div></TableCell></TableRow>))}
          </TableBody></Table></CardContent></Card>
          <div className="md:hidden space-y-3">
            {paginatedSolved.map((report) => (<Card key={report.id}><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><BedDouble className="size-3.5 text-emerald-600" /><span className="font-semibold">রুম: {report.roomNumber}</span><span className="ml-auto">{getStatusBadge(report.status)}</span></div><p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>{report.resolutionNote && (<p className="text-xs text-emerald-700 mt-1 bg-emerald-50 rounded px-2 py-1">সমাধান: {report.resolutionNote}</p>)}<div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground"><span>প্রতিবেদক: {report.reportedBy}</span><span>সমাধানকারী: {report.resolvedBy || "-"}</span></div><div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground"><span>তারিখ: {formatDate(report.reportedAt)}</span>{report.resolvedAt && <span>সমাধান: {formatDate(report.resolvedAt)}</span>}</div></CardContent></Card>))}
          </div>
          <Pagination page={solvedPage} totalPages={totalSolvedPages} onPageChange={setSolvedPage} />
        </>)
      )}

      {/* Edit Trouble Dialog */}
      <Dialog open={editTroubleOpen} onOpenChange={setEditTroubleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600"><Edit3 className="size-5" />রিপোর্ট এডিট করুন</DialogTitle>
            <DialogDescription>ট্রাবল রিপোর্টের বিবরণ বা প্রতিবেদকের নাম পরিবর্তন করুন</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>সমস্যার বিবরণ</Label><Textarea value={editTroubleData.description} onChange={(e) => setEditTroubleData(prev => ({ ...prev, description: e.target.value }))} rows={3} /></div>
            <div className="space-y-2"><Label>প্রতিবেদকের নাম</Label><Input value={editTroubleData.reportedBy} onChange={(e) => setEditTroubleData(prev => ({ ...prev, reportedBy: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTroubleOpen(false)}>বাতিল</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveTrouble} disabled={savingTrouble}>{savingTrouble ? "সেভ হচ্ছে..." : "সেভ করুন"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Trouble Dialog */}
      <Dialog open={deleteTroubleOpen} onOpenChange={setDeleteTroubleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">রিপোর্ট মুছে ফেলবেন?</DialogTitle>
            <DialogDescription>&quot;{deleteTroubleDesc}&quot; — এই ট্রাবল রিপোর্ট স্থায়ীভাবে মুছে যাবে।</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTroubleOpen(false)}>বাতিল</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteTrouble} disabled={deletingTrouble}>{deletingTrouble ? "মুছে ফেলা হচ্ছে..." : "মুছে ফেলুন"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>সমস্যা সমাধান</DialogTitle><DialogDescription>রুম {resolveReport?.roomNumber} - {resolveReport?.description}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm"><p className="text-muted-foreground">মূল সমস্যা: {resolveReport?.description}</p><p className="text-muted-foreground">প্রতিবেদক: {resolveReport?.reportedBy} • তারিখ: {resolveReport && formatDate(resolveReport.reportedAt)}</p></div>
            <div className="space-y-1.5"><Label>সমাধানকারীর নাম *</Label><Input placeholder="যিনি সমাধান করেছেন" value={rsResolvedBy} onChange={(e) => setRsResolvedBy(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>সমাধানের বিবরণ</Label><Textarea placeholder="সমস্যা কীভাবে সমাধান করা হয়েছে..." value={rsNote} onChange={(e) => setRsNote(e.target.value)} rows={3} /></div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>নতুন মালামাল যোগ (যদি মেরামতে নতুন কিছু যোগ হয়)</Label><Button variant="outline" size="sm" className="gap-1 text-xs" onClick={addRsItem}><Plus className="size-3" />আইটেম</Button></div>
              {rsNewItems.length > 0 ? (<div className="space-y-2 max-h-60 overflow-y-auto">{rsNewItems.map((item, idx) => (<div key={idx} className="grid grid-cols-[1fr_70px_90px_1fr_32px] gap-2 items-end"><div className="space-y-1">{idx === 0 && <span className="text-xs text-muted-foreground">নাম</span>}<Input placeholder="নাম" value={item.itemName} onChange={(e) => updateRsItem(idx, "itemName", e.target.value)} /></div><div className="space-y-1">{idx === 0 && <span className="text-xs text-muted-foreground">পরিমাণ</span>}<Input placeholder="১" value={item.quantity} onChange={(e) => updateRsItem(idx, "quantity", e.target.value)} /></div><div className="space-y-1">{idx === 0 && <span className="text-xs text-muted-foreground">অবস্থা</span>}<Select value={item.condition} onValueChange={(v) => updateRsItem(idx, "condition", v)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ভালো">ভালো</SelectItem><SelectItem value="মাঝারি">মাঝারি</SelectItem><SelectItem value="খারাপ">খারাপ</SelectItem><SelectItem value="নস্ট">নস্ট</SelectItem></SelectContent></Select></div><div className="space-y-1">{idx === 0 && <span className="text-xs text-muted-foreground">নোট</span>}<Input placeholder="নোট" value={item.note} onChange={(e) => updateRsItem(idx, "note", e.target.value)} /></div><Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50 size-8 p-0" onClick={() => removeRsItem(idx)}><X className="size-4" /></Button></div>))}</div>) : (<p className="text-xs text-muted-foreground">মেরামতে নতুন কোনো মালামাল যোগ হলে উপরে &quot;আইটেম&quot; বাটনে ক্লিক করুন</p>)}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setResolveOpen(false)}>বাতিল</Button><Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleResolve} disabled={resolvingTrouble}>{resolvingTrouble ? "সমাধান হচ্ছে..." : "সমাধান নিশ্চিত করুন"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 — Room-wise Search (Tenants + Inventory combined view)
// ═══════════════════════════════════════════════════════════════════════════

interface RoomWiseData {
  roomNumber: string;
  currentTenants: {
    id: string; name: string; designation: string | null; phone: string | null; startDate: string;
  }[];
  previousTenants: {
    id: string; name: string; designation: string | null; phone: string | null;
    startDate: string; endDate: string | null;
  }[];
  currentInventory: {
    id: string; itemName: string; quantity: number; condition: string;
    note: string | null; addedDate: string; tenantId: string | null;
    tenantName: string | null;
  }[];
  previousInventory: {
    id: string; itemName: string; quantity: number; condition: string;
    note: string | null; addedDate: string; tenantId: string | null;
    tenantName: string | null;
  }[];
  vacateRecords: {
    id: string; tenantId: string; tenantName: string;
    vacatedAt: string; inventorySnapshot: string;
  }[];
}

interface VacateInventoryItem {
  id?: string;
  itemName: string;
  quantity: number;
  condition: string;
  note?: string | null;
  _delete?: boolean;
}

function getConditionBadge(condition: string) {
  const cls =
    condition === "ভালো"
      ? "border-emerald-300 text-emerald-700"
      : condition === "মাঝারি"
        ? "border-yellow-300 text-yellow-700"
        : condition === "নস্ট"
          ? "border-violet-300 text-violet-700 bg-violet-50"
          : "border-red-300 text-red-700";
  return (
    <Badge variant="outline" className={cls}>
      {condition}
    </Badge>
  );
}

function OverviewTab() {
  const { buildings } = useBuildingsContext();
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [searched, setSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [data, setData] = useState<(RoomWiseData & { mode?: string; rooms?: any[] }) | null>(null);
  const [overviewSubTab, setOverviewSubTab] = useState<"tenants" | "inventory">("tenants");
  const [prevPage, setPrevPage] = useState(1);
  const prevPerPage = 10;

  const [editTenantOpen, setEditTenantOpen] = useState(false);
  const [editTenantData, setEditTenantData] = useState<{ id: string; name: string; designation: string; phone: string; } | null>(null);
  const [editInvOpen, setEditInvOpen] = useState(false);
  const [editInvItem, setEditInvItem] = useState<{ id: string; itemName: string; quantity: number; condition: string; note: string | null; } | null>(null);
  const [addInvOpen, setAddInvOpen] = useState(false);
  const [addInvName, setAddInvName] = useState("");
  const [addInvQty, setAddInvQty] = useState("1");
  const [addInvCondition, setAddInvCondition] = useState("ভালো");
  const [addInvNote, setAddInvNote] = useState("");
  const [addInvTenantId, setAddInvTenantId] = useState("");
  const [vacateOpen, setVacateOpen] = useState(false);
  const [vacateItems, setVacateItems] = useState<VacateInventoryItem[]>([]);
  const [vacateLoading, setVacateLoading] = useState(false);
  const [editingVacateIdx, setEditingVacateIdx] = useState<number | null>(null);
  const [expandedPrevTenant, setExpandedPrevTenant] = useState<string | null>(null);

  // Loading states
  const [editingTenant, setEditingTenant] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState(false);
  const [editingInv, setEditingInv] = useState(false);
  const [deletingInv, setDeletingInv] = useState(false);
  const [addingInv, setAddingInv] = useState(false);

  const selectedBuilding = buildings.find((b) => b.id === buildingId);
  const selectedFloor = selectedBuilding?.floors?.find((f) => f.id === floorId);

  // Derive building name and floor number for hierarchy display
  const selectedBuildingName = selectedBuilding?.name || "";
  const selectedFloorNumber = selectedFloor?.floorNumber || null;

  const handleSearch = async () => {
    if (!buildingId) { toast.error("বিল্ডিং নির্বাচন করুন"); return; }
    try {
      setSearchLoading(true);
      let url = `/api/room-wise-data?buildingId=${buildingId}`;
      if (roomId) {
        url = `/api/room-wise-data?roomId=${roomId}`;
      } else if (floorId) {
        url = `/api/room-wise-data?buildingId=${buildingId}&floorId=${floorId}`;
      }
      console.log('[Search] URL:', url, '| buildingId:', buildingId, '| floorId:', floorId, '| roomId:', roomId);
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `HTTP ${res.status}`);
      }
      const result = await res.json();
      console.log('[Search] Result:', JSON.stringify(result).substring(0, 300));
      if (result.mode === 'allRooms' && (!result.rooms || result.rooms.length === 0)) {
        toast.info(`${selectedBuildingName} বিল্ডিং এ কোনো রুম পাওয়া যায়নি`);
      }
      setData(result);
      setSearched(true); setPrevPage(1);
    } catch (err: any) {
      console.error('[Search] Error:', err);
      toast.error(err?.message || "তথ্য লোড করতে সমস্যা হয়েছে");
    } finally { setSearchLoading(false); }
  };

  const [vacateTenantId, setVacateTenantId] = useState<string | null>(null);

  const openVacateDialog = (tenantId?: string) => {
    const targetId = tenantId || (data?.currentTenants?.[0]?.id);
    if (!targetId) return;
    setVacateTenantId(targetId);
    const items: VacateInventoryItem[] = data.currentInventory.map((inv) => ({ id: inv.id, itemName: inv.itemName, quantity: inv.quantity, condition: inv.condition, note: inv.note }));
    setVacateItems(items.length > 0 ? items : [{ itemName: "", quantity: 1, condition: "ভালো" }]);
    setEditingVacateIdx(null);
    setVacateOpen(true);
  };
  const updateVacateItem = (idx: number, field: keyof VacateInventoryItem, value: string | number) => { setVacateItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))); };
  const removeVacateItem = (idx: number) => { if (vacateItems.length <= 1) return; setVacateItems((prev) => prev.filter((_, i) => i !== idx)); };
  const addVacateItem = () => { setVacateItems((prev) => [...prev, { itemName: "", quantity: 1, condition: "ভালো" }]); };

  const handleVacate = async () => {
    if (!vacateTenantId) return;
    try {
      setVacateLoading(true);
      const res = await fetch("/api/vacate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantId: vacateTenantId, inventoryItems: vacateItems.filter((item) => item.itemName.trim() || item.id) }) });
      if (!res.ok) { const errData = await res.json(); toast.error(errData.error || "রুম ছেড়ে দিতে সমস্যা হয়েছে"); return; }
      toast.success("ভাড়াটে রুম ছেড়ে দিয়েছেন"); setVacateOpen(false); handleSearch();
    } catch { toast.error("রুম ছেড়ে দিতে সমস্যা হয়েছে"); } finally { setVacateLoading(false); }
  };

  const handleEditTenant = async () => {
    if (!editTenantData) return;
    setEditingTenant(true);
    try { const res = await fetch("/api/tenants", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editTenantData.id, action: "updateInfo", name: editTenantData.name, designation: editTenantData.designation, phone: editTenantData.phone || null }) }); if (!res.ok) throw new Error(); toast.success("ভাড়াটে তথ্য আপডেট হয়েছে"); setEditTenantOpen(false); setEditTenantData(null); handleSearch(); } catch { toast.error("আপডেট করতে সমস্যা হয়েছে"); } finally { setEditingTenant(false); }
  };
  const handleDeleteTenant = async (id: string) => { setDeletingTenant(true); try { const res = await fetch("/api/tenants", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); if (!res.ok) throw new Error(); toast.success("ভাড়াটে মুছে ফেলা হয়েছে"); handleSearch(); } catch { toast.error("মুছে ফেলতে সমস্যা হয়েছে"); } finally { setDeletingTenant(false); } };
  const handleEditInventory = async () => { if (!editInvItem) return; setEditingInv(true); try { const res = await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editInvItem.id, itemName: editInvItem.itemName, quantity: editInvItem.quantity, condition: editInvItem.condition, note: editInvItem.note }) }); if (!res.ok) throw new Error(); toast.success("মালামাল আপডেট হয়েছে"); setEditInvOpen(false); setEditInvItem(null); handleSearch(); } catch { toast.error("মালামাল আপডেট করতে সমস্যা হয়েছে"); } finally { setEditingInv(false); } };
  const handleDeleteInventory = async (id: string) => { setDeletingInv(true); try { const res = await fetch("/api/inventory", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); if (!res.ok) throw new Error(); toast.success("মালামাল মুছে ফেলা হয়েছে"); handleSearch(); } catch { toast.error("মালামাল মুছে ফেলতে সমস্যা হয়েছে"); } finally { setDeletingInv(false); } };
  const handleAddInventory = async () => { if (!addInvName.trim() || !data) { toast.error("মালামালের নাম দিন"); return; } setAddingInv(true); try { const res = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemName: addInvName.trim(), quantity: parseInt(addInvQty) || 1, condition: addInvCondition, roomNumber: data.roomNumber, tenantId: addInvTenantId || null, roomId, note: addInvNote.trim() || null }) }); const resData = await res.json(); if (!res.ok) { toast.error(resData.error || "মালামাল যোগ করতে সমস্যা"); return; } toast.success("মালামাল যোগ হয়েছে"); setAddInvName(""); setAddInvQty("1"); setAddInvCondition("ভালো"); setAddInvNote(""); setAddInvOpen(false); handleSearch(); } catch { toast.error("মালামাল যোগ করতে সমস্যা"); } finally { setAddingInv(false); } };

  const totalPrevPages = data ? Math.ceil((data.previousTenants?.length || 0) / prevPerPage) : 0;
  const paginatedPrevTenants = data?.previousTenants?.slice((prevPage - 1) * prevPerPage, prevPage * prevPerPage) || [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2"><ClipboardList className="size-5 text-emerald-600" />রুমভিত্তিক তালিকা</h2>
      <Card><CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label>বিল্ডিং নির্বাচন</Label><Select value={buildingId} onValueChange={(v) => { setBuildingId(v); setFloorId(""); setRoomId(""); setSearched(false); setData(null); }}><SelectTrigger className="w-full"><SelectValue placeholder="বিল্ডিং বেছে নিন" /></SelectTrigger><SelectContent>{buildings.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>তলা নির্বাচন</Label><Select value={floorId || "__all"} onValueChange={(v) => { setFloorId(v === "__all" ? "" : v); setRoomId(""); setSearched(false); setData(null); }} disabled={!buildingId}><SelectTrigger className="w-full"><SelectValue placeholder="তলা বেছে নিন" /></SelectTrigger><SelectContent><SelectItem value="__all">সকল তলা</SelectItem>{selectedBuilding?.floors?.map((f) => (<SelectItem key={f.id} value={f.id}>{f.floorNumber} তলা</SelectItem>))}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>রুম নির্বাচন</Label><Select value={roomId || "__all"} onValueChange={(v) => { setRoomId(v === "__all" ? "" : v); setSearched(false); setData(null); }} disabled={!buildingId}><SelectTrigger className="w-full"><SelectValue placeholder={!buildingId ? "আগে বিল্ডিং বেছে নিন" : floorId ? "তলা নির্বাচিত" : "রুম বেছে নিন"} /></SelectTrigger><SelectContent><SelectItem value="__all">সকল রুম</SelectItem>{floorId ? (selectedFloor?.rooms?.map((room) => (<SelectItem key={room.id} value={room.id}><span className="flex items-center gap-2">{room.roomNumber}{room.tenants?.length > 0 && (<span className="size-2 rounded-full bg-emerald-500 inline-block" />)}</span></SelectItem>)) || []) : (selectedBuilding?.floors?.sort((a, b) => a.floorNumber - b.floorNumber).map((floor) => (<SelectGroup key={floor.id}><SelectLabel className="text-xs font-semibold text-muted-foreground bg-muted/50">{floor.floorNumber} তলা</SelectLabel>{floor.rooms?.map((room) => (<SelectItem key={room.id} value={room.id}><span className="flex items-center gap-2">{room.roomNumber}{room.tenants?.length > 0 && (<span className="size-2 rounded-full bg-emerald-500 inline-block" />)}</span></SelectItem>))}</SelectGroup>)))}</SelectContent></Select></div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button type="button" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${overviewSubTab === "tenants" ? "bg-emerald-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"}`} onClick={() => setOverviewSubTab("tenants")}>
              <Users className="size-3.5" />ভাড়াটে
            </button>
            <button type="button" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${overviewSubTab === "inventory" ? "bg-emerald-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"}`} onClick={() => setOverviewSubTab("inventory")}>
              <Package className="size-3.5" />মালামাল
            </button>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 px-6" onClick={handleSearch} disabled={searchLoading || !buildingId}>{searchLoading ? (<div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />) : (<Search className="size-4" />)}সার্চ করুন</Button>
        </div>
      </CardContent></Card>
      {!searched && (<Alert><Search className="size-4" /><AlertDescription>বিল্ডিং ও রুম নির্বাচন করে সার্চ করুন</AlertDescription></Alert>)}

      {searchLoading && (<div className="flex flex-col items-center justify-center py-16 gap-3"><div className="size-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /><p className="text-sm text-muted-foreground">তথ্য লোড হচ্ছে...</p></div>)}

      {searched && !searchLoading && data && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-100 text-emerald-700">
                <BedDouble className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{data.mode === 'allRooms' ? `সকল রুমের তালিকা (${toBanglaNumber(data.rooms?.length || 0)} টি রুম)` : `রুম: ${data.roomNumber || ''}`}</p>
                <p className="text-xs text-muted-foreground">
                  বিল্ডিং: {selectedBuildingName}
                  {data.mode !== 'allRooms' && selectedFloorNumber !== null && ` • তলা: ${toBanglaNumber(selectedFloorNumber)} তলা`}
                </p>
              </div>
            </div>
          </div>

          {/* All Rooms Mode — Tenants (grouped by floor) */}
          {data.mode === 'allRooms' && overviewSubTab === "tenants" && (() => {
            const floorMap: Record<number, any[]> = {};
            (data.rooms || []).forEach((roomData: any) => {
              const fn = roomData.floorNumber || 0;
              if (!floorMap[fn]) floorMap[fn] = [];
              floorMap[fn].push(roomData);
            });
            const sortedFloors = Object.keys(floorMap).sort((a, b) => Number(a) - Number(b));
            return sortedFloors.map((floorNum) => (
              <div key={floorNum} className="space-y-3">
                <div className="flex items-center gap-2 pt-2">
                  <Building2 className="size-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">{toBanglaNumber(floorNum)} তলা</span>
                  <div className="flex-1 border-t border-emerald-200" />
                </div>
                {floorMap[Number(floorNum)].map((roomData: any) => (
                <Card key={roomData.roomId}>
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center size-7 rounded bg-emerald-100 text-emerald-700"><BedDouble className="size-3.5" /></div>
                      <div>
                        <CardTitle className="text-sm">রুম: {roomData.roomNumber}</CardTitle>
                        <p className="text-[11px] text-muted-foreground">বর্তমান ভাড়াটে: {toBanglaNumber(roomData.currentTenants?.length || 0)} জন</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {roomData.currentTenants?.length > 0 ? roomData.currentTenants.map((t: any) => (
                      <div key={t.id} className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-200 rounded-lg px-3 py-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">{t.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0 text-sm"><span className="font-medium">{t.name}</span>{t.designation && <span className="text-muted-foreground ml-1.5">({t.designation})</span>}{t.phone && <span className="text-muted-foreground ml-2">{t.phone}</span>}<span className="text-muted-foreground text-xs ml-2">{formatDate(t.startDate)}</span></div>
                      </div>
                    )) : <p className="text-xs text-muted-foreground bg-gray-50 rounded px-2 py-1.5">কোনো ভাড়াটে নেই</p>}
                    {roomData.previousTenants?.length > 0 && (
                      <div className="mt-1"><span className="text-[10px] font-semibold text-gray-500">পূর্বের ভাড়াটেগণ ({roomData.previousTenants.length})</span>
                        {roomData.previousTenants.slice(0, 3).map((t: any) => (
                          <div key={t.id} className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <span>{t.name}</span>{t.designation && <><span>•</span><span>{t.designation}</span></>}<span>•</span><span>{formatDate(t.startDate)}{t.endDate ? ` — ${formatDate(t.endDate)}` : ""}</span>
                          </div>
                        ))}
                        {roomData.previousTenants.length > 3 && <p className="text-[10px] text-muted-foreground">...আরও {roomData.previousTenants.length - 3} জন</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
                ))}
              </div>
            ));
          })()}

          {/* All Rooms Mode — Inventory (grouped by floor) */}
          {data.mode === 'allRooms' && overviewSubTab === "inventory" && (() => {
            // Group rooms by floor
            const floorMap: Record<number, any[]> = {};
            (data.rooms || []).forEach((roomData: any) => {
              const fn = roomData.floorNumber || 0;
              if (!floorMap[fn]) floorMap[fn] = [];
              floorMap[fn].push(roomData);
            });
            const sortedFloors = Object.keys(floorMap).sort((a, b) => Number(a) - Number(b));
            return sortedFloors.map((floorNum) => (
              <div key={floorNum} className="space-y-3">
                <div className="flex items-center gap-2 pt-2">
                  <Building2 className="size-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">{toBanglaNumber(floorNum)} তলা</span>
                  <div className="flex-1 border-t border-emerald-200" />
                </div>
                {floorMap[Number(floorNum)].map((roomData: any) => {
                  const allItems = [...(roomData.currentInventory || []), ...(roomData.previousInventory || [])];
                  const uniqueItems = Array.from(new Map(allItems.map((item: any) => [item.id, item])).values());
                  return (
                    <Card key={roomData.roomId}>
                      <CardHeader className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <BedDouble className="size-3.5 text-gray-500" />
                          <CardTitle className="text-sm">রুম: {roomData.roomNumber}</CardTitle>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">মালামাল: {toBanglaNumber(uniqueItems.length)}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        {uniqueItems.length > 0 ? (
                          <div className="border rounded-lg overflow-hidden divide-y">
                            {uniqueItems.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                                <span className="flex-1 truncate">{item.itemName}</span>
                                <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                                {getConditionBadge(item.condition)}
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-xs text-muted-foreground bg-gray-50 rounded px-2 py-1.5">কোনো মালামাল নেই</p>}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ));
          })()}

          {/* Single Room Mode — existing content */}
          {data.mode !== 'allRooms' && (<>
          {/* ভাড়াটে তালিকা — only when tenants sub-tab selected */}
          {overviewSubTab === "tenants" && (
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-emerald-700"><Users className="size-3.5" /> ভাড়াটে তালিকা</h3>
            {data.currentTenants?.length > 0 ? (
              <div className="space-y-2 mb-3">
                {(data.currentTenants || []).map((tenant) => (
                  <div key={tenant.id} className="bg-emerald-50/50 border border-emerald-200 rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-sm font-bold shrink-0">{tenant.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0 grid grid-cols-4 gap-2 text-sm">
                        <div><span className="text-muted-foreground text-xs">নাম</span><p className="font-medium truncate">{tenant.name}</p></div>
                        <div><span className="text-muted-foreground text-xs">পদবী</span><p className="font-medium truncate">{tenant.designation || "-"}</p></div>
                        <div><span className="text-muted-foreground text-xs">ফোন</span><p className="font-medium truncate">{tenant.phone || "-"}</p></div>
                        <div><span className="text-muted-foreground text-xs">শুরু</span><p className="font-medium text-xs">{formatDate(tenant.startDate)}</p></div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="size-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => { setEditTenantData({ id: tenant.id, name: tenant.name, designation: tenant.designation || "", phone: tenant.phone || "" }); setEditTenantOpen(true); }}><Edit3 className="size-3.5" /></Button>
                        <Button variant="outline" size="sm" className="gap-1 text-xs text-orange-600 border-orange-300 hover:bg-orange-50 h-7 px-2" onClick={() => openVacateDialog(tenant.id)}>রুম ছেড়ে দিন</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (<p className="text-sm text-muted-foreground bg-gray-50 rounded-lg px-3 py-2 mb-3">এই রুমে বর্তমানে কোনো ভাড়াটে নেই</p>)}

            {data.previousTenants?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2"><span className="text-xs font-semibold text-gray-600">পূর্বের ভাড়াটেগণ</span><Badge variant="secondary" className="text-[10px] h-4 px-1.5">{data.previousTenants?.length}</Badge></div>
                <div className="space-y-1.5">
                  {paginatedPrevTenants.map((tenant) => {
                    const vacateRecord = data.vacateRecords?.find((vr) => vr.tenantId === tenant.id);
                    let snapshotItems: VacateInventoryItem[] = [];
                    try { snapshotItems = vacateRecord ? JSON.parse(vacateRecord.inventorySnapshot) : []; } catch { /* empty */ }
                    return (
                      <div key={tenant.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 px-3 py-2 bg-white hover:bg-gray-50/50 cursor-pointer" onClick={() => setExpandedPrevTenant(expandedPrevTenant === tenant.id ? null : tenant.id)}>
                          <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0">{tenant.name.charAt(0)}</div>
                          <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{tenant.name}</p><p className="text-[10px] text-muted-foreground">{formatDate(tenant.startDate)}{tenant.endDate ? ` — ${formatDate(tenant.endDate)}` : ""} • রুম: {data.roomNumber}</p></div>
                          {expandedPrevTenant === tenant.id ? <ChevronDown className="size-4 text-muted-foreground shrink-0" /> : <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
                        </div>
                        {expandedPrevTenant === tenant.id && (
                          <div className="border-t bg-gray-50/80 px-3 py-2 animate-in slide-in-from-top-1 duration-200">
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2"><div><span className="text-muted-foreground">ফোন:</span> {tenant.phone || "—"}</div><div><span className="text-muted-foreground">সময়কাল:</span> {formatDate(tenant.startDate)}{tenant.endDate ? ` — ${formatDate(tenant.endDate)}` : ""}</div></div>
                            {snapshotItems.length > 0 && (<div className="mt-2"><p className="text-xs text-muted-foreground mb-1">চলে যাওয়ার সময়কার মালামাল:</p><div className="border rounded divide-y overflow-hidden">{snapshotItems.map((item, idx) => (<div key={idx} className="flex items-center gap-2 px-2 py-1 text-xs"><span className="flex-1 truncate">{item.itemName}</span><span className="text-muted-foreground">×{item.quantity}</span>{getConditionBadge(item.condition)}</div>))}</div></div>)}
                            <div className="flex gap-2 mt-2">
                              <Button variant="outline" size="sm" className="gap-1 h-7 text-[11px] px-2 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); setEditTenantData({ id: tenant.id, name: tenant.name, designation: tenant.designation || "", phone: tenant.phone || "" }); setEditTenantOpen(true); }}><Edit3 className="size-3" />এডিট</Button>
                              <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm" className="gap-1 h-7 text-[11px] px-2 text-red-600 border-red-200 hover:bg-red-50" onClick={(e) => e.stopPropagation()}><Trash2 className="size-3" />ডিলিট</Button></AlertDialogTrigger><AlertDialogContent onClick={(e) => e.stopPropagation()}><AlertDialogHeader><AlertDialogTitle>ভাড়াটে মুছে ফেলবেন?</AlertDialogTitle><AlertDialogDescription>&quot;{tenant.name}&quot; এর সকল তথ্য মুছে যাবে।</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>বাতিল</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteTenant(tenant.id)} disabled={deletingTenant}>মুছে ফেলুন</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {totalPrevPages > 1 && (<div className="flex items-center justify-center gap-1 mt-2"><Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={prevPage <= 1} onClick={() => setPrevPage(prevPage - 1)}>আগে</Button>{Array.from({ length: totalPrevPages }, (_, i) => i + 1).map((p) => (<Button key={p} variant={p === prevPage ? "default" : "outline"} size="sm" className="h-7 w-7 text-xs p-0" onClick={() => setPrevPage(p)}>{p}</Button>))}<Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={prevPage >= totalPrevPages} onClick={() => setPrevPage(prevPage + 1)}>পরে</Button></div>)}
              </div>
            )}
          </div>
          )}

          {/* মালামাল তালিকা — only when inventory sub-tab selected */}
          {overviewSubTab === "inventory" && (
          <div>
            <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-semibold flex items-center gap-1.5 text-emerald-700"><Package className="size-3.5" /> মালামাল তালিকা<Badge variant="secondary" className="text-[10px] h-4 px-1.5">{data.currentInventory?.length || 0}</Badge></h3><Button size="sm" className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white gap-0.5 px-2" onClick={() => { setAddInvTenantId(data.currentTenants?.[0]?.id || ""); setAddInvName(""); setAddInvQty("1"); setAddInvCondition("ভালো"); setAddInvNote(""); setAddInvOpen(true); }}><Plus className="size-2.5" />যোগ</Button></div>
            {(data.currentInventory?.length || 0) === 0 ? (<p className="text-xs text-muted-foreground bg-gray-50 rounded px-2 py-1.5">কোনো মালামাল নেই</p>) : (<div className="bg-white border rounded-lg overflow-hidden divide-y">{(data.currentInventory || []).map((item) => (<div key={item.id} className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50/80 group"><span className="text-xs font-medium flex-1 truncate min-w-0">{item.itemName}</span><span className="text-[10px] text-muted-foreground shrink-0">×{item.quantity}</span><span className="shrink-0">{getConditionBadge(item.condition)}</span><div className="flex gap-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="sm" className="size-5 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => { setEditInvItem({ id: item.id, itemName: item.itemName, quantity: item.quantity, condition: item.condition, note: item.note }); setEditInvOpen(true); }}><Edit3 className="size-2.5" /></Button><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="size-5 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="size-2.5" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>মালামাল মুছে ফেলবেন?</AlertDialogTitle><AlertDialogDescription>&quot;{item.itemName}&quot; স্থায়ীভাবে মুছে যাবে।</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>বাতিল</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteInventory(item.id)} disabled={deletingInv}>মুছে ফেলুন</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div>))}</div>)}
          </div>
          )}
          </>)}
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={editTenantOpen} onOpenChange={setEditTenantOpen}><DialogContent><DialogHeader><DialogTitle>ভাড়াটে তথ্য সম্পাদনা</DialogTitle></DialogHeader>{editTenantData && (<div className="space-y-4"><div className="space-y-1.5"><Label>নাম</Label><Input value={editTenantData.name} onChange={(e) => setEditTenantData({ ...editTenantData, name: e.target.value })} /></div><div className="space-y-1.5"><Label>পদবী</Label><Input value={editTenantData.designation} onChange={(e) => setEditTenantData({ ...editTenantData, designation: e.target.value })} placeholder="যেমন: ছাত্র, চাকরিজীবী" /></div><div className="space-y-1.5"><Label>ফোন নম্বর</Label><Input value={editTenantData.phone} onChange={(e) => setEditTenantData({ ...editTenantData, phone: e.target.value })} placeholder="০১XXXXXXXXX" /></div></div>)}<DialogFooter><Button variant="outline" onClick={() => { setEditTenantOpen(false); setEditTenantData(null); }}>বাতিল</Button><Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleEditTenant} disabled={editingTenant}>{editingTenant ? "আপডেট হচ্ছে..." : "আপডেট করুন"}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={editInvOpen} onOpenChange={setEditInvOpen}><DialogContent><DialogHeader><DialogTitle>মালামাল সম্পাদনা</DialogTitle></DialogHeader>{editInvItem && (<div className="space-y-4"><div className="space-y-1.5"><Label>মালামালের নাম</Label><Input value={editInvItem.itemName} onChange={(e) => setEditInvItem({ ...editInvItem, itemName: e.target.value })} /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>পরিমাণ</Label><Input type="number" min={1} value={editInvItem.quantity} onChange={(e) => setEditInvItem({ ...editInvItem, quantity: parseInt(e.target.value) || 1 })} /></div><div className="space-y-1.5"><Label>অবস্থা</Label><Select value={editInvItem.condition} onValueChange={(v) => setEditInvItem({ ...editInvItem, condition: v })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ভালো">ভালো</SelectItem><SelectItem value="মাঝারি">মাঝারি</SelectItem><SelectItem value="খারাপ">খারাপ</SelectItem><SelectItem value="নস্ট">নস্ট</SelectItem></SelectContent></Select></div></div><div className="space-y-1.5"><Label>নোট</Label><Textarea value={editInvItem.note || ""} onChange={(e) => setEditInvItem({ ...editInvItem, note: e.target.value })} rows={2} /></div></div>)}<DialogFooter><Button variant="outline" onClick={() => { setEditInvOpen(false); setEditInvItem(null); }}>বাতিল</Button><Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleEditInventory} disabled={editingInv}>{editingInv ? "আপডেট হচ্ছে..." : "আপডেট করুন"}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={addInvOpen} onOpenChange={setAddInvOpen}><DialogContent><DialogHeader><DialogTitle>নতুন মালামাল যোগ করুন</DialogTitle><DialogDescription>রুম {data?.roomNumber} এ নতুন মালামাল যোগ করুন</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-1.5"><Label>মালামালের নাম *</Label><Input placeholder="যেমন: ফ্যান" value={addInvName} onChange={(e) => setAddInvName(e.target.value)} /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>পরিমাণ</Label><Input type="number" min={1} value={addInvQty} onChange={(e) => setAddInvQty(e.target.value)} /></div><div className="space-y-1.5"><Label>অবস্থা</Label><Select value={addInvCondition} onValueChange={setAddInvCondition}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ভালো">ভালো</SelectItem><SelectItem value="মাঝারি">মাঝারি</SelectItem><SelectItem value="খারাপ">খারাপ</SelectItem><SelectItem value="নস্ট">নস্ট</SelectItem></SelectContent></Select></div></div><div className="space-y-1.5"><Label>নোট (ঐচ্ছিক)</Label><Textarea placeholder="কোনো বিশেষ নোট" value={addInvNote} onChange={(e) => setAddInvNote(e.target.value)} rows={2} /></div></div><DialogFooter><Button variant="outline" onClick={() => setAddInvOpen(false)}>বাতিল</Button><Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddInventory} disabled={addingInv}>{addingInv ? "যোগ হচ্ছে..." : "যোগ করুন"}</Button></DialogFooter></DialogContent></Dialog>

      {/* Vacate Dialog */}
      <Dialog open={vacateOpen} onOpenChange={setVacateOpen}><DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>ভাড়াটে রুম ছেড়ে দিন</DialogTitle><DialogDescription>{data?.currentTenants?.find((t) => t.id === vacateTenantId)?.name || data?.currentTenants?.[0]?.name} রুম ছেড়ে দিচ্ছেন। মালামালের অবস্থা যাচাই করুন।</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-muted-foreground">রুম নম্বর</p><p className="font-semibold">{data?.roomNumber}</p></div><div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-muted-foreground">ভাড়াটে</p><p className="font-semibold">{data?.currentTenants?.find((t) => t.id === vacateTenantId)?.name || data?.currentTenants?.[0]?.name}</p></div></div><div><div className="flex items-center justify-between mb-2"><Label>মালামালের তালিকা</Label><Button variant="outline" size="sm" className="gap-1 text-xs" onClick={addVacateItem}><Plus className="size-3" />আইটেম যোগ</Button></div><div className="space-y-2 max-h-72 overflow-y-auto">{vacateItems.map((item, idx) => (<div key={idx} className={`rounded-lg border p-2 ${editingVacateIdx === idx ? "bg-emerald-50/50 border-emerald-200" : "bg-gray-50"}`}><div className="flex items-center gap-2">{editingVacateIdx === idx ? (<><div className="flex-1 grid grid-cols-[1fr_70px_100px_100px] gap-2 items-end">{idx === 0 && <div className="col-span-4 grid grid-cols-[1fr_70px_100px_100px] gap-2"><span className="text-[10px] text-muted-foreground">নাম</span><span className="text-[10px] text-muted-foreground">পরিমাণ</span><span className="text-[10px] text-muted-foreground">অবস্থা</span><span className="text-[10px] text-muted-foreground">নোট</span></div>}<Input className="h-8 text-xs" value={item.itemName} onChange={(e) => updateVacateItem(idx, "itemName", e.target.value)} placeholder="মালামালের নাম" /><Input className="h-8 text-xs" type="number" min={1} value={item.quantity} onChange={(e) => updateVacateItem(idx, "quantity", parseInt(e.target.value) || 1)} /><Select value={item.condition} onValueChange={(v) => updateVacateItem(idx, "condition", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ভালো">ভালো</SelectItem><SelectItem value="মাঝারি">মাঝারি</SelectItem><SelectItem value="খারাপ">খারাপ</SelectItem><SelectItem value="নস্ট">নস্ট</SelectItem></SelectContent></Select><Input className="h-8 text-xs" value={item.note || ""} onChange={(e) => updateVacateItem(idx, "note", e.target.value)} placeholder="নোট" /></div><Button variant="ghost" size="sm" className="size-7 p-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 shrink-0" onClick={() => setEditingVacateIdx(null)}><Edit3 className="size-3.5" /></Button></>) : (<><div className="flex-1 flex items-center gap-3 text-sm min-w-0"><span className="font-medium truncate min-w-0 flex-1">{item.itemName || "—"}</span><span className="text-xs text-muted-foreground shrink-0">×{item.quantity}</span><span className="shrink-0">{getConditionBadge(item.condition)}</span>{item.note && <span className="text-[10px] text-muted-foreground truncate shrink-0 hidden sm:inline">({item.note})</span>}</div><div className="flex gap-0.5 shrink-0"><Button variant="ghost" size="sm" className="size-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => setEditingVacateIdx(idx)}><Edit3 className="size-3.5" /></Button><Button variant="ghost" size="sm" className="size-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeVacateItem(idx)} disabled={vacateItems.length <= 1}><Trash2 className="size-3.5" /></Button></div></>)}</div></div>))}</div></div></div><DialogFooter><Button variant="outline" onClick={() => setVacateOpen(false)}>বাতিল</Button><Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleVacate} disabled={vacateLoading}>{vacateLoading ? (<div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />) : null}নিশ্চিত করুন — রুম ছেড়ে দিন</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Guest Management Component
// ═══════════════════════════════════════════════════════════════════════════

function GuestsTab() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGuestId, setExpandedGuestId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addIsPaid, setAddIsPaid] = useState(true);
  const [gName, setGName] = useState("");
  const [gAddress, setGAddress] = useState("");
  const [gMobile, setGMobile] = useState("");
  const [gReferredBy, setGReferredBy] = useState("");
  const [gCheckIn, setGCheckIn] = useState("");
  const [gCheckOut, setGCheckOut] = useState("");
  const [gTotalBill, setGTotalBill] = useState("");
  const [gNote, setGNote] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [eName, setEName] = useState("");
  const [eAddress, setEAddress] = useState("");
  const [eMobile, setEMobile] = useState("");
  const [eReferredBy, setEReferredBy] = useState("");
  const [eCheckIn, setECheckIn] = useState("");
  const [eCheckOut, setECheckOut] = useState("");
  const [eTotalBill, setETotalBill] = useState("");
  const [eNote, setENote] = useState("");
  const [eIsPaid, setEIsPaid] = useState(true);

  // Loading states
  const [editingGuest, setEditingGuest] = useState(false);
  const [deletingGuest, setDeletingGuest] = useState(false);

  const loadAvailableYears = useCallback(async () => {
    try {
      const res = await fetch("/api/guests?all=true");
      if (res.ok) {
        const allGuests: Guest[] = await res.json();
        const years = [...new Set(allGuests.map((g) => new Date(g.checkInDate).getFullYear()))].sort((a, b) => b - a);
        setAvailableYears(years);
      }
    } catch { /* চুপ করে থাকুন */ }
  }, []);

  const loadGuests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterMonth) params.set("month", filterMonth);
      if (filterYear) params.set("year", filterYear);
      const url = `/api/guests${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      setGuests(await res.json());
    } catch { toast.error("গেস্ট লোড করতে সমস্যা হয়েছে"); }
    finally { setLoading(false); }
  }, [filterMonth, filterYear]);

  useEffect(() => { loadAvailableYears(); }, [loadAvailableYears]);
  useEffect(() => { loadGuests(); }, [loadGuests]);

  const resetAddForm = () => {
    setAddIsPaid(true); setGName(""); setGAddress(""); setGMobile("");
    setGReferredBy(""); setGCheckIn(""); setGCheckOut(""); setGTotalBill(""); setGNote("");
  };

  const handleAdd = async () => {
    if (!gName.trim() || !gCheckIn) { toast.error("নাম এবং চেক-ইন তারিখ দিন"); return; }
    setSaving(true); setSaveError("");
    try {
      const payload = {
        name: gName.trim(), address: gAddress.trim() || null, mobile: gMobile.trim() || null,
        referredBy: gReferredBy.trim() || null, checkInDate: gCheckIn, checkOutDate: gCheckOut || null,
        totalBill: addIsPaid ? (gTotalBill.trim() || null) : "Non Paid",
        note: gNote.trim() || null, isPaid: addIsPaid,
      };
      const res = await fetch("/api/guests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.redirected) { setSaveError("সেশন মেয়াদোত্তীর্ণ। পেজ রিফ্রেশ করুন।"); return; }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) { setSaveError("সার্ভার সমস্যা। পেজ রিফ্রেশ করুন।"); return; }
      const data = await res.json();
      if (!res.ok) { setSaveError(data?.error || `সার্ভার এরর (${res.status})`); return; }
      toast.success(addIsPaid ? "Paid গেস্ট যোগ হয়েছে" : "Non Paid গেস্ট যোগ হয়েছে");
      resetAddForm(); setAddOpen(false); loadGuests(); loadAvailableYears();
    } catch (err) { setSaveError(err instanceof Error ? err.message : "নেটওয়ার্ক সমস্যা"); }
    finally { setSaving(false); }
  };

  const openEdit = (g: Guest) => {
    setEditGuest(g); setEName(g.name); setEAddress(g.address || ""); setEMobile(g.mobile || "");
    setEReferredBy(g.referredBy || ""); setECheckIn(g.checkInDate?.split("T")[0] || "");
    setECheckOut(g.checkOutDate?.split("T")[0] || "");
    setETotalBill(g.totalBill === "Non Paid" ? "" : g.totalBill || "");
    setENote(g.note || ""); setEIsPaid(g.isPaid); setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editGuest || !eName.trim() || !eCheckIn) return;
    setEditingGuest(true);
    try {
      const res = await fetch("/api/guests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editGuest.id, name: eName.trim(), address: eAddress.trim() || null, mobile: eMobile.trim() || null, referredBy: eReferredBy.trim() || null, checkInDate: eCheckIn, checkOutDate: eCheckOut || null, totalBill: eIsPaid ? (eTotalBill.trim() || null) : "Non Paid", note: eNote.trim() || null, isPaid: eIsPaid }) });
      if (!res.ok) throw new Error();
      toast.success("গেস্ট আপডেট হয়েছে"); setEditOpen(false); setEditGuest(null); loadGuests(); loadAvailableYears();
    } catch { toast.error("গেস্ট আপডেট করতে সমস্যা হয়েছে"); } finally { setEditingGuest(false); }
  };

  const handleDelete = async (id: string) => {
    setDeletingGuest(true);
    try {
      const res = await fetch("/api/guests", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error();
      toast.success("গেস্ট মুছে ফেলা হয়েছে"); setExpandedGuestId(null); loadGuests(); loadAvailableYears();
    } catch { toast.error("গেস্ট মুছে ফেলতে সমস্যা হয়েছে"); } finally { setDeletingGuest(false); }
  };

  const months = [
    { value: "1", label: "জানুয়ারি" }, { value: "2", label: "ফেব্রুয়ারি" }, { value: "3", label: "মার্চ" },
    { value: "4", label: "এপ্রিল" }, { value: "5", label: "মে" }, { value: "6", label: "জুন" },
    { value: "7", label: "জুলাই" }, { value: "8", label: "আগস্ট" }, { value: "9", label: "সেপ্টেম্বর" },
    { value: "10", label: "অক্টোবর" }, { value: "11", label: "নভেম্বর" }, { value: "12", label: "ডিসেম্বর" },
  ];

  if (loading) return (<div className="flex flex-col items-center justify-center py-20 gap-3"><div className="size-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" /><p className="text-sm text-muted-foreground">তথ্য লোড হচ্ছে...</p></div>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2"><UserCheck className="size-5 text-blue-600" />গেস্ট ম্যানেজমেন্ট</h3>
        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { resetAddForm(); setSaveError(""); } }}>
          <DialogTrigger asChild><Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Plus className="size-4" />নতুন গেস্ট</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><UserCheck className="size-5 text-blue-600" />নতুন গেস্ট যোগ করুন</DialogTitle><DialogDescription>গেস্টের তথ্য দিন</DialogDescription></DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button type="button" className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${addIsPaid ? "bg-emerald-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"}`} onClick={() => setAddIsPaid(true)}>Paid</button>
                <button type="button" className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${!addIsPaid ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"}`} onClick={() => { setAddIsPaid(false); setGTotalBill(""); }}>Non Paid</button>
              </div>
              <div className="space-y-1.5"><Label>নাম *</Label><Input placeholder="গেস্টের নাম" value={gName} onChange={(e) => setGName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>ঠিকানা</Label><Input placeholder="ঠিকানা" value={gAddress} onChange={(e) => setGAddress(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>মোবাইল নম্বর</Label><Input placeholder="০১XXXXXXXXX" value={gMobile} onChange={(e) => setGMobile(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Refered By</Label><Input placeholder="রেফার করেছেন" value={gReferredBy} onChange={(e) => setGReferredBy(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>চেক-ইন তারিখ *</Label><Input type="date" value={gCheckIn} onChange={(e) => setGCheckIn(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>চেক-আউট তারিখ</Label><Input type="date" value={gCheckOut} onChange={(e) => setGCheckOut(e.target.value)} /></div>
              </div>
              {addIsPaid ? <div className="space-y-1.5"><Label>মোট বিল</Label><Input type="number" placeholder="বিলের পরিমাণ" value={gTotalBill} onChange={(e) => setGTotalBill(e.target.value)} /></div> : <div className="bg-orange-50 border border-orange-200 rounded-lg p-3"><p className="text-sm font-medium text-orange-700">Total Bill: Non Paid</p><p className="text-xs text-orange-600 mt-0.5">এই গেস্ট Non Paid হিসেবে চিহ্নিত হবে</p></div>}
              <div className="space-y-1.5"><Label>নোট (ঐচ্ছিক)</Label><Textarea placeholder="বিশেষ নোট" value={gNote} onChange={(e) => setGNote(e.target.value)} rows={2} /></div>
            </div>
            {saveError && <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-sm font-medium text-red-700">সমস্যা: {saveError}</p></div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setAddOpen(false); resetAddForm(); setSaveError(""); }} disabled={saving}>বাতিল</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAdd} disabled={saving}>{saving ? (<><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> সেভ হচ্ছে...</>) : "সেভ করুন"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-dashed"><CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">সার্চ:</span>
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Select value={filterMonth || "__all__"} onValueChange={(v) => setFilterMonth(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[130px] h-8 text-xs"><SelectValue placeholder="মাস" /></SelectTrigger>
              <SelectContent><SelectItem value="__all__">সব মাস</SelectItem>{months.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={filterYear || "__all__"} onValueChange={(v) => setFilterYear(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[110px] h-8 text-xs"><SelectValue placeholder="বছর" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">সব বছর</SelectItem>
                {availableYears.map((y) => (<SelectItem key={y} value={String(y)}>{toBanglaNumber(y)}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          {(filterMonth || filterYear) && <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-red-500" onClick={() => { setFilterMonth(""); setFilterYear(""); }}><X className="size-3 mr-1" />মুছুন</Button>}
          <span className="text-xs text-muted-foreground ml-auto">মোট: {guests.length} জন</span>
        </div>
      </CardContent></Card>

      {guests.length === 0 ? (
        <Alert><UserCheck className="size-4" /><AlertDescription>কোনো গেস্ট নেই। নতুন গেস্ট যোগ করুন।</AlertDescription></Alert>
      ) : (
        <div className="space-y-1">{guests.map((guest) => (
          <div key={guest.id} className="border rounded-md overflow-hidden">
            <div className="group flex items-center gap-2 px-2.5 py-2 bg-white hover:shadow-sm transition-all cursor-pointer" onClick={() => setExpandedGuestId(expandedGuestId === guest.id ? null : guest.id)}>
              {expandedGuestId === guest.id ? <ChevronDown className="size-3 text-muted-foreground shrink-0" /> : <ChevronRight className="size-3 text-muted-foreground shrink-0" />}
              <div className={`size-2 rounded-full shrink-0 ${guest.isPaid ? "bg-emerald-500" : "bg-orange-500"}`} />
              <span className="font-medium text-xs truncate min-w-0 flex-1">{guest.name}</span>
              {guest.mobile && <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:inline"><Phone className="size-2.5 inline mr-0.5 -mt-px" />{guest.mobile}</span>}
              {guest.referredBy && <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden md:inline">রেফার: {guest.referredBy}</span>}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ${guest.isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>{guest.isPaid ? "Paid" : "Non Paid"}</span>
            </div>
            {expandedGuestId === guest.id && (
              <div className="bg-gray-50/80 border-t px-3 py-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="space-y-0.5"><p className="text-[9px] text-muted-foreground uppercase">নাম</p><p className="font-medium">{guest.name}</p></div>
                  <div className="space-y-0.5"><p className="text-[9px] text-muted-foreground uppercase">মোবাইল</p><p className="font-medium">{guest.mobile || "—"}</p></div>
                  <div className="space-y-0.5"><p className="text-[9px] text-muted-foreground uppercase">Refered By</p><p className="font-medium">{guest.referredBy || "—"}</p></div>
                  <div className="space-y-0.5"><p className="text-[9px] text-muted-foreground uppercase">স্ট্যাটাস</p><p className="font-medium"><span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${guest.isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>{guest.isPaid ? "Paid" : "Non Paid"}</span></p></div>
                  <div className="space-y-0.5"><p className="text-[9px] text-muted-foreground uppercase">ঠিকানা</p><p className="font-medium">{guest.address || "—"}</p></div>
                  <div className="space-y-0.5"><p className="text-[9px] text-muted-foreground uppercase">চেক-ইন</p><p className="font-medium">{formatDate(guest.checkInDate)}</p></div>
                  <div className="space-y-0.5"><p className="text-[9px] text-muted-foreground uppercase">চেক-আউট</p><p className="font-medium">{guest.checkOutDate ? formatDate(guest.checkOutDate) : "—"}</p></div>
                  <div className="space-y-0.5"><p className="text-[9px] text-muted-foreground uppercase">মোট বিল</p><p className="font-medium">{guest.totalBill || "—"}</p></div>
                  {guest.note && <div className="col-span-2 sm:col-span-4 space-y-0.5"><p className="text-[9px] text-muted-foreground uppercase">নোট</p><p className="font-medium">{guest.note}</p></div>}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="gap-1.5 h-7 text-[11px] px-3 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); openEdit(guest); }}><Edit3 className="size-3" />এডিট</Button>
                  <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm" className="gap-1.5 h-7 text-[11px] px-3 text-red-600 border-red-200 hover:bg-red-50" onClick={(e) => e.stopPropagation()}><Trash2 className="size-3" />ডিলিট</Button></AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}><AlertDialogHeader><AlertDialogTitle>গেস্ট মুছে ফেলবেন?</AlertDialogTitle><AlertDialogDescription>&quot;{guest.name}&quot; এর সকল তথ্য স্থায়ীভাবে মুছে যাবে।</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>বাতিল</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(guest.id)} disabled={deletingGuest}>মুছে ফেলুন</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </div>
        ))}</div>
      )}

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditGuest(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit3 className="size-5 text-blue-600" />গেস্ট সম্পাদনা</DialogTitle><DialogDescription>{editGuest?.name} — তথ্য আপডেট করুন</DialogDescription></DialogHeader>
          {editGuest && (
            <div className="space-y-3">
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button type="button" className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${eIsPaid ? "bg-emerald-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"}`} onClick={() => setEIsPaid(true)}>Paid</button>
                <button type="button" className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${!eIsPaid ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"}`} onClick={() => { setEIsPaid(false); setETotalBill(""); }}>Non Paid</button>
              </div>
              <div className="space-y-1.5"><Label>নাম *</Label><Input value={eName} onChange={(e) => setEName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>ঠিকানা</Label><Input value={eAddress} onChange={(e) => setEAddress(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>মোবাইল</Label><Input value={eMobile} onChange={(e) => setEMobile(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Refered By</Label><Input value={eReferredBy} onChange={(e) => setEReferredBy(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>চেক-ইন *</Label><Input type="date" value={eCheckIn} onChange={(e) => setECheckIn(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>চেক-আউট</Label><Input type="date" value={eCheckOut} onChange={(e) => setECheckOut(e.target.value)} /></div>
              </div>
              {eIsPaid ? <div className="space-y-1.5"><Label>মোট বিল</Label><Input type="number" value={eTotalBill} onChange={(e) => setETotalBill(e.target.value)} /></div> : <div className="bg-orange-50 border border-orange-200 rounded-lg p-3"><p className="text-sm font-medium text-orange-700">Total Bill: Non Paid</p></div>}
              <div className="space-y-1.5"><Label>নোট</Label><Textarea value={eNote} onChange={(e) => setENote(e.target.value)} rows={2} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => { setEditOpen(false); setEditGuest(null); }}>বাতিল</Button><Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleEdit} disabled={editingGuest}>{editingGuest ? "আপডেট হচ্ছে..." : "আপডেট করুন"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5 — Belongings Management (মালামাল)
// ═══════════════════════════════════════════════════════════════════════════

interface BelongingTemplate {
  id: string;
  buildingId: string;
  itemName: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

function BelongingsTab() {
  const { buildings } = useBuildingsContext();
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [templates, setTemplates] = useState<BelongingTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // Add new item
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [addingItem, setAddingItem] = useState(false);

  // Edit item
  const [editingId, setEditingId] = useState("");
  const [editItemName, setEditItemName] = useState("");
  const [editItemQuantity, setEditItemQuantity] = useState("1");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState(false);

  const loadTemplates = useCallback(async () => {
    if (!selectedBuildingId) {
      setTemplates([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/belongings?buildingId=${selectedBuildingId}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch { /* silent */ }
    finally {
      setLoading(false);
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    if (selectedBuildingId) loadTemplates();
    else setTemplates([]);
  }, [selectedBuildingId, loadTemplates]);

  const handleAddItem = async () => {
    if (!newItemName.trim() || !selectedBuildingId) {
      toast.error("মালামালের নাম দিন");
      return;
    }
    setAddingItem(true);
    try {
      const res = await fetch("/api/belongings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildingId: selectedBuildingId,
          itemName: newItemName.trim(),
          quantity: parseInt(newItemQuantity) || 1,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("মালামাল যোগ হয়েছে");
      setNewItemName("");
      setNewItemQuantity("1");
      loadTemplates();
    } catch {
      toast.error("মালামাল যোগ করতে সমস্যা হয়েছে");
    } finally {
      setAddingItem(false);
    }
  };

  const handleEditItem = async () => {
    if (!editItemName.trim() || !editingId) {
      toast.error("মালামালের নাম দিন");
      return;
    }
    setEditing(true);
    try {
      const res = await fetch("/api/belongings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          itemName: editItemName.trim(),
          quantity: parseInt(editItemQuantity) || 1,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("মালামাল আপডেট হয়েছে");
      setEditOpen(false);
      loadTemplates();
    } catch {
      toast.error("মালামাল আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch("/api/belongings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("মালামাল মুছে ফেলা হয়েছে");
      loadTemplates();
    } catch {
      toast.error("মালামাল মুছে ফেলতে সমস্যা হয়েছে");
    } finally {
      setDeleting(false);
    }
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const url = `/api/belongings/download?all=true`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "ডাউনলোড করতে সমস্যা হয়েছে");
        return;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('spreadsheetml') && !contentType.includes('octet-stream')) {
        toast.error("ডাউনলোড করতে সমস্যা হয়েছে - সেশন মেয়াদোত্তীর্ণ হতে পারে");
        return;
      }
      const blob = await res.blob();
      if (blob.size === 0) {
        toast.error("ডাউনলোড করতে সমস্যা হয়েছে - ফাইল খালি");
        return;
      }
      const urlObj = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlObj;
      a.download = "সকল_রুমের_মালামাল_তালিকা.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlObj);
      toast.success("XLSX ডাউনলোড হচ্ছে");
    } catch {
      toast.error("ডাউনলোড করতে সমস্যা হয়েছে");
    } finally {
      setDownloading(false);
    }
  };

  const openEditDialog = (item: BelongingTemplate) => {
    setEditingId(item.id);
    setEditItemName(item.itemName);
    setEditItemQuantity(String(item.quantity));
    setEditOpen(true);
  };

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Package className="size-5 text-emerald-600" />
          মালামাল ম্যানেজমেন্ট
        </h2>
      </div>

      {/* Building Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Label>বিল্ডিং নির্বাচন করুন</Label>
            <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="বিল্ডিং নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.floors?.reduce((s, f) => s + (f.rooms?.length || 0), 0) || 0} রুম)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedBuildingId && selectedBuilding && (
        <>
          {/* Info & Action Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-gray-900">{selectedBuilding.name}</span> — মোট টেমপ্লেট আইটেম: <span className="font-bold text-emerald-700">{toBanglaNumber(templates.length)}</span> টি
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    className="gap-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                    onClick={handleDownloadAll}
                    disabled={downloading}
                  >
                    {downloading ? <div className="size-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /> : <Download className="size-4" />}
                    সকল রুমের মালামাল
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add New Item */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Plus className="size-4 text-emerald-600" />
                নতুন মালামাল যোগ করুন
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="মালামালের নাম (যেমন: বিছানা)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddItem(); }}
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="পরিমাণ"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  className="w-full sm:w-24"
                />
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={handleAddItem}
                  disabled={addingItem || !newItemName.trim()}
                >
                  {addingItem ? "যোগ হচ্ছে..." : "যোগ করুন"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Template Items List */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <div className="size-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">লোড হচ্ছে...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="size-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    এই বিল্ডিংয়ে কোনো মালামাল টেমপ্লেট নেই। উপরে থেকে নতুন মালামাল যোগ করুন।
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg border px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center size-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          {toBanglaNumber(index + 1)}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{item.itemName}</p>
                          <p className="text-xs text-muted-foreground">
                            পরিমাণ: {toBanglaNumber(item.quantity)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit3 className="size-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                              disabled={deleting}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>মালামাল মুছে ফেলবেন?</AlertDialogTitle>
                              <AlertDialogDescription>
                                &quot;{item.itemName}&quot; টেমপ্লেট থেকে মুছে যাবে।
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>বাতিল</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                মুছে ফেলুন
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>মালামাল সম্পাদনা করুন</DialogTitle>
                <DialogDescription>মালামালের নাম ও পরিমাণ পরিবর্তন করুন</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>মালামালের নাম</Label>
                  <Input
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    placeholder="মালামালের নাম"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>পরিমাণ</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editItemQuantity}
                    onChange={(e) => setEditItemQuantity(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>বাতিল</Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleEditItem}
                  disabled={editing || !editItemName.trim()}
                >
                  {editing ? "সেভ হচ্ছে..." : "সেভ করুন"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {!selectedBuildingId && (
        <Alert>
          <Package className="size-4" />
          <AlertDescription>
            মালামাল ম্যানেজমেন্ট শুরু করতে উপরে থেকে একটি বিল্ডিং নির্বাচন করুন।
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
