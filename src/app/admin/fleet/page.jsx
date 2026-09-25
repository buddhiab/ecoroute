"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertCircle, CheckCircle2, Trash2, X, AlertTriangle, MapPin, Truck, XCircle, Loader2, Pencil } from "lucide-react";

const COLOMBO_ZONES = [
  "Colombo 01", "Colombo 02", "Colombo 03", "Colombo 04", "Colombo 05",
  "Colombo 06", "Colombo 07", "Colombo 08", "Colombo 09", "Colombo 10",
  "Colombo 11", "Colombo 12", "Colombo 13", "Colombo 14", "Colombo 15"
];

export default function FleetMonitor() {
  const router = useRouter();
  const [drivers, setDrivers] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approving, setApproving] = useState(null); // id of driver being approved

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDriver, setActiveDriver] = useState(null);
  const [editType, setEditType] = useState("");
  const [selectedValue, setSelectedValue] = useState("");

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newVehicleInput, setNewVehicleInput] = useState("");
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  // Notifications & Confirmations
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, actionText, onConfirm }
  const [dispatching, setDispatching] = useState(null); // driver id being dispatched
  const [activeRoutes, setActiveRoutes] = useState({}); // { driverZone: routeId }

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [driversResponse, vehiclesResponse, pendingResponse] = await Promise.all([
        supabase.from("driver_profiles").select("*").eq("is_approved", true).order("created_at", { ascending: false }),
        supabase.from("vehicles").select("registration_number").order("created_at", { ascending: true }),
        supabase.from("driver_profiles").select("*").eq("is_approved", false).order("created_at", { ascending: false }),
      ]);

      if (!driversResponse.error) setDrivers(driversResponse.data || []);
      if (!vehiclesResponse.error) setInventory(vehiclesResponse.data.map(v => v.registration_number) || []);
      if (!pendingResponse.error) setPendingDrivers(pendingResponse.data || []);

      // Also load active routes so we know which drivers already have one
      const { data: routesData } = await supabase
        .from("Routes")
        .select("id, zone, status")
        .eq("status", "In Progress");
      if (routesData) {
        const map = {};
        routesData.forEach(r => { map[r.zone] = r.id; });
        setActiveRoutes(map);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime — watch for new pending driver registrations + approvals
    const channel = supabase
      .channel("admin-fleet-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "driver_profiles" },
        (payload) => {
          if (!payload.new?.is_approved) {
            setPendingDrivers((prev) => [payload.new, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "driver_profiles" },
        (payload) => {
          if (payload.new?.is_approved) {
            // Move from pending → approved list
            setPendingDrivers((prev) => prev.filter((d) => d.id !== payload.new.id));
            setDrivers((prev) => {
              const exists = prev.find((d) => d.id === payload.new.id);
              if (exists) return prev.map((d) => d.id === payload.new.id ? { ...d, ...payload.new } : d);
              return [payload.new, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ── Approve pending driver ──
  const handleApprove = async (driver) => {
    setApproving(driver.id);
    const { error } = await supabase
      .from("driver_profiles")
      .update({ is_approved: true })
      .eq("id", driver.id);
    if (error) {
      showToast("Error approving driver.", "error");
    } else {
      showToast(`Driver ${driver.full_name} approved successfully.`, "success");
    }
    setApproving(null);
  };

  // ── Delete driver ──
  const handleDeleteDriver = (driverId, driverName) => {
    setConfirmDialog({
      title: "Delete Driver Account",
      message: `Are you sure you want to permanently remove ${driverName}? This action cannot be undone and will revoke their system access.`,
      actionText: "Delete Account",
      onConfirm: async () => {
        setConfirmDialog(null);
        const { error } = await supabase
          .from("driver_profiles")
          .delete()
          .eq("id", driverId);
        if (!error) {
          fetchData();
          showToast("Driver account permanently deleted.", "success");
        } else {
          console.error("Delete error:", error);
          showToast(`Error deleting driver: ${error.message}`, "error");
        }
      }
    });
  };

  // ── Dispatch Route ──
  const handleDispatchRoute = async (driver) => {
    setDispatching(driver.id);
    try {
      // Check if this zone already has an active route
      if (activeRoutes[driver.assigned_zone]) {
        showToast(`Zone ${driver.assigned_zone} already has an active route.`, "error");
        return;
      }
      const { data, error } = await supabase
        .from("Routes")
        .insert([{
          zone: driver.assigned_zone,
          driver_name: driver.full_name,
          status: "In Progress",
        }])
        .select()
        .single();
      if (error) throw error;
      setActiveRoutes(prev => ({ ...prev, [driver.assigned_zone]: data.id }));
      showToast(`Route dispatched to ${driver.full_name} (${driver.assigned_zone}).`, "success");
    } catch (err) {
      showToast(err.message || "Failed to dispatch route.", "error");
    } finally {
      setDispatching(null);
    }
  };

  // ── Recall (complete) Route ──
  const handleRecallRoute = async (driver) => {
    const routeId = activeRoutes[driver.assigned_zone];
    if (!routeId) return;
    setDispatching(driver.id);
    try {
      const { error } = await supabase
        .from("Routes")
        .update({ status: "Completed" })
        .eq("id", routeId);
      if (error) throw error;
      setActiveRoutes(prev => {
        const next = { ...prev };
        delete next[driver.assigned_zone];
        return next;
      });
      showToast(`Route recalled for ${driver.full_name}.`, "success");
    } catch (err) {
      showToast(err.message || "Failed to recall route.", "error");
    } finally {
      setDispatching(null);
    }
  };

  // ── Add Vehicle ──
  const handleAddVehiclePrompt = () => {
    setNewVehicleInput("");
    setIsAddVehicleOpen(true);
  };

  const submitNewVehicle = async () => {
    if (!newVehicleInput || newVehicleInput.trim() === "") return;
    const formattedReg = newVehicleInput.trim().toUpperCase();
    const { error } = await supabase
      .from("vehicles")
      .insert([{ registration_number: formattedReg }]);

    if (error) {
      showToast(error.code === "23505" ? "This vehicle already exists in the fleet." : "Error adding vehicle.", "error");
    } else {
      fetchData();
      setIsAddVehicleOpen(false);
      showToast("Vehicle added to fleet successfully.", "success");
    }
  };

  // ── Delete Vehicle ──
  const handleDeleteVehiclePrompt = (vehicleReg) => {
    setVehicleToDelete(vehicleReg);
  };

  const submitDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("registration_number", vehicleToDelete);
    if (!error) {
      fetchData();
      showToast(`Vehicle ${vehicleToDelete} removed from fleet.`, "success");
    } else {
      showToast("Error removing vehicle.", "error");
    }
    setVehicleToDelete(null);
  };

  // ── Edit zone / vehicle modal ──
  const openModal = (driver, type) => {
    setActiveDriver(driver);
    setEditType(type);
    setSelectedValue(type === "zone" ? driver.assigned_zone : driver.vehicle_number);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!activeDriver) return;

    const alertMessage = editType === "zone"
      ? `DISPATCH ALERT: Your assigned route has been changed to ${selectedValue}. Please re-route immediately.`
      : `DISPATCH ALERT: Your vehicle assignment has been updated to ${selectedValue}.`;

    const updateData = editType === "zone"
      ? { assigned_zone: selectedValue, recent_alert: alertMessage }
      : { vehicle_number: selectedValue, recent_alert: alertMessage };

    const { error } = await supabase
      .from("driver_profiles")
      .update(updateData)
      .eq("id", activeDriver.id);

    if (!error) {
      fetchData();
      setIsModalOpen(false);
      showToast("Driver record updated successfully.", "success");
    } else {
      showToast("Error updating driver record.", "error");
    }
  };

  if (isLoading) return <div className="p-8 text-gray-500">Loading Fleet Data...</div>;

  const inUseCount = drivers.filter(d => d.vehicle_number && d.vehicle_number !== "Unassigned").length;

  return (
    <div className="w-full relative">
      
      {/* ── CUSTOM TOAST NOTIFICATION ── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-top-5 duration-300 ${
          toast.type === "error" 
            ? "bg-red-50 border-red-200 text-red-800 shadow-red-500/10" 
            : "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-500/10"
        }`}>
          {toast.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          )}
          <p className="text-sm font-semibold pr-4">{toast.message}</p>
          <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── CUSTOM CONFIRMATION DIALOG ── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-gray-100 p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {confirmDialog.actionText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">Manage registered drivers, zones, and vehicle assignments.</p>
        </div>
        <button
          onClick={() => router.push("/admin/fleet/map")}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm shadow-emerald-500/20"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          🗺 Live Map View
        </button>
      </div>

      {/* ── PENDING APPROVALS ── */}
      {pendingDrivers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider">
              Pending Driver Approvals ({pendingDrivers.length})
            </h2>
          </div>
          <div className="space-y-3">
            {pendingDrivers.map((driver) => (
              <div
                key={driver.id}
                className="bg-white border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-2 flex-1">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</p>
                    <p className="text-sm font-bold text-slate-800">{driver.full_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="text-xs text-slate-600 font-medium truncate">{driver.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                    <p className="text-xs text-slate-600 font-medium">{driver.phone_number || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle</p>
                    <p className="text-xs font-bold text-emerald-700">{driver.vehicle_number || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">License</p>
                    <p className="text-xs text-slate-600 font-medium">{driver.license_number || "—"}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(driver)}
                    disabled={approving === driver.id}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-500/20"
                  >
                    {approving === driver.id ? (
                      <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Approving…</>
                    ) : (
                      <>✓ Approve</>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteDriver(driver.id, driver.full_name)}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 text-sm font-bold px-5 py-2 rounded-xl transition shadow-sm"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FLEET INVENTORY ── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <span className="text-blue-500">🚐</span> Fleet Inventory
            </h2>
            <div className="flex gap-3 text-xs font-medium text-gray-500">
              <span>Total: {inventory.length}</span>
              <span className="text-blue-600">● In Use: {inUseCount}</span>
              <span className="text-emerald-600">● Available: {inventory.length - inUseCount}</span>
            </div>
          </div>
          <button
            onClick={handleAddVehiclePrompt}
            className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
          >
            + Add Vehicle
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {inventory.map((vehicle) => {
            const isAssigned = drivers.some(d => d.vehicle_number === vehicle);
            return (
              <div
                key={vehicle}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition group ${
                  isAssigned
                    ? "bg-blue-50 border-blue-100 text-blue-600 cursor-default"
                    : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:border-red-200"
                }`}
              >
                <span>{vehicle}</span>
                {!isAssigned && (
                  <button
                    onClick={() => handleDeleteVehiclePrompt(vehicle)}
                    className="ml-1 text-emerald-400 hover:text-red-500 transition-colors"
                    title="Remove Vehicle"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── APPROVED DRIVER TABLE ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
            Approved Drivers ({drivers.length})
          </h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50">
              <th className="p-5 font-medium">Driver Name</th>
              <th className="p-5 font-medium">Assigned Zone</th>
              <th className="p-5 font-medium">Vehicle Reg</th>
              <th className="p-5 font-medium">Route Status</th>
              <th className="p-5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-sm text-gray-400">
                  No approved drivers yet. Approve pending applications above.
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-5 font-bold text-slate-800">
                    {driver.full_name || "Unknown Operator"}
                  </td>
                  <td className="p-5 text-sm text-gray-600">📍 {driver.assigned_zone}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      driver.vehicle_number === "Unassigned"
                      ? "bg-gray-50 text-gray-500 border border-gray-200"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    }`}>
                      {driver.vehicle_number || "Unassigned"}
                    </span>
                  </td>
                  <td className="p-5">
                    {activeRoutes[driver.assigned_zone] ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        In Progress
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-400 border border-gray-100">
                        Idle
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">

                      {/* ── Dispatch / Recall primary button ── */}
                      {activeRoutes[driver.assigned_zone] ? (
                        <button
                          onClick={() => handleRecallRoute(driver)}
                          disabled={dispatching === driver.id}
                          title="Recall active route"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                          {dispatching === driver.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <XCircle className="w-3.5 h-3.5" />}
                          {dispatching === driver.id ? "Recalling…" : "Recall"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDispatchRoute(driver)}
                          disabled={dispatching === driver.id || !driver.vehicle_number || driver.vehicle_number === "Unassigned"}
                          title={!driver.vehicle_number || driver.vehicle_number === "Unassigned" ? "Assign a vehicle first" : "Dispatch a route to this driver"}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 hover:border-emerald-700 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-emerald-500/20"
                        >
                          {dispatching === driver.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Truck className="w-3.5 h-3.5" />}
                          {dispatching === driver.id ? "Dispatching…" : "Dispatch"}
                        </button>
                      )}

                      {/* ── Divider ── */}
                      <div className="w-px h-5 bg-gray-200 mx-0.5" />

                      {/* ── Edit Zone icon button ── */}
                      <button
                        onClick={() => openModal(driver, "zone")}
                        title="Edit assigned zone"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-150"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>

                      {/* ── Edit Vehicle icon button ── */}
                      <button
                        onClick={() => openModal(driver, "vehicle")}
                        title="Edit assigned vehicle"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all duration-150"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* ── Divider ── */}
                      <div className="w-px h-5 bg-gray-200 mx-0.5" />

                      {/* ── Delete icon button ── */}
                      <button
                        onClick={() => handleDeleteDriver(driver.id, driver.full_name)}
                        title="Delete driver account"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-150"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── EDIT ZONE / VEHICLE MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Update {editType === "zone" ? "Assigned Zone" : "Vehicle"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Modifying record for <span className="font-semibold text-gray-800">{activeDriver?.full_name}</span>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select {editType === "zone" ? "Zone" : "Vehicle"}
              </label>
              <select
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              >
                <option value="Unassigned">Unassigned</option>
                {editType === "zone"
                  ? COLOMBO_ZONES.map(zone => <option key={zone} value={zone}>{zone}</option>)
                  : inventory.map(vehicle => <option key={vehicle} value={vehicle}>{vehicle}</option>)
                }
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD VEHICLE MODAL ── */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Add New Municipal Vehicle</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter the registration number for the new truck or fleet unit.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
              <input
                type="text"
                placeholder="e.g., CMC-TRK-016"
                value={newVehicleInput}
                onChange={(e) => setNewVehicleInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 uppercase font-medium"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsAddVehicleOpen(false)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitNewVehicle}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm shadow-blue-500/20"
              >
                Add to Fleet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE VEHICLE MODAL ── */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Remove Vehicle</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to remove <span className="font-bold text-gray-800">{vehicleToDelete}</span> from the municipal fleet? This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setVehicleToDelete(null)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitDeleteVehicle}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition shadow-sm shadow-red-500/20"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
