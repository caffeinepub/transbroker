import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Pencil, Plus, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { VehicleStatus as VehicleStatusEnum } from "../backend.d";
import {
  type Vehicle,
  type VehicleStatus,
  type VehicleType,
  useAddVehicle,
  useUpdateVehicle,
  useVehicles,
} from "../hooks/useQueries";

type VehicleTypeKey = "truck" | "trailer" | "container" | "other";

type FormData = {
  vehicleNumber: string;
  model: string;
  vehicleTypeKey: VehicleTypeKey;
  vehicleTypeOther: string;
  status: VehicleStatus;
};

const emptyForm: FormData = {
  vehicleNumber: "",
  model: "",
  vehicleTypeKey: "truck",
  vehicleTypeOther: "",
  status: VehicleStatusEnum.active,
};

function getVehicleTypeLabel(vt: VehicleType): string {
  switch (vt.__kind__) {
    case "truck":
      return "Truck";
    case "trailer":
      return "Trailer";
    case "container":
      return "Container";
    case "other":
      return (vt as { __kind__: "other"; other: string }).other;
    default:
      return "Unknown";
  }
}

function buildVehicleType(key: VehicleTypeKey, other: string): VehicleType {
  switch (key) {
    case "truck":
      return { __kind__: "truck", truck: null };
    case "trailer":
      return { __kind__: "trailer", trailer: null };
    case "container":
      return { __kind__: "container", container: null };
    case "other":
      return { __kind__: "other", other: other.trim() || "Other" };
  }
}

function vehicleTypeFromExisting(vt: VehicleType): {
  key: VehicleTypeKey;
  other: string;
} {
  switch (vt.__kind__) {
    case "truck":
      return { key: "truck", other: "" };
    case "trailer":
      return { key: "trailer", other: "" };
    case "container":
      return { key: "container", other: "" };
    case "other":
      return {
        key: "other",
        other: (vt as { __kind__: "other"; other: string }).other,
      };
    default:
      return { key: "truck", other: "" };
  }
}

function statusStyle(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700 border-green-200";
    case "idle":
      return "bg-sky-100 text-sky-700 border-sky-200";
    case "maintenance":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "";
  }
}

export default function Vehicles() {
  const { data: vehicles, isLoading } = useVehicles();
  const addVehicle = useAddVehicle();
  const updateVehicle = useUpdateVehicle();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<bigint | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  }

  function openEdit(id: bigint, vehicle: Vehicle) {
    setEditId(id);
    const { key, other } = vehicleTypeFromExisting(vehicle.vehicleType);
    setForm({
      vehicleNumber: vehicle.vehicleNumber,
      model: vehicle.model,
      vehicleTypeKey: key,
      vehicleTypeOther: other,
      status: vehicle.status as VehicleStatus,
    });
    setErrors({});
    setOpen(true);
  }

  function validate() {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.vehicleNumber.trim()) e.vehicleNumber = "Required";
    if (!form.model.trim()) e.model = "Required";
    if (form.vehicleTypeKey === "other" && !form.vehicleTypeOther.trim())
      e.vehicleTypeOther = "Specify type";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    const vehicleType = buildVehicleType(
      form.vehicleTypeKey,
      form.vehicleTypeOther,
    );
    try {
      if (editId !== null) {
        await updateVehicle.mutateAsync({
          id: editId,
          vehicleNumber: form.vehicleNumber.trim(),
          model: form.model.trim(),
          vehicleType,
          status: form.status,
        });
        toast.success("Vehicle updated");
      } else {
        await addVehicle.mutateAsync({
          vehicleNumber: form.vehicleNumber.trim(),
          model: form.model.trim(),
          vehicleType,
          status: form.status,
        });
        toast.success("Vehicle added");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save vehicle");
    }
  }

  const isPending = addVehicle.isPending || updateVehicle.isPending;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Fleet / Vehicles
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your owned vehicles
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="vehicles.add.primary_button">
          <Plus className="w-4 h-4 mr-2" /> Add Vehicle
        </Button>
      </div>

      {/* Vehicle cards grid */}
      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="vehicles.loading_state"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : (vehicles ?? []).length === 0 ? (
        <div
          className="bg-card rounded-xl border border-border shadow-card py-16 text-center text-muted-foreground"
          data-ocid="vehicles.empty_state"
        >
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No vehicles added</p>
          <p className="text-sm mt-1">
            Add your trucks and trailers to start tracking trips
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(vehicles ?? []).map(([id, vehicle], idx) => (
            <div
              key={String(id)}
              className="bg-card rounded-xl border border-border shadow-card p-5 hover:shadow-card-hover transition-shadow"
              data-ocid={`vehicles.item.${idx + 1}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: "oklch(0.92 0.025 243)" }}
                >
                  <Truck
                    className="w-5 h-5"
                    style={{ color: "oklch(0.28 0.07 243)" }}
                  />
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusStyle(vehicle.status)}`}
                >
                  {vehicle.status}
                </Badge>
              </div>
              <p className="font-bold text-lg text-foreground">
                {vehicle.vehicleNumber}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {vehicle.model}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getVehicleTypeLabel(vehicle.vehicleType)}
              </p>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(id, vehicle)}
                  data-ocid={`vehicles.edit_button.${idx + 1}`}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" data-ocid="vehicles.dialog">
          <DialogHeader>
            <DialogTitle>
              {editId !== null ? "Edit Vehicle" : "Add Vehicle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Vehicle Number</Label>
              <Input
                className="mt-1"
                value={form.vehicleNumber}
                onChange={(e) =>
                  setForm((p) => ({ ...p, vehicleNumber: e.target.value }))
                }
                placeholder="MH 12 AB 1234"
                data-ocid="vehicles.number.input"
              />
              {errors.vehicleNumber && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="vehicles.number.error_state"
                >
                  {errors.vehicleNumber}
                </p>
              )}
            </div>
            <div>
              <Label>Model</Label>
              <Input
                className="mt-1"
                value={form.model}
                onChange={(e) =>
                  setForm((p) => ({ ...p, model: e.target.value }))
                }
                placeholder="Tata 407 / Ashok Leyland 1616"
                data-ocid="vehicles.model.input"
              />
              {errors.model && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="vehicles.model.error_state"
                >
                  {errors.model}
                </p>
              )}
            </div>
            <div>
              <Label>Vehicle Type</Label>
              <Select
                value={form.vehicleTypeKey}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    vehicleTypeKey: v as VehicleTypeKey,
                  }))
                }
              >
                <SelectTrigger
                  className="mt-1"
                  data-ocid="vehicles.type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="trailer">Trailer</SelectItem>
                  <SelectItem value="container">Container</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.vehicleTypeKey === "other" && (
              <div>
                <Label>Specify Type</Label>
                <Input
                  className="mt-1"
                  value={form.vehicleTypeOther}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, vehicleTypeOther: e.target.value }))
                  }
                  placeholder="e.g. Tanker"
                  data-ocid="vehicles.type_other.input"
                />
                {errors.vehicleTypeOther && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.vehicleTypeOther}
                  </p>
                )}
              </div>
            )}
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as VehicleStatus }))
                }
              >
                <SelectTrigger
                  className="mt-1"
                  data-ocid="vehicles.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VehicleStatusEnum.active}>
                    Active
                  </SelectItem>
                  <SelectItem value={VehicleStatusEnum.idle}>Idle</SelectItem>
                  <SelectItem value={VehicleStatusEnum.maintenance}>
                    Under Maintenance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="vehicles.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              data-ocid="vehicles.submit.button"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : editId !== null ? (
                "Update"
              ) : (
                "Add Vehicle"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
