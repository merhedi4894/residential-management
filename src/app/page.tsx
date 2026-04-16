"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  phone?: string;
  roomId: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  room: { id: string; roomNumber: string; floorId: string };
  inventories: InventoryItem[];
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

// ── Helper ───────────────────────────────────────────────────────────────

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

// ── Main Component ───────────────────────────────────────────────────────

export default function HomePage() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [checking, setChecking] = useState(true);
  // Change password dialog
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [changePassLoading, setChangePassLoading] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
      <Toaster position="top-right" richColors />
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader user={user} onLogout={handleLogout} onChangePassword={() => { setCurrentPass(""); setNewPass(""); setChangePassOpen(true); }} />
        <MainTabs />
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
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [activeTenants, setActiveTenants] = useState(0);

  useEffect(() => {
    fetch("/api/buildings")
      .then((r) => r.json())
      .then((data) => {
        setBuildings(data);
        let rooms = 0;
        let tenants = 0;
        data.forEach((b: Building) => {
          b.floors?.forEach((f) => {
            rooms += f.rooms?.length || 0;
            f.rooms?.forEach((r) => {
              tenants += r.tenants?.length || 0;
            });
          });
        });
        setTotalRooms(rooms);
        setActiveTenants(tenants);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
              <Building2 className="size-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              অফিস আবাসিক ম্যানেজমেন্ট সিস্টেম
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            আবাসিক এলাকার সামগ্রিক পরিচালনা ও তথ্য ব্যবস্থাপনা
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
            <Building2 className="size-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">বিল্ডিং</span>
            <span className="text-lg font-bold text-emerald-700">
              {buildings.length}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
            <BedDouble className="size-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">রুম</span>
            <span className="text-lg font-bold text-emerald-700">
              {totalRooms}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border">
            <Users className="size-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">ভাড়াটে</span>
            <span className="text-lg font-bold text-emerald-700">
              {activeTenants}
            </span>
          </div>
          {/* User menu */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <div className="size-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                {user?.username?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <span className="text-sm font-medium text-emerald-800 hidden sm:inline">
                {user?.username || "Admin"}
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
  return (
    <Tabs defaultValue="buildings" className="w-full">
      <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
        <TabsTrigger value="buildings" className="flex-1 sm:flex-auto gap-1.5">
          <Building2 className="size-4" />
          <span className="hidden sm:inline">বিল্ডিং ও রুম</span>
          <span className="sm:hidden">বিল্ডিং</span>
        </TabsTrigger>
        <TabsTrigger value="tenants" className="flex-1 sm:flex-auto gap-1.5">
          <Users className="size-4" />
          <span className="hidden sm:inline">ভাড়াটে ম্যানেজমেন্ট</span>
          <span className="sm:hidden">ভাড়াটে</span>
        </TabsTrigger>
        <TabsTrigger value="inventory" className="flex-1 sm:flex-auto gap-1.5">
          <Package className="size-4" />
          <span className="hidden sm:inline">মালামাল খোঁজ</span>
          <span className="sm:hidden">মালামাল</span>
        </TabsTrigger>
        <TabsTrigger value="overview" className="flex-1 sm:flex-auto gap-1.5">
          <ClipboardList className="size-4" />
          <span className="hidden sm:inline">রুমভিত্তিক সার্চ</span>
          <span className="sm:hidden">সার্চ</span>
        </TabsTrigger>
        <TabsTrigger value="troubles" className="flex-1 sm:flex-auto gap-1.5">
          <AlertTriangle className="size-4" />
          <span className="hidden sm:inline">ট্রাবল রিপোর্ট</span>
          <span className="sm:hidden">ট্রাবল</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="buildings" className="mt-6">
        <BuildingsTab />
      </TabsContent>
      <TabsContent value="tenants" className="mt-6">
        <TenantsTab />
      </TabsContent>
      <TabsContent value="inventory" className="mt-6">
        <InventoryTab />
      </TabsContent>
      <TabsContent value="overview" className="mt-6">
        <OverviewTab />
      </TabsContent>
      <TabsContent value="troubles" className="mt-6">
        <TroublesTab />
      </TabsContent>
    </Tabs>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1 — Buildings & Rooms
// ═══════════════════════════════════════════════════════════════════════════

function BuildingsTab() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(
    new Set()
  );

  // Dialog states
  const [addBuildingOpen, setAddBuildingOpen] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState("");
  const [newBuildingFloors, setNewBuildingFloors] = useState("");

  const [addRoomFloorId, setAddRoomFloorId] = useState("");
  const [addRoomNumber, setAddRoomNumber] = useState("");
  const [addRoomOpen, setAddRoomOpen] = useState(false);

  const loadBuildings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/buildings");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBuildings(data);
    } catch {
      toast.error("বিল্ডিং লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

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
    try {
      const res = await fetch("/api/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBuildingName.trim(),
          totalFloors: parseInt(newBuildingFloors),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("বিল্ডিং তৈরি হয়েছে");
      setNewBuildingName("");
      setNewBuildingFloors("");
      setAddBuildingOpen(false);
      loadBuildings();
    } catch {
      toast.error("বিল্ডিং তৈরি করতে সমস্যা হয়েছে");
    }
  };

  const handleDeleteBuilding = async (id: string) => {
    try {
      const res = await fetch("/api/buildings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("বিল্ডিং মুছে ফেলা হয়েছে");
      loadBuildings();
    } catch {
      toast.error("বিল্ডিং মুছে ফেলতে সমস্যা হয়েছে");
    }
  };

  const handleCreateRoom = async () => {
    if (!addRoomNumber.trim() || !addRoomFloorId) {
      toast.error("রুম নম্বর দিন");
      return;
    }
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
      loadBuildings();
    } catch {
      toast.error("রুম তৈরি করতে সমস্যা হয়েছে");
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      const res = await fetch("/api/rooms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("রুম মুছে ফেলা হয়েছে");
      loadBuildings();
    } catch {
      toast.error("রুম মুছে ফেলতে সমস্যা হয়েছে");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

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
                বিল্ডিং এর নাম এবং মোট তলার সংখ্যা লিখুন
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
              >
                তৈরি করুন
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
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            বিল্ডিং মুছে ফেলবেন?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            &quot;{building.name}&quot; বিল্ডিং এবং এর সকল তলা ও
                            রুম স্থায়ীভাবে মুছে যাবে। এই কাজ ফিরিয়ে আনা যাবে না।
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>বাতিল</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleDeleteBuilding(building.id)}
                          >
                            মুছে ফেলুন
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                            >
                              যোগ করুন
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
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuestView, setShowGuestView] = useState(false);

  // Add tenant dialog
  const [addOpen, setAddOpen] = useState(false);
  const [tName, setTName] = useState("");
  const [tPhone, setTPhone] = useState("");
  const [tStartDate, setTStartDate] = useState("");
  const [tBuildingId, setTBuildingId] = useState("");
  const [tFloorId, setTFloorId] = useState("");
  const [tRoomId, setTRoomId] = useState("");
  const [tRoomNumber, setTRoomNumber] = useState("");
  const [invItems, setInvItems] = useState<
    { itemName: string; quantity: string; condition: string }[]
  >([{ itemName: "", quantity: "1", condition: "ভালো" }]);
  const [previousTenantName, setPreviousTenantName] = useState("");
  const [loadingPrevItems, setLoadingPrevItems] = useState(false);

  // Vacate dialog
  const [vacateOpen, setVacateOpen] = useState(false);
  const [vacateTenant, setVacateTenant] = useState<Tenant | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, bRes] = await Promise.all([
        fetch("/api/tenants"),
        fetch("/api/buildings"),
      ]);
      if (!tRes.ok || !bRes.ok) throw new Error();
      setTenants(await tRes.json());
      setBuildings(await bRes.json());
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

  const handleAddTenant = async () => {
    if (!tName.trim() || !tRoomId || !tStartDate) {
      toast.error("নাম, রুম এবং শুরুর তারিখ দিন");
      return;
    }
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tName.trim(),
          phone: tPhone.trim() || null,
          roomId: tRoomId,
          roomNumber: tRoomNumber,
          startDate: tStartDate,
          inventoryItems: invItems.filter((i) => i.itemName.trim()),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("ভাড়াটে যোগ হয়েছে");
      resetAddForm();
      setAddOpen(false);
      loadData();
    } catch {
      toast.error("ভাড়াটে যোগ করতে সমস্যা হয়েছে");
    }
  };

  const resetAddForm = () => {
    setTName("");
    setTPhone("");
    setTStartDate("");
    setTBuildingId("");
    setTFloorId("");
    setTRoomId("");
    setTRoomNumber("");
    setInvItems([{ itemName: "", quantity: "1", condition: "ভালো" }]);
    setPreviousTenantName("");
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
      const res = await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vacateTenant.id }),
      });
      if (!res.ok) throw new Error();
      toast.success("ভাড়াটে রুম ছেড়ে দিয়েছেন");
      setVacateOpen(false);
      setVacateTenant(null);
      loadData();
    } catch {
      toast.error("আপডেট করতে সমস্যা হয়েছে");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
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
              নতুন ভাড়াটে
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>নতুন ভাড়াটে যোগ করুন</DialogTitle>
              <DialogDescription>
                ভাড়াটে এর তথ্য এবং প্রাথমিক মালামালের তালিকা দিন
              </DialogDescription>
            </DialogHeader>

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
                          {r.tenants?.length > 0 && " (ভর্তি)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tenant details */}
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
                  <Label>প্রাথমিক মালামাল</Label>
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
                      className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-end"
                    >
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
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 size-8 p-0"
                        onClick={() => removeInvRow(idx)}
                        disabled={invItems.length <= 1}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>

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
              >
                যোগ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          )}
        </div>
      </div>

      {showGuestView ? (
        <GuestsTab />
      ) : (
        <>
      {tenants.length === 0 && (
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
                <TableHead>রুম নম্বর</TableHead>
                <TableHead>ফোন</TableHead>
                <TableHead>শুরুর তারিখ</TableHead>
                <TableHead>অবস্থা</TableHead>
                <TableHead>অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
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
                    {tenant.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                        onClick={() => {
                          setVacateTenant(tenant);
                          setVacateOpen(true);
                        }}
                      >
                        রুম ছেড়ে দিন
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {tenants.map((tenant) => (
          <Card key={tenant.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-base">{tenant.name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
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
                {tenant.isActive ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300">
                    সক্রিয়
                  </Badge>
                ) : (
                  <Badge variant="secondary">অসক্রিয়</Badge>
                )}
              </div>
              {tenant.isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full gap-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                  onClick={() => {
                    setVacateTenant(tenant);
                    setVacateOpen(true);
                  }}
                >
                  রুম ছেড়ে দিন
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vacate Dialog */}
      <Dialog open={vacateOpen} onOpenChange={setVacateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ভাড়াটে রুম ছেড়ে দিন</DialogTitle>
            <DialogDescription>
              {vacateTenant?.name} রুম ছেড়ে দিচ্ছেন। নিচে প্রাথমিক মালামালের তালিকা
              দেখুন।
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
                <p className="text-xs text-muted-foreground">শুরুর তারিখ</p>
                <p className="font-semibold">
                  {vacateTenant && formatDate(vacateTenant.startDate)}
                </p>
              </div>
            </div>

            {vacateTenant?.inventories &&
              vacateTenant.inventories.length > 0 && (
                <div>
                  <Label className="mb-2 block">
                    প্রাথমিক মালামালের তালিকা
                  </Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>নাম</TableHead>
                          <TableHead>পরিমাণ</TableHead>
                          <TableHead>অবস্থা</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vacateTenant.inventories.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.condition}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

            {vacateTenant?.inventories &&
              vacateTenant.inventories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  কোনো মালামালের রেকর্ড নেই।
                </p>
              )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVacateOpen(false)}>
              বাতিল
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleVacate}
            >
              রুম ছেড়ে দিন
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
// TAB 3 — Inventory Search
// ═══════════════════════════════════════════════════════════════════════════

function InventoryTab() {
  const [searchRoomNumber, setSearchRoomNumber] = useState("");
  const [searched, setSearched] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [tenantHistory, setTenantHistory] = useState<Tenant[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Add inventory dialog
  const [addInvOpen, setAddInvOpen] = useState(false);
  const [invName, setInvName] = useState("");
  const [invQty, setInvQty] = useState("1");
  const [invCondition, setInvCondition] = useState("ভালো");
  const [invNote, setInvNote] = useState("");
  const [invRoomId, setInvRoomId] = useState("");
  const [invTenantId, setInvTenantId] = useState("");

  // Edit inventory dialog
  const [editInvOpen, setEditInvOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const handleSearch = async () => {
    if (!searchRoomNumber.trim()) {
      toast.error("রুম নম্বর দিন");
      return;
    }
    try {
      setSearchLoading(true);
      const [invRes, tenRes] = await Promise.all([
        fetch(`/api/inventory?roomNumber=${encodeURIComponent(searchRoomNumber.trim())}`),
        fetch("/api/tenants"),
      ]);
      if (!invRes.ok || !tenRes.ok) throw new Error();
      const invData = await invRes.json();
      const tenData = await tenRes.json();

      setInventory(invData);

      // Filter tenants for this room
      const roomItem = invData.find((i: InventoryItem) => i.roomId);
      const rid = roomItem?.roomId;
      setTenantHistory(
        rid
          ? tenData.filter((t: Tenant) => t.roomId === rid)
          : tenData.filter(
              (t: Tenant) =>
                t.room?.roomNumber === searchRoomNumber.trim()
            )
      );

      if (rid) {
        setInvRoomId(rid);
        // Find active tenant
        const activeTenant = tenData.find(
          (t: Tenant) => t.roomId === rid && t.isActive
        );
        setInvTenantId(activeTenant?.id || "");
      }

      setSearched(true);
    } catch {
      toast.error("খুঁজতে সমস্যা হয়েছে");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddInventory = async () => {
    if (!invName.trim()) {
      toast.error("মালামালের নাম দিন");
      return;
    }
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: invName.trim(),
          quantity: parseInt(invQty) || 1,
          condition: invCondition,
          roomNumber: searchRoomNumber.trim(),
          tenantId: invTenantId || null,
          roomId: invRoomId,
          note: invNote.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "মালামাল যোগ করতে সমস্যা হয়েছে");
        return;
      }
      toast.success("মালামাল যোগ হয়েছে");
      setInvName("");
      setInvQty("1");
      setInvCondition("ভালো");
      setInvNote("");
      setAddInvOpen(false);
      handleSearch();
    } catch {
      toast.error("মালামাল যোগ করতে সমস্যা হয়েছে");
    }
  };

  const handleDeleteInventory = async (id: string) => {
    try {
      const res = await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("মালামাল মুছে ফেলা হয়েছে");
      handleSearch();
    } catch {
      toast.error("মালামাল মুছে ফেলতে সমস্যা হয়েছে");
    }
  };

  const handleEditInventory = async () => {
    if (!editItem) return;
    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editItem.id,
          itemName: editItem.itemName,
          quantity: editItem.quantity,
          condition: editItem.condition,
          note: editItem.note,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("মালামাল আপডেট হয়েছে");
      setEditInvOpen(false);
      setEditItem(null);
      handleSearch();
    } catch {
      toast.error("মালামাল আপডেট করতে সমস্যা হয়েছে");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Package className="size-5 text-emerald-600" />
        রুম অনুসারে মালামাল খোঁজ
      </h2>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="রুম নম্বর লিখুন (যেমন: ১০১)"
                value={searchRoomNumber}
                onChange={(e) => setSearchRoomNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={handleSearch}
              disabled={searchLoading}
            >
              {searchLoading ? (
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              খুঁজুন
            </Button>
          </div>
        </CardContent>
      </Card>

      {!searched && (
        <Alert>
          <Search className="size-4" />
          <AlertDescription>
            রুম নম্বর দিয়ে মালামাল খুঁজুন
          </AlertDescription>
        </Alert>
      )}

      {searched && (
        <>
          {/* Current inventory */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-semibold">
              বর্তমান মালামাল{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (রুম: {searchRoomNumber})
              </span>
            </h3>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              size="sm"
              onClick={() => setAddInvOpen(true)}
            >
              <Plus className="size-4" />
              নতুন মালামাল যোগ
            </Button>
          </div>

          {inventory.length === 0 ? (
            <Alert>
              <Package className="size-4" />
              <AlertDescription>
                এই রুমে কোনো মালামাল নেই
              </AlertDescription>
            </Alert>
          ) : (
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-emerald-50/50">
                      <TableHead>নাম</TableHead>
                      <TableHead>পরিমাণ</TableHead>
                      <TableHead>অবস্থা</TableHead>
                      <TableHead>তারিখ</TableHead>
                      <TableHead>নোট</TableHead>
                      <TableHead>অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.itemName}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              item.condition === "ভালো"
                                ? "border-emerald-300 text-emerald-700"
                                : item.condition === "মাঝারি"
                                  ? "border-yellow-300 text-yellow-700"
                                  : item.condition === "নস্ট"
                                    ? "border-violet-300 text-violet-700 bg-violet-50"
                                    : "border-red-300 text-red-700"
                            }
                          >
                            {item.condition}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.addedDate)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-32 truncate">
                          {item.note || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setEditItem(item);
                                setEditInvOpen(true);
                              }}
                            >
                              <Edit3 className="size-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    মালামাল মুছে ফেলবেন?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    &quot;{item.itemName}&quot; স্থায়ীভাবে
                                    মুছে যাবে।
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    বাতিল
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() =>
                                      handleDeleteInventory(item.id)
                                    }
                                  >
                                    মুছে ফেলুন
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Mobile cards for inventory */}
          <div className="md:hidden space-y-2">
            {inventory.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                কোনো মালামাল নেই
              </p>
            )}
            {inventory.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        পরিমাণ: {item.quantity} • {item.condition} •{" "}
                        {formatDate(item.addedDate)}
                      </p>
                      {item.note && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.note}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          setEditItem(item);
                          setEditInvOpen(true);
                        }}
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteInventory(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tenant history */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">
              ভাড়াটে ইতিহাস
            </h3>
            {tenantHistory.length === 0 ? (
              <Alert>
                <Users className="size-4" />
                <AlertDescription>
                  এই রুমে কোনো ভাড়াটের রেকর্ড নেই
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {tenantHistory.map((tenant) => (
                  <Card key={tenant.id}>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {tenant.name}
                        </CardTitle>
                        <Badge
                          className={
                            tenant.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-300"
                          }
                        >
                          {tenant.isActive ? "সক্রিয়" : "অসক্রিয়"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(tenant.startDate)}
                        {tenant.endDate && ` — ${formatDate(tenant.endDate)}`}
                      </p>
                      {tenant.inventories && tenant.inventories.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">
                            মালামাল:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {tenant.inventories.map((inv) => (
                              <Badge key={inv.id} variant="outline" className="text-xs">
                                {inv.itemName} ({inv.quantity}) - {inv.condition}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add inventory dialog */}
      <Dialog open={addInvOpen} onOpenChange={setAddInvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>নতুন মালামাল যোগ করুন</DialogTitle>
            <DialogDescription>
              রুম {searchRoomNumber} এ নতুন মালামাল যোগ করুন
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>মালামালের নাম *</Label>
              <Input
                placeholder="যেমন: ফ্যান"
                value={invName}
                onChange={(e) => setInvName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>পরিমাণ</Label>
                <Input
                  type="number"
                  min={1}
                  value={invQty}
                  onChange={(e) => setInvQty(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>অবস্থা</Label>
                <Select
                  value={invCondition}
                  onValueChange={setInvCondition}
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
            </div>
            <div className="space-y-1.5">
              <Label>নোট (ঐচ্ছিক)</Label>
              <Textarea
                placeholder="কোনো বিশেষ নোট"
                value={invNote}
                onChange={(e) => setInvNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddInvOpen(false)}>
              বাতিল
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleAddInventory}
            >
              যোগ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit inventory dialog */}
      <Dialog open={editInvOpen} onOpenChange={setEditInvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>মালামাল সম্পাদনা</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>মালামালের নাম</Label>
                <Input
                  value={editItem.itemName}
                  onChange={(e) =>
                    setEditItem({ ...editItem, itemName: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>পরিমাণ</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editItem.quantity}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>অবস্থা</Label>
                  <Select
                    value={editItem.condition}
                    onValueChange={(v) =>
                      setEditItem({ ...editItem, condition: v })
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
              </div>
              <div className="space-y-1.5">
                <Label>নোট</Label>
                <Textarea
                  value={editItem.note || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, note: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditInvOpen(false);
                setEditItem(null);
              }}
            >
              বাতিল
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleEditInventory}
            >
              আপডেট করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4 — Trouble Reports
// ═══════════════════════════════════════════════════════════════════════════

function TroublesTab() {
  const [reports, setReports] = useState<TroubleReport[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  // Create report dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [crBuildingId, setCrBuildingId] = useState("");
  const [crFloorId, setCrFloorId] = useState("");
  const [crRoomId, setCrRoomId] = useState("");
  const [crRoomNumber, setCrRoomNumber] = useState("");
  const [crDescription, setCrDescription] = useState("");
  const [crReportedBy, setCrReportedBy] = useState("");

  // Resolve dialog
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveReport, setResolveReport] = useState<TroubleReport | null>(
    null
  );
  const [rsNote, setRsNote] = useState("");
  const [rsResolvedBy, setRsResolvedBy] = useState("");
  const [rsNewItems, setRsNewItems] = useState<
    { itemName: string; quantity: string; condition: string; note: string }[]
  >([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, bRes] = await Promise.all([
        fetch("/api/troubles"),
        fetch("/api/buildings"),
      ]);
      if (!tRes.ok || !bRes.ok) throw new Error();
      setReports(await tRes.json());
      setBuildings(await bRes.json());
    } catch {
      toast.error("তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const crBuilding = buildings.find((b) => b.id === crBuildingId);
  const crFloor = crBuilding?.floors?.find((f) => f.id === crFloorId);
  const crRoom = crFloor?.rooms?.find((r) => r.id === crRoomId);

  useEffect(() => {
    if (crRoom) setCrRoomNumber(crRoom.roomNumber);
    else setCrRoomNumber("");
  }, [crRoom]);

  const handleCreate = async () => {
    if (!crRoomId || !crDescription.trim() || !crReportedBy.trim()) {
      toast.error("রুম, বিবরণ ও প্রতিবেদকের নাম দিন");
      return;
    }
    try {
      const res = await fetch("/api/troubles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber: crRoomNumber,
          roomId: crRoomId,
          description: crDescription.trim(),
          reportedBy: crReportedBy.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("ট্রাবল রিপোর্ট তৈরি হয়েছে");
      setCreateOpen(false);
      setCrBuildingId("");
      setCrFloorId("");
      setCrRoomId("");
      setCrRoomNumber("");
      setCrDescription("");
      setCrReportedBy("");
      loadData();
    } catch {
      toast.error("ট্রাবল রিপোর্ট তৈরি করতে সমস্যা হয়েছে");
    }
  };

  const handleResolve = async () => {
    if (!resolveReport || !rsResolvedBy.trim()) {
      toast.error("সমাধানকারীর নাম দিন");
      return;
    }
    try {
      const res = await fetch("/api/troubles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resolveReport.id,
          resolutionNote: rsNote.trim() || null,
          resolvedBy: rsResolvedBy.trim(),
          newItems: rsNewItems.filter((i) => i.itemName.trim()),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("সমস্যা সমাধান হয়েছে");
      setResolveOpen(false);
      setResolveReport(null);
      setRsNote("");
      setRsResolvedBy("");
      setRsNewItems([]);
      loadData();
    } catch {
      toast.error("সমস্যা সমাধান করতে সমস্যা হয়েছে");
    }
  };

  const addRsItem = () =>
    setRsNewItems((prev) => [
      ...prev,
      { itemName: "", quantity: "1", condition: "ভালো", note: "" },
    ]);

  const removeRsItem = (idx: number) =>
    setRsNewItems((prev) => prev.filter((_, i) => i !== idx));

  const updateRsItem = (
    idx: number,
    field: string,
    value: string
  ) =>
    setRsNewItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <AlertTriangle className="size-5 text-emerald-600" />
          ট্রাবল রিপোর্ট
        </h2>
        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) {
              setCrBuildingId("");
              setCrFloorId("");
              setCrRoomId("");
              setCrRoomNumber("");
              setCrDescription("");
              setCrReportedBy("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="size-4" />
              নতুন রিপোর্ট
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>নতুন ট্রাবল রিপোর্ট</DialogTitle>
              <DialogDescription>
                সমস্যার বিবরণ এবং রুম নির্বাচন করুন
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Room cascade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>বিল্ডিং</Label>
                  <Select
                    value={crBuildingId}
                    onValueChange={(v) => {
                      setCrBuildingId(v);
                      setCrFloorId("");
                      setCrRoomId("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="বিল্ডিং" />
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
                  <Label>তলা</Label>
                  <Select
                    value={crFloorId}
                    onValueChange={(v) => {
                      setCrFloorId(v);
                      setCrRoomId("");
                    }}
                    disabled={!crBuildingId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="তলা" />
                    </SelectTrigger>
                    <SelectContent>
                      {crBuilding?.floors?.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.floorNumber} তলা
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>রুম</Label>
                  <Select
                    value={crRoomId}
                    onValueChange={setCrRoomId}
                    disabled={!crFloorId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="রুম" />
                    </SelectTrigger>
                    <SelectContent>
                      {crFloor?.rooms?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.roomNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>সমস্যার বিবরণ *</Label>
                <Textarea
                  placeholder="সমস্যার বিস্তারিত লিখুন..."
                  value={crDescription}
                  onChange={(e) => setCrDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label>প্রতিবেদকের নাম *</Label>
                <Input
                  placeholder="যে রিপোর্ট করছেন"
                  value={crReportedBy}
                  onChange={(e) => setCrReportedBy(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                বাতিল
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleCreate}
              >
                জমা দিন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {reports.length === 0 && (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            কোনো ট্রাবল রিপোর্ট নেই।
          </AlertDescription>
        </Alert>
      )}

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-emerald-50/50">
                <TableHead>রুম</TableHead>
                <TableHead>বিবরণ</TableHead>
                <TableHead>প্রতিবেদক</TableHead>
                <TableHead>তারিখ</TableHead>
                <TableHead>অবস্থা</TableHead>
                <TableHead>অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    {report.roomNumber}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {report.description}
                  </TableCell>
                  <TableCell>{report.reportedBy}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(report.reportedAt)}
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    {report.status !== "সমাধান হয়েছে" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        onClick={() => {
                          setResolveReport(report);
                          setRsNote("");
                          setRsResolvedBy("");
                          setRsNewItems([]);
                          setResolveOpen(true);
                        }}
                      >
                        <CheckCircle2 className="size-3" />
                        সমস্যা সমাধান
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BedDouble className="size-3.5 text-emerald-600" />
                    <span className="font-semibold">
                      রুম: {report.roomNumber}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {report.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>প্রতিবেদক: {report.reportedBy}</span>
                    <span>{formatDate(report.reportedAt)}</span>
                  </div>
                </div>
                <div>{getStatusBadge(report.status)}</div>
              </div>
              {report.status !== "সমাধান হয়েছে" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                  onClick={() => {
                    setResolveReport(report);
                    setRsNote("");
                    setRsResolvedBy("");
                    setRsNewItems([]);
                    setResolveOpen(true);
                  }}
                >
                  <CheckCircle2 className="size-3" />
                  সমস্যা সমাধান
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resolve dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>সমস্যা সমাধান</DialogTitle>
            <DialogDescription>
              রুম {resolveReport?.roomNumber} - {resolveReport?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                মূল সমস্যা: {resolveReport?.description}
              </p>
              <p className="text-muted-foreground">
                প্রতিবেদক: {resolveReport?.reportedBy} • তারিখ:{" "}
                {resolveReport && formatDate(resolveReport.reportedAt)}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>সমাধানকারীর নাম *</Label>
              <Input
                placeholder="যিনি সমাধান করেছেন"
                value={rsResolvedBy}
                onChange={(e) => setRsResolvedBy(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>সমাধানের বিবরণ</Label>
              <Textarea
                placeholder="সমস্যা কীভাবে সমাধান করা হয়েছে..."
                value={rsNote}
                onChange={(e) => setRsNote(e.target.value)}
                rows={3}
              />
            </div>

            {/* New items added during repair */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>নতুন মালামাল যোগ (যদি মেরামতে নতুন কিছু যোগ হয়)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={addRsItem}
                >
                  <Plus className="size-3" />
                  আইটেম
                </Button>
              </div>

              {rsNewItems.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {rsNewItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_70px_90px_1fr_32px] gap-2 items-end"
                    >
                      <div className="space-y-1">
                        {idx === 0 && (
                          <span className="text-xs text-muted-foreground">
                            নাম
                          </span>
                        )}
                        <Input
                          placeholder="নাম"
                          value={item.itemName}
                          onChange={(e) =>
                            updateRsItem(idx, "itemName", e.target.value)
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
                            updateRsItem(idx, "quantity", e.target.value)
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
                            updateRsItem(idx, "condition", v)
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
                      <div className="space-y-1">
                        {idx === 0 && (
                          <span className="text-xs text-muted-foreground">
                            নোট
                          </span>
                        )}
                        <Input
                          placeholder="নোট"
                          value={item.note}
                          onChange={(e) =>
                            updateRsItem(idx, "note", e.target.value)
                          }
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 size-8 p-0"
                        onClick={() => removeRsItem(idx)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {rsNewItems.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  মেরামতে নতুন কোনো মালামাল যোগ হলে উপরে &quot;আইটেম&quot;
                  বাটনে ক্লিক করুন
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>
              বাতিল
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleResolve}
            >
              সমাধান নিশ্চিত করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5 — Room-wise Search (Tenants + Inventory with edit/delete)
// ═══════════════════════════════════════════════════════════════════════════

interface RoomWiseData {
  roomNumber: string;
  currentTenant: {
    id: string; name: string; phone: string | null; startDate: string;
  } | null;
  previousTenants: {
    id: string; name: string; phone: string | null;
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
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [searchType, setSearchType] = useState<"tenant" | "inventory">("tenant");
  const [searched, setSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [data, setData] = useState<RoomWiseData | null>(null);

  // Edit tenant
  const [editTenantOpen, setEditTenantOpen] = useState(false);
  const [editTenantData, setEditTenantData] = useState<{
    id: string; name: string; phone: string;
  } | null>(null);

  // Edit inventory
  const [editInvOpen, setEditInvOpen] = useState(false);
  const [editInvItem, setEditInvItem] = useState<{
    id: string; itemName: string; quantity: number; condition: string; note: string | null;
  } | null>(null);

  // Add inventory to specific tenant context
  const [addInvOpen, setAddInvOpen] = useState(false);
  const [addInvTarget, setAddInvTarget] = useState<"current" | "previous">("current");
  const [addInvName, setAddInvName] = useState("");
  const [addInvQty, setAddInvQty] = useState("1");
  const [addInvCondition, setAddInvCondition] = useState("ভালো");
  const [addInvNote, setAddInvNote] = useState("");
  const [addInvTenantId, setAddInvTenantId] = useState("");

  useEffect(() => {
    fetch("/api/buildings")
      .then((r) => r.json())
      .then(setBuildings)
      .catch(() => {});
  }, []);

  const selectedBuilding = buildings.find((b) => b.id === buildingId);
  const selectedFloor = selectedBuilding?.floors?.find((f) => f.id === floorId);

  const handleSearch = async () => {
    if (!roomId) {
      toast.error("বিল্ডিং এবং রুম নির্বাচন করুন");
      return;
    }
    try {
      setSearchLoading(true);
      const res = await fetch(`/api/room-wise-data?roomId=${roomId}`);
      if (!res.ok) throw new Error();
      const result = await res.json();
      setData(result);
      setSearched(true);
    } catch {
      toast.error("তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setSearchLoading(false);
    }
  };

  // ── Tenant CRUD ──
  const handleEditTenant = async () => {
    if (!editTenantData) return;
    try {
      const res = await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editTenantData.id,
          action: "updateInfo",
          name: editTenantData.name,
          phone: editTenantData.phone || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("ভাড়াটে তথ্য আপডেট হয়েছে");
      setEditTenantOpen(false);
      setEditTenantData(null);
      handleSearch();
    } catch {
      toast.error("আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const handleDeleteTenant = async (id: string) => {
    try {
      const res = await fetch("/api/tenants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("ভাড়াটে মুছে ফেলা হয়েছে");
      handleSearch();
    } catch {
      toast.error("মুছে ফেলতে সমস্যা হয়েছে");
    }
  };

  // ── Inventory CRUD ──
  const handleEditInventory = async () => {
    if (!editInvItem) return;
    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editInvItem.id,
          itemName: editInvItem.itemName,
          quantity: editInvItem.quantity,
          condition: editInvItem.condition,
          note: editInvItem.note,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("মালামাল আপডেট হয়েছে");
      setEditInvOpen(false);
      setEditInvItem(null);
      handleSearch();
    } catch {
      toast.error("মালামাল আপডেট করতে সমস্যা হয়েছে");
    }
  };

  const handleDeleteInventory = async (id: string) => {
    try {
      const res = await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("মালামাল মুছে ফেলা হয়েছে");
      handleSearch();
    } catch {
      toast.error("মালামাল মুছে ফেলতে সমস্যা হয়েছে");
    }
  };

  const handleAddInventory = async () => {
    if (!addInvName.trim() || !data) {
      toast.error("মালামালের নাম দিন");
      return;
    }
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: addInvName.trim(),
          quantity: parseInt(addInvQty) || 1,
          condition: addInvCondition,
          roomNumber: data.roomNumber,
          tenantId: addInvTenantId || null,
          roomId: roomId,
          note: addInvNote.trim() || null,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.error || "মালামাল যোগ করতে সমস্যা হয়েছে");
        return;
      }
      toast.success("মালামাল যোগ হয়েছে");
      setAddInvName("");
      setAddInvQty("1");
      setAddInvCondition("ভালো");
      setAddInvNote("");
      setAddInvOpen(false);
      handleSearch();
    } catch {
      toast.error("মালামাল যোগ করতে সমস্যা হয়েছে");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <ClipboardList className="size-5 text-emerald-600" />
        রুমভিত্তিক তালিকা
      </h2>

      {/* Search Card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Building + Room selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>বিল্ডিং নির্বাচন</Label>
              <Select
                value={buildingId}
                onValueChange={(v) => {
                  setBuildingId(v);
                  setFloorId("");
                  setRoomId("");
                  setSearched(false);
                  setData(null);
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
              <Label>রুম নির্বাচন</Label>
              <Select
                value={roomId}
                onValueChange={(v) => {
                  setRoomId(v);
                  setSearched(false);
                  setData(null);
                }}
                disabled={!buildingId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={!buildingId ? "আগে বিল্ডিং বেছে নিন" : "রুম বেছে নিন"} />
                </SelectTrigger>
                <SelectContent>
                  {selectedBuilding?.floors
                    ?.sort((a, b) => a.floorNumber - b.floorNumber)
                    .map((floor) => (
                      <SelectGroup key={floor.id}>
                        <SelectLabel className="text-xs font-semibold text-muted-foreground bg-muted/50">
                          {floor.floorNumber} তলা
                        </SelectLabel>
                        {floor.rooms?.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            <span className="flex items-center gap-2">
                              {room.roomNumber}
                              {room.tenants?.length > 0 && (
                                <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search type toggle + Search button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="space-y-1.5 flex-1">
              <Label>সার্চ টাইপ</Label>
              <div className="flex gap-2">
                <Button
                  variant={searchType === "tenant" ? "default" : "outline"}
                  className={
                    searchType === "tenant"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 flex-1"
                      : "gap-1.5 flex-1"
                  }
                  onClick={() => setSearchType("tenant")}
                >
                  <Users className="size-4" />
                  ভাড়াটে তালিকা
                </Button>
                <Button
                  variant={searchType === "inventory" ? "default" : "outline"}
                  className={
                    searchType === "inventory"
                      ? "bg-amber-600 hover:bg-amber-700 text-white gap-1.5 flex-1"
                      : "gap-1.5 flex-1"
                  }
                  onClick={() => setSearchType("inventory")}
                >
                  <Package className="size-4" />
                  মালামাল তালিকা
                </Button>
              </div>
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 px-6"
              onClick={handleSearch}
              disabled={searchLoading || !roomId}
            >
              {searchLoading ? (
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              সার্চ করুন
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* No search yet */}
      {!searched && (
        <Alert>
          <Search className="size-4" />
          <AlertDescription>
            বিল্ডিং ও রুম নির্বাচন করে সার্চ করুন
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {searched && data && (
        <div className="space-y-4">
          {/* Room info banner - context aware */}
          <div className="bg-white rounded-lg border px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-100 text-emerald-700">
                <BedDouble className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">
                  রুম: {data.roomNumber}
                </p>
                {searchType === "tenant" ? (
                  <p className="text-xs text-muted-foreground">
                    বর্তমান: {data.currentTenant ? data.currentTenant.name : "কেউ নেই"} &bull;
                    আগে: {data.previousTenants.length} জন
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    বর্তমান: {data.currentInventory.length} টি &bull;
                    আগে: {data.previousInventory.length} টি
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ═══ TENANT SEARCH RESULTS - COMPACT ═══ */}
          {searchType === "tenant" && (
            <div className="space-y-4">
              {/* Current Tenant - compact */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-emerald-700">
                  <Users className="size-3.5" />
                  বর্তমান ভাড়াটে
                </h3>
                {data.currentTenant ? (
                  <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-200 rounded-lg px-3 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-sm font-bold shrink-0">
                      {data.currentTenant.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">নাম</span>
                        <p className="font-medium truncate">{data.currentTenant.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">ফোন</span>
                        <p className="font-medium truncate">{data.currentTenant.phone || "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">শুরু</span>
                        <p className="font-medium text-xs">{formatDate(data.currentTenant.startDate)}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          setEditTenantData({
                            id: data.currentTenant!.id,
                            name: data.currentTenant!.name,
                            phone: data.currentTenant!.phone || "",
                          });
                          setEditTenantOpen(true);
                        }}
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ভাড়াটে মুছে ফেলবেন?</AlertDialogTitle>
                            <AlertDialogDescription>
                              &quot;{data.currentTenant.name}&quot; এর সকল তথ্য স্থায়ীভাবে মুছে যাবে।
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>বাতিল</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => handleDeleteTenant(data.currentTenant!.id)}
                            >
                              মুছে ফেলুন
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground bg-gray-50 rounded-lg px-3 py-2">এই রুমে বর্তমানে কোনো ভাড়াটে নেই</p>
                )}
              </div>

              {/* Previous Tenants - compact list */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-gray-600">
                  <Users className="size-3.5" />
                  পূর্বের ভাড়াটেগণ
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{data.previousTenants.length}</Badge>
                </h3>
                {data.previousTenants.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-gray-50 rounded-lg px-3 py-2">এই রুমে আগে কোনো ভাড়াটে ছিল না</p>
                ) : (
                  <div className="space-y-1.5">
                    {data.previousTenants.map((tenant) => (
                      <div key={tenant.id} className="flex items-center gap-3 border rounded-lg px-3 py-2 bg-white hover:bg-gray-50/50">
                        <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {tenant.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">নাম</span>
                            <p className="font-medium truncate">{tenant.name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">ফোন</span>
                            <p className="font-medium truncate">{tenant.phone || "-"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">সময়কাল</span>
                            <p className="font-medium text-xs">
                              {formatDate(tenant.startDate)}
                              {tenant.endDate ? ` — ${formatDate(tenant.endDate)}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              setEditTenantData({
                                id: tenant.id,
                                name: tenant.name,
                                phone: tenant.phone || "",
                              });
                              setEditTenantOpen(true);
                            }}
                          >
                            <Edit3 className="size-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>ভাড়াটে মুছে ফেলবেন?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  &quot;{tenant.name}&quot; এর সকল তথ্য ও মালামালের রেকর্ড স্থায়ীভাবে মুছে যাবে।
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => handleDeleteTenant(tenant.id)}
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
              </div>
            </div>
          )}

          {/* ═══ INVENTORY SEARCH RESULTS - VERY COMPACT BOXES ═══ */}
          {searchType === "inventory" && (
            <div className="space-y-2">
              {/* Current Inventory - tiny compact rows */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs font-semibold flex items-center gap-1 text-emerald-700">
                    <Package className="size-3" />
                    বর্তমান মালামাল
                    <Badge variant="secondary" className="text-[9px] h-3.5 px-1">{data.currentInventory.length}</Badge>
                  </h3>
                  <Button
                    size="sm"
                    className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white gap-0.5 px-2"
                    onClick={() => {
                      setAddInvTarget("current");
                      setAddInvTenantId(data.currentTenant?.id || "");
                      setAddInvName("");
                      setAddInvQty("1");
                      setAddInvCondition("ভালো");
                      setAddInvNote("");
                      setAddInvOpen(true);
                    }}
                  >
                    <Plus className="size-2.5" />
                    যোগ
                  </Button>
                </div>
                {data.currentInventory.length === 0 ? (
                  <p className="text-xs text-muted-foreground bg-gray-50 rounded px-2 py-1.5">কোনো মালামাল নেই</p>
                ) : (
                  <div className="bg-white border rounded-lg overflow-hidden divide-y">
                    {data.currentInventory.map((item) => (
                      <div key={item.id} className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50/80 group">
                        <span className="text-xs font-medium flex-1 truncate min-w-0">{item.itemName}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">×{item.quantity}</span>
                        <span className="shrink-0">
                          <Badge variant="outline" className={
                            item.condition === "ভালো"
                              ? "border-emerald-300 text-emerald-700 text-[10px] h-4 px-1"
                              : item.condition === "মাঝারি"
                                ? "border-yellow-300 text-yellow-700 text-[10px] h-4 px-1"
                                : item.condition === "নস্ট"
                                  ? "border-violet-300 text-violet-700 bg-violet-50 text-[10px] h-4 px-1"
                                  : "border-red-300 text-red-700 text-[10px] h-4 px-1"
                          }>{item.condition}</Badge>
                        </span>
                        <div className="flex gap-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="size-5 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => { setEditInvItem({ id: item.id, itemName: item.itemName, quantity: item.quantity, condition: item.condition, note: item.note }); setEditInvOpen(true); }}>
                            <Edit3 className="size-2.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="size-5 p-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="size-2.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>মালামাল মুছে ফেলবেন?</AlertDialogTitle>
                                <AlertDialogDescription>&quot;{item.itemName}&quot; স্থায়ীভাবে মুছে যাবে।</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteInventory(item.id)}>মুছে ফেলুন</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Previous Inventory - tiny compact rows */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs font-semibold flex items-center gap-1 text-gray-600">
                    <Package className="size-3" />
                    পূর্বের মালামাল
                    <Badge variant="secondary" className="text-[9px] h-3.5 px-1">{data.previousInventory.length}</Badge>
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] gap-0.5 px-2"
                    onClick={() => {
                      setAddInvTarget("previous");
                      setAddInvTenantId(data.previousTenants.length > 0 ? data.previousTenants[0].id : "");
                      setAddInvName("");
                      setAddInvQty("1");
                      setAddInvCondition("ভালো");
                      setAddInvNote("");
                      setAddInvOpen(true);
                    }}
                  >
                    <Plus className="size-2.5" />
                    যোগ
                  </Button>
                </div>
                {data.previousInventory.length === 0 ? (
                  <p className="text-xs text-muted-foreground bg-gray-50 rounded px-2 py-1.5">আগে কোনো মালামালের রেকর্ড নেই</p>
                ) : (
                  <div className="bg-white border rounded-lg overflow-hidden divide-y opacity-80">
                    {data.previousInventory.map((item) => (
                      <div key={item.id} className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50/80 group">
                        <span className="text-xs font-medium flex-1 truncate min-w-0">{item.itemName}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">×{item.quantity}</span>
                        <span className="shrink-0">
                          <Badge variant="outline" className={
                            item.condition === "ভালো"
                              ? "border-emerald-300 text-emerald-700 text-[10px] h-4 px-1"
                              : item.condition === "মাঝারি"
                                ? "border-yellow-300 text-yellow-700 text-[10px] h-4 px-1"
                                : item.condition === "নস্ট"
                                  ? "border-violet-300 text-violet-700 bg-violet-50 text-[10px] h-4 px-1"
                                  : "border-red-300 text-red-700 text-[10px] h-4 px-1"
                          }>{item.condition}</Badge>
                        </span>
                        {item.tenantName && <span className="text-[10px] text-muted-foreground truncate max-w-16 hidden sm:inline">— {item.tenantName}</span>}
                        <div className="flex gap-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="size-5 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => { setEditInvItem({ id: item.id, itemName: item.itemName, quantity: item.quantity, condition: item.condition, note: item.note }); setEditInvOpen(true); }}>
                            <Edit3 className="size-2.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="size-5 p-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="size-2.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>মালামাল মুছে ফেলবেন?</AlertDialogTitle>
                                <AlertDialogDescription>&quot;{item.itemName}&quot; স্থায়ীভাবে মুছে যাবে।</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteInventory(item.id)}>মুছে ফেলুন</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Edit Tenant Dialog ═══ */}
      <Dialog open={editTenantOpen} onOpenChange={setEditTenantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ভাড়াটে তথ্য সম্পাদনা</DialogTitle>
          </DialogHeader>
          {editTenantData && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>নাম</Label>
                <Input
                  value={editTenantData.name}
                  onChange={(e) =>
                    setEditTenantData({
                      ...editTenantData,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>ফোন নম্বর</Label>
                <Input
                  value={editTenantData.phone}
                  onChange={(e) =>
                    setEditTenantData({
                      ...editTenantData,
                      phone: e.target.value,
                    })
                  }
                  placeholder="০১XXXXXXXXX"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditTenantOpen(false);
                setEditTenantData(null);
              }}
            >
              বাতিল
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleEditTenant}
            >
              আপডেট করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Edit Inventory Dialog ═══ */}
      <Dialog open={editInvOpen} onOpenChange={setEditInvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>মালামাল সম্পাদনা</DialogTitle>
          </DialogHeader>
          {editInvItem && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>মালামালের নাম</Label>
                <Input
                  value={editInvItem.itemName}
                  onChange={(e) =>
                    setEditInvItem({
                      ...editInvItem,
                      itemName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>পরিমাণ</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editInvItem.quantity}
                    onChange={(e) =>
                      setEditInvItem({
                        ...editInvItem,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>অবস্থা</Label>
                  <Select
                    value={editInvItem.condition}
                    onValueChange={(v) =>
                      setEditInvItem({ ...editInvItem, condition: v })
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
              </div>
              <div className="space-y-1.5">
                <Label>নোট</Label>
                <Textarea
                  value={editInvItem.note || ""}
                  onChange={(e) =>
                    setEditInvItem({ ...editInvItem, note: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditInvOpen(false);
                setEditInvItem(null);
              }}
            >
              বাতিল
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleEditInventory}
            >
              আপডেট করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Add Inventory Dialog ═══ */}
      <Dialog open={addInvOpen} onOpenChange={setAddInvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>নতুন মালামাল যোগ করুন</DialogTitle>
            <DialogDescription>
              রুম {data?.roomNumber} এ নতুন মালামাল যোগ করুন
              {addInvTarget === "current" && data?.currentTenant && (
                <span className="block text-xs mt-1 text-emerald-600">
                  ভাড়াটে: {data.currentTenant.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>মালামালের নাম *</Label>
              <Input
                placeholder="যেমন: ফ্যান"
                value={addInvName}
                onChange={(e) => setAddInvName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>পরিমাণ</Label>
                <Input
                  type="number"
                  min={1}
                  value={addInvQty}
                  onChange={(e) => setAddInvQty(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>অবস্থা</Label>
                <Select
                  value={addInvCondition}
                  onValueChange={setAddInvCondition}
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
            </div>
            <div className="space-y-1.5">
              <Label>নোট (ঐচ্ছিক)</Label>
              <Textarea
                placeholder="কোনো বিশেষ নোট"
                value={addInvNote}
                onChange={(e) => setAddInvNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddInvOpen(false)}>
              বাতিল
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleAddInventory}
            >
              যোগ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      resetAddForm(); setAddOpen(false); loadGuests();
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
    try {
      const res = await fetch("/api/guests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editGuest.id, name: eName.trim(), address: eAddress.trim() || null, mobile: eMobile.trim() || null, referredBy: eReferredBy.trim() || null, checkInDate: eCheckIn, checkOutDate: eCheckOut || null, totalBill: eIsPaid ? (eTotalBill.trim() || null) : "Non Paid", note: eNote.trim() || null, isPaid: eIsPaid }) });
      if (!res.ok) throw new Error();
      toast.success("গেস্ট আপডেট হয়েছে"); setEditOpen(false); setEditGuest(null); loadGuests();
    } catch { toast.error("গেস্ট আপডেট করতে সমস্যা হয়েছে"); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/guests", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error();
      toast.success("গেস্ট মুছে ফেলা হয়েছে"); setExpandedGuestId(null); loadGuests();
    } catch { toast.error("গেস্ট মুছে ফেলতে সমস্যা হয়েছে"); }
  };

  const months = [
    { value: "1", label: "জানুয়ারি" }, { value: "2", label: "ফেব্রুয়ারি" }, { value: "3", label: "মার্চ" },
    { value: "4", label: "এপ্রিল" }, { value: "5", label: "মে" }, { value: "6", label: "জুন" },
    { value: "7", label: "জুলাই" }, { value: "8", label: "আগস্ট" }, { value: "9", label: "সেপ্টেম্বর" },
    { value: "10", label: "অক্টোবর" }, { value: "11", label: "নভেম্বর" }, { value: "12", label: "ডিসেম্বর" },
  ];

  if (loading) return (<div className="flex items-center justify-center py-20"><div className="size-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>);

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
            <Input className="w-full sm:w-[90px] h-8 text-xs" placeholder="বছর (২০২৬)" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} />
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
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}><AlertDialogHeader><AlertDialogTitle>গেস্ট মুছে ফেলবেন?</AlertDialogTitle><AlertDialogDescription>&quot;{guest.name}&quot; এর সকল তথ্য স্থায়ীভাবে মুছে যাবে।</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>বাতিল</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(guest.id)}>মুছে ফেলুন</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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
          <DialogFooter><Button variant="outline" onClick={() => { setEditOpen(false); setEditGuest(null); }}>বাতিল</Button><Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleEdit}>আপডেট করুন</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
