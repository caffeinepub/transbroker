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
import { Loader2, Pencil, Plus, Route } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Trip,
  TripStatus,
  useAddTrip,
  useTrips,
  useUpdateTrip,
  useVehicles,
} from "../hooks/useQueries";

type FormData = {
  vehicleId: string;
  driverName: string;
  fromCity: string;
  toCity: string;
  freightAmount: string;
  expenses: string;
  status: TripStatus;
};

const emptyForm: FormData = {
  vehicleId: "",
  driverName: "",
  fromCity: "",
  toCity: "",
  freightAmount: "",
  expenses: "",
  status: TripStatus.ongoing,
};

function tripStatusStyle(status: string) {
  switch (status) {
    case "ongoing":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "";
  }
}

function fmt(n: bigint) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

export default function Trips() {
  const { data: trips, isLoading } = useTrips();
  const { data: vehicles } = useVehicles();
  const addTrip = useAddTrip();
  const updateTrip = useUpdateTrip();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<bigint | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  }

  function openEdit(id: bigint, trip: Trip) {
    setEditId(id);
    setForm({
      vehicleId: String(trip.vehicleId),
      driverName: trip.driverName,
      fromCity: trip.fromCity,
      toCity: trip.toCity,
      freightAmount: String(trip.freightAmount),
      expenses: String(trip.expenses),
      status: trip.status as TripStatus,
    });
    setErrors({});
    setOpen(true);
  }

  function validate() {
    const e: Partial<FormData> = {};
    if (!form.vehicleId) e.vehicleId = "Select a vehicle";
    if (!form.driverName.trim()) e.driverName = "Required";
    if (!form.fromCity.trim()) e.fromCity = "Required";
    if (!form.toCity.trim()) e.toCity = "Required";
    if (!form.freightAmount || Number.isNaN(Number(form.freightAmount)))
      e.freightAmount = "Valid amount required";
    if (!form.expenses || Number.isNaN(Number(form.expenses)))
      e.expenses = "Valid amount required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    const payload = {
      vehicleId: BigInt(form.vehicleId),
      driverName: form.driverName.trim(),
      fromCity: form.fromCity.trim(),
      toCity: form.toCity.trim(),
      freightAmount: BigInt(Math.round(Number(form.freightAmount))),
      expenses: BigInt(Math.round(Number(form.expenses))),
      status: form.status,
    };
    try {
      if (editId !== null) {
        await updateTrip.mutateAsync({ id: editId, ...payload });
        toast.success("Trip updated");
      } else {
        await addTrip.mutateAsync(payload);
        toast.success("Trip added");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save trip");
    }
  }

  const isPending = addTrip.isPending || updateTrip.isPending;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trips</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track all vehicle trips
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="trips.add.primary_button">
          <Plus className="w-4 h-4 mr-2" /> Add Trip
        </Button>
      </div>

      <div
        className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
        data-ocid="trips.table"
      >
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="trips.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (trips ?? []).length === 0 ? (
          <div
            className="py-16 text-center text-muted-foreground"
            data-ocid="trips.empty_state"
          >
            <Route className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No trips recorded</p>
            <p className="text-sm mt-1">Start tracking your vehicle trips</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <th className="text-left px-4 py-3">Vehicle</th>
                <th className="text-left px-4 py-3">Driver</th>
                <th className="text-left px-4 py-3">Route</th>
                <th className="text-right px-4 py-3">Freight</th>
                <th className="text-right px-4 py-3">Trip Expenses</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(trips ?? []).map(([id, trip], idx) => {
                const vehicle = (vehicles ?? []).find(
                  ([vid]) => vid === trip.vehicleId,
                );
                return (
                  <tr
                    key={String(id)}
                    className="hover:bg-muted/20 transition-colors"
                    data-ocid={`trips.item.${idx + 1}`}
                  >
                    <td className="px-4 py-3 font-medium">
                      {vehicle
                        ? vehicle[1].vehicleNumber
                        : `#${trip.vehicleId}`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {trip.driverName}
                    </td>
                    <td className="px-4 py-3">
                      {trip.fromCity} → {trip.toCity}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {fmt(trip.freightAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500">
                      {fmt(trip.expenses)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${tripStatusStyle(trip.status)}`}
                      >
                        {trip.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(id, trip)}
                        data-ocid={`trips.edit_button.${idx + 1}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" data-ocid="trips.dialog">
          <DialogHeader>
            <DialogTitle>
              {editId !== null ? "Edit Trip" : "New Trip"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Vehicle</Label>
              <Select
                value={form.vehicleId}
                onValueChange={(v) => setForm((p) => ({ ...p, vehicleId: v }))}
              >
                <SelectTrigger
                  className="mt-1"
                  data-ocid="trips.vehicle.select"
                >
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {(vehicles ?? []).map(([vid, vehicle]) => (
                    <SelectItem key={String(vid)} value={String(vid)}>
                      {vehicle.vehicleNumber} — {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleId && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="trips.vehicle.error_state"
                >
                  {errors.vehicleId}
                </p>
              )}
            </div>
            <div>
              <Label>Driver Name</Label>
              <Input
                className="mt-1"
                value={form.driverName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, driverName: e.target.value }))
                }
                placeholder="Ramesh Kumar"
                data-ocid="trips.driver.input"
              />
              {errors.driverName && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="trips.driver.error_state"
                >
                  {errors.driverName}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From City</Label>
                <Input
                  className="mt-1"
                  value={form.fromCity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fromCity: e.target.value }))
                  }
                  placeholder="Pune"
                  data-ocid="trips.from_city.input"
                />
                {errors.fromCity && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.fromCity}
                  </p>
                )}
              </div>
              <div>
                <Label>To City</Label>
                <Input
                  className="mt-1"
                  value={form.toCity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, toCity: e.target.value }))
                  }
                  placeholder="Nagpur"
                  data-ocid="trips.to_city.input"
                />
                {errors.toCity && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.toCity}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Freight Amount (₹)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={form.freightAmount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, freightAmount: e.target.value }))
                  }
                  placeholder="35000"
                  data-ocid="trips.freight.input"
                />
                {errors.freightAmount && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.freightAmount}
                  </p>
                )}
              </div>
              <div>
                <Label>Trip Expenses (₹)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={form.expenses}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, expenses: e.target.value }))
                  }
                  placeholder="4500"
                  data-ocid="trips.expenses.input"
                />
                {errors.expenses && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.expenses}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as TripStatus }))
                }
              >
                <SelectTrigger className="mt-1" data-ocid="trips.status.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TripStatus.ongoing}>Ongoing</SelectItem>
                  <SelectItem value={TripStatus.completed}>
                    Completed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="trips.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              data-ocid="trips.submit.button"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : editId !== null ? (
                "Update"
              ) : (
                "Add Trip"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
