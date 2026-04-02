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
import { Loader2, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Deal,
  DealStatus,
  useAddDeal,
  useDeals,
  useParties,
  useUpdateDeal,
} from "../hooks/useQueries";

type FormData = {
  partyId: string;
  fromCity: string;
  toCity: string;
  loadDescription: string;
  weight: string;
  freightAmount: string;
  brokerCommission: string;
  status: DealStatus;
};

const emptyForm: FormData = {
  partyId: "",
  fromCity: "",
  toCity: "",
  loadDescription: "",
  weight: "",
  freightAmount: "",
  brokerCommission: "",
  status: DealStatus.pending,
};

function dealStatusStyle(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "";
  }
}

function fmt(n: bigint) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function HandshakeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <title>Handshake</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.82m5.84-2.56a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.82m2.56-5.84a14.98 14.98 0 0 0-12.12 6.16A14.98 14.98 0 0 0 8.41 9.63"
      />
    </svg>
  );
}

export default function Deals() {
  const { data: deals, isLoading } = useDeals();
  const { data: parties } = useParties();
  const addDeal = useAddDeal();
  const updateDeal = useUpdateDeal();

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

  function openEdit(id: bigint, deal: Deal) {
    setEditId(id);
    setForm({
      partyId: String(deal.partyId),
      fromCity: deal.fromCity,
      toCity: deal.toCity,
      loadDescription: deal.loadDescription,
      weight: String(deal.weight),
      freightAmount: String(deal.freightAmount),
      brokerCommission: String(deal.brokerCommission),
      status: deal.status as DealStatus,
    });
    setErrors({});
    setOpen(true);
  }

  function validate() {
    const e: Partial<FormData> = {};
    if (!form.partyId) e.partyId = "Select a party";
    if (!form.fromCity.trim()) e.fromCity = "Required";
    if (!form.toCity.trim()) e.toCity = "Required";
    if (!form.loadDescription.trim()) e.loadDescription = "Required";
    if (!form.weight || Number.isNaN(Number(form.weight)))
      e.weight = "Valid number required";
    if (!form.freightAmount || Number.isNaN(Number(form.freightAmount)))
      e.freightAmount = "Valid amount required";
    if (!form.brokerCommission || Number.isNaN(Number(form.brokerCommission)))
      e.brokerCommission = "Valid amount required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    const payload = {
      partyId: BigInt(form.partyId),
      fromCity: form.fromCity.trim(),
      toCity: form.toCity.trim(),
      loadDescription: form.loadDescription.trim(),
      weight: BigInt(Math.round(Number(form.weight))),
      freightAmount: BigInt(Math.round(Number(form.freightAmount))),
      brokerCommission: BigInt(Math.round(Number(form.brokerCommission))),
      status: form.status,
    };
    try {
      if (editId !== null) {
        await updateDeal.mutateAsync({ id: editId, ...payload });
        toast.success("Deal updated");
      } else {
        await addDeal.mutateAsync(payload);
        toast.success("Deal added");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save deal");
    }
  }

  const isPending = addDeal.isPending || updateDeal.isPending;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Broker Deals</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage all broker transactions
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="deals.add.primary_button">
          <Plus className="w-4 h-4 mr-2" /> Add Deal
        </Button>
      </div>

      <div
        className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
        data-ocid="deals.table"
      >
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="deals.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (deals ?? []).length === 0 ? (
          <div
            className="py-16 text-center text-muted-foreground"
            data-ocid="deals.empty_state"
          >
            <HandshakeIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No deals yet</p>
            <p className="text-sm mt-1">
              Add your first broker deal to get started
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <th className="text-left px-4 py-3">Route</th>
                <th className="text-left px-4 py-3">Party</th>
                <th className="text-left px-4 py-3">Load</th>
                <th className="text-right px-4 py-3">Freight</th>
                <th className="text-right px-4 py-3">Commission</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(deals ?? []).map(([id, deal], idx) => {
                const party = (parties ?? []).find(
                  ([pid]) => pid === deal.partyId,
                );
                return (
                  <tr
                    key={String(id)}
                    className="hover:bg-muted/20 transition-colors"
                    data-ocid={`deals.item.${idx + 1}`}
                  >
                    <td className="px-4 py-3 font-medium">
                      {deal.fromCity} → {deal.toCity}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {party ? party[1].name : `#${deal.partyId}`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate">
                      {deal.loadDescription}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {fmt(deal.freightAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                      {fmt(deal.brokerCommission)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${dealStatusStyle(deal.status)}`}
                      >
                        {deal.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(id, deal)}
                        data-ocid={`deals.edit_button.${idx + 1}`}
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
        <DialogContent className="max-w-lg" data-ocid="deals.dialog">
          <DialogHeader>
            <DialogTitle>
              {editId !== null ? "Edit Deal" : "New Broker Deal"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Party</Label>
              <Select
                value={form.partyId}
                onValueChange={(v) => setForm((p) => ({ ...p, partyId: v }))}
              >
                <SelectTrigger className="mt-1" data-ocid="deals.party.select">
                  <SelectValue placeholder="Select party" />
                </SelectTrigger>
                <SelectContent>
                  {(parties ?? []).map(([pid, party]) => (
                    <SelectItem key={String(pid)} value={String(pid)}>
                      {party.name} ({party.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.partyId && (
                <p className="text-xs text-destructive mt-1">
                  {errors.partyId}
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
                  placeholder="Mumbai"
                  data-ocid="deals.from_city.input"
                />
                {errors.fromCity && (
                  <p
                    className="text-xs text-destructive mt-1"
                    data-ocid="deals.from_city.error_state"
                  >
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
                  placeholder="Delhi"
                  data-ocid="deals.to_city.input"
                />
                {errors.toCity && (
                  <p
                    className="text-xs text-destructive mt-1"
                    data-ocid="deals.to_city.error_state"
                  >
                    {errors.toCity}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label>Load Description</Label>
              <Input
                className="mt-1"
                value={form.loadDescription}
                onChange={(e) =>
                  setForm((p) => ({ ...p, loadDescription: e.target.value }))
                }
                placeholder="e.g. Cotton bales, 200 bags"
                data-ocid="deals.load.input"
              />
              {errors.loadDescription && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="deals.load.error_state"
                >
                  {errors.loadDescription}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Weight (kg)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={form.weight}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, weight: e.target.value }))
                  }
                  placeholder="5000"
                  data-ocid="deals.weight.input"
                />
                {errors.weight && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.weight}
                  </p>
                )}
              </div>
              <div>
                <Label>Freight (₹)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={form.freightAmount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, freightAmount: e.target.value }))
                  }
                  placeholder="45000"
                  data-ocid="deals.freight.input"
                />
                {errors.freightAmount && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.freightAmount}
                  </p>
                )}
              </div>
              <div>
                <Label>Commission (₹)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={form.brokerCommission}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, brokerCommission: e.target.value }))
                  }
                  placeholder="2500"
                  data-ocid="deals.commission.input"
                />
                {errors.brokerCommission && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.brokerCommission}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as DealStatus }))
                }
              >
                <SelectTrigger className="mt-1" data-ocid="deals.status.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DealStatus.pending}>Pending</SelectItem>
                  <SelectItem value={DealStatus.completed}>
                    Completed
                  </SelectItem>
                  <SelectItem value={DealStatus.cancelled}>
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="deals.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              data-ocid="deals.submit.button"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : editId !== null ? (
                "Update"
              ) : (
                "Add Deal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
