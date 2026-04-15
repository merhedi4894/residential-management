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
  SelectItem,
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
      <Toaster position="top-right" richColors />
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader />
        <MainTabs />
      </div>
    </div>
  );
}

// ── Dashboard Header ─────────────────────────────────────────────────────

function DashboardHeader() {
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
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
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2.5 shadow-sm border">
            <Building2 className="size-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">বিল্ডিং</span>
            <span className="text-lg font-bold text-emerald-700">
              {buildings.length}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2.5 shadow-sm border">
            <BedDouble className="size-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">রুম</span>
            <span className="text-lg font-bold text-emerald-700">
              {totalRooms}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2.5 shadow-sm border">
            <Users className="size-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground">সক্রিয় ভাড়াটে</span>
            <span className="text-lg font-bold text-emerald-700">
              {activeTenants}
            </span>
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
          <span className="hidden sm:inline">বিল্ডিং অনুসারে</span>
          <span className="sm:hidden">তালিকা</span>
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
      </div>

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
// TAB 5 — Building-wise Overview (Inventory + Tenant list)
// ═══════════════════════════════════════════════════════════════════════════

interface OverviewBuilding {
  id: string;
  name: string;
  totalFloors: number;
  floors: OverviewFloor[];
}

interface OverviewFloor {
  id: string;
  floorNumber: number;
  rooms: OverviewRoom[];
}

interface OverviewRoom {
  id: string;
  roomNumber: string;
  activeTenant: { id: string; name: string; phone: string | null; startDate: string } | null;
  allTenants: {
    id: string; name: string; phone: string | null;
    startDate: string; endDate: string | null; isActive: boolean;
  }[];
  inventories: {
    id: string; itemName: string; quantity: number; condition: string;
    note: string | null; addedDate: string;
  }[];
  totalInventoryItems: number;
}

function ovFloorLabel(n: number) {
  const m: Record<number, string> = {
    1: "১ম তলা", 2: "২য় তলা", 3: "৩য় তলা", 4: "৪র্থ তলা",
    5: "৫ম তলা", 6: "৬ষ্ঠ তলা", 7: "৭ম তলা", 8: "৮ম তলা",
    9: "৯ম তলা", 10: "১০ম তলা",
  };
  return m[n] || `${n} তলা`;
}

function OverviewTab() {
  const [buildings, setBuildings] = useState<OverviewBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/overview");
      if (!res.ok) throw new Error();
      setBuildings(await res.json());
    } catch {
      toast.error("ওভারভিউ লোড করতে সমস্যা হয়েছে");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const toggleB = (id: string) => setExpandedBuildings((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleR = (id: string) => setExpandedRooms((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const totalRooms = buildings.reduce((s, b) => s + b.floors.reduce((sf, f) => sf + f.rooms.length, 0), 0);
  const totalOccupied = buildings.reduce((s, b) => s + b.floors.reduce((sf, f) => sf + f.rooms.filter((r) => r.activeTenant).length, 0), 0);
  const totalInv = buildings.reduce((s, b) => s + b.floors.reduce((sf, f) => sf + f.rooms.reduce((sr, r) => sr + r.totalInventoryItems, 0), 0), 0);

  if (loading) return (<div className="flex items-center justify-center py-20"><div className="size-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold flex items-center gap-2"><ClipboardList className="size-5 text-emerald-600" />বিল্ডিং ও রুম অনুসারে তালিকা</h2>
        <Button variant="outline" className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={loadData}><Eye className="size-4" /> রিফ্রেশ</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Building2 className="size-4" />মোট বিল্ডিং</div><p className="text-2xl font-bold text-emerald-700">{buildings.length}</p></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><BedDouble className="size-4" />মোট রুম</div><p className="text-2xl font-bold text-emerald-700">{totalRooms}</p></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Users className="size-4" />ভর্তি রুম</div><p className="text-2xl font-bold text-blue-700">{totalOccupied}</p></div>
        <div className="bg-white rounded-xl border p-4"><div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Package className="size-4" />মোট মালামাল</div><p className="text-2xl font-bold text-amber-700">{totalInv}</p></div>
      </div>
      {buildings.length === 0 && (<Alert><ClipboardList className="size-4" /><AlertDescription>কোনো বিল্ডিং নেই। আগে বিল্ডিং তৈরি করুন।</AlertDescription></Alert>)}
      {buildings.map((building) => {
        const bRooms = building.floors.reduce((s, f) => s + f.rooms.length, 0);
        const bOcc = building.floors.reduce((s, f) => s + f.rooms.filter((r) => r.activeTenant).length, 0);
        const bItems = building.floors.reduce((s, f) => s + f.rooms.reduce((sr, r) => sr + r.totalInventoryItems, 0), 0);
        const bOpen = expandedBuildings.has(building.id);
        return (
          <Collapsible key={building.id} open={bOpen} onOpenChange={() => toggleB(building.id)}>
            <Card className="overflow-hidden">
              <CollapsibleTrigger className="w-full" asChild>
                <div>
                  <CardHeader className="hover:bg-emerald-50/50 transition-colors cursor-pointer py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-100 text-emerald-700"><Building2 className="size-5" /></div>
                        <div className="text-left">
                          <CardTitle className="text-lg">{building.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">তলা: {building.totalFloors} &bull; রুম: {bRooms} &bull; ভর্তি: {bOcc} &bull; মালামাল: {bItems}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={bOcc === bRooms ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300" : "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-300"}>
                          {bOcc === bRooms ? "সব ভর্তি" : `${bOcc}/${bRooms} ভর্তি`}
                        </Badge>
                        {bOpen ? <ChevronDown className="size-5 text-muted-foreground" /> : <ChevronRight className="size-5 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t">
                  {building.floors.map((floor) => (
                    <div key={floor.id} className="border-b last:border-b-0 p-4">
                      <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                        <span className="flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">{floor.floorNumber}</span>
                        {ovFloorLabel(floor.floorNumber)}
                        <span className="text-xs text-muted-foreground font-normal">({floor.rooms.length} রুম)</span>
                      </h4>
                      {floor.rooms.length === 0 && <p className="text-sm text-muted-foreground pl-8">এই তলায় কোনো রুম নেই</p>}
                      <div className="space-y-2 pl-2">
                        {floor.rooms.map((room) => {
                          const rOpen = expandedRooms.has(room.id);
                          return (
                            <Collapsible key={room.id} open={rOpen} onOpenChange={() => toggleR(room.id)}>
                              <Card className="overflow-hidden shadow-sm">
                                <CollapsibleTrigger className="w-full" asChild>
                                  <div>
                                    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer">
                                      <div className="flex items-center gap-3">
                                        <BedDouble className="size-4 text-emerald-600" />
                                        <span className="font-semibold text-sm">{room.roomNumber}</span>
                                        {room.activeTenant ? (<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300 text-xs"><Users className="size-3 mr-1" />{room.activeTenant.name}</Badge>) : (<Badge variant="secondary" className="text-xs">খালি</Badge>)}
                                        <span className="text-xs text-muted-foreground">মালামাল: {room.totalInventoryItems}</span>
                                      </div>
                                      <div>{rOpen ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}</div>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="border-t px-4 py-3 space-y-4 bg-gray-50/30">
                                    {room.activeTenant && (
                                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                        <p className="text-xs text-emerald-700 font-medium mb-1">বর্তমান ভাড়াটে</p>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                          <div><span className="text-muted-foreground text-xs">নাম</span><p className="font-medium">{room.activeTenant.name}</p></div>
                                          <div><span className="text-muted-foreground text-xs">ফোন</span><p className="font-medium">{room.activeTenant.phone || "-"}</p></div>
                                          <div><span className="text-muted-foreground text-xs">শুরু</span><p className="font-medium">{formatDate(room.activeTenant.startDate)}</p></div>
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <h5 className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Package className="size-3.5 text-amber-600" />মালামাল তালিকা<Badge variant="secondary" className="text-xs ml-1">{room.inventories.length}</Badge></h5>
                                      {room.inventories.length === 0 ? (<p className="text-xs text-muted-foreground pl-6">কোনো মালামালের রেকর্ড নেই</p>) : (
                                        <div className="border rounded-lg overflow-hidden">
                                          <Table>
                                            <TableHeader><TableRow className="bg-gray-100"><TableHead className="text-xs h-8">নাম</TableHead><TableHead className="text-xs h-8 w-16 text-center">পরিমাণ</TableHead><TableHead className="text-xs h-8 w-20">অবস্থা</TableHead><TableHead className="text-xs h-8 hidden sm:table-cell">নোট</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                              {room.inventories.map((inv) => (
                                                <TableRow key={inv.id}>
                                                  <TableCell className="text-sm py-1.5">{inv.itemName}</TableCell>
                                                  <TableCell className="text-sm py-1.5 text-center">{inv.quantity}</TableCell>
                                                  <TableCell className="text-sm py-1.5"><Badge variant="outline" className={inv.condition === "ভালো" ? "border-emerald-300 text-emerald-700 text-xs" : inv.condition === "মাঝারি" ? "border-yellow-300 text-yellow-700 text-xs" : inv.condition === "নস্ট" ? "border-violet-300 text-violet-700 bg-violet-50 text-xs" : "border-red-300 text-red-700 text-xs"}>{inv.condition}</Badge></TableCell>
                                                  <TableCell className="text-xs py-1.5 text-muted-foreground hidden sm:table-cell max-w-40 truncate">{inv.note || "-"}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Users className="size-3.5 text-blue-600" />ভাড়াটে তালিকা<Badge variant="secondary" className="text-xs ml-1">{room.allTenants.length}</Badge></h5>
                                      {room.allTenants.length === 0 ? (<p className="text-xs text-muted-foreground pl-6">কোনো ভাড়াটের রেকর্ড নেই</p>) : (
                                        <div className="space-y-1.5">
                                          {room.allTenants.map((t) => (
                                            <div key={t.id} className="flex items-center justify-between bg-white rounded-lg border px-3 py-2 text-sm">
                                              <div className="flex items-center gap-2"><Users className="size-3.5 text-muted-foreground" /><span className="font-medium">{t.name}</span>{t.phone && <span className="text-xs text-muted-foreground">{t.phone}</span>}</div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground hidden sm:inline">{formatDate(t.startDate)}{t.endDate && ` — ${formatDate(t.endDate)}`}</span>
                                                {t.isActive ? (<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300 text-xs">সক্রিয়</Badge>) : (<Badge variant="secondary" className="text-xs">অসক্রিয়</Badge>)}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </Card>
                            </Collapsible>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
