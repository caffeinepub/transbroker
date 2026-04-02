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
import { Loader2, Pencil, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PartyType } from "../backend.d";
import {
  type Party,
  useAddParty,
  useParties,
  useUpdateParty,
} from "../hooks/useQueries";

type FormData = {
  name: string;
  phone: string;
  city: string;
  partyType: PartyType;
};

const emptyForm: FormData = {
  name: "",
  phone: "",
  city: "",
  partyType: PartyType.shipper,
};

function partyTypeStyle(type: string) {
  switch (type) {
    case "shipper":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "receiver":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "both":
      return "bg-teal-100 text-teal-700 border-teal-200";
    default:
      return "";
  }
}

export default function Parties() {
  const { data: parties, isLoading } = useParties();
  const addParty = useAddParty();
  const updateParty = useUpdateParty();

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

  function openEdit(id: bigint, party: Party) {
    setEditId(id);
    setForm({
      name: party.name,
      phone: party.phone,
      city: party.city,
      partyType: party.partyType as PartyType,
    });
    setErrors({});
    setOpen(true);
  }

  function validate() {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.city.trim()) e.city = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      partyType: form.partyType,
    };
    try {
      if (editId !== null) {
        await updateParty.mutateAsync({ id: editId, ...payload });
        toast.success("Party updated");
      } else {
        await addParty.mutateAsync(payload);
        toast.success("Party added");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save party");
    }
  }

  const isPending = addParty.isPending || updateParty.isPending;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Parties / Clients
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage shippers, receivers, and clients
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="parties.add.primary_button">
          <Plus className="w-4 h-4 mr-2" /> Add Party
        </Button>
      </div>

      <div
        className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
        data-ocid="parties.table"
      >
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="parties.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (parties ?? []).length === 0 ? (
          <div
            className="py-16 text-center text-muted-foreground"
            data-ocid="parties.empty_state"
          >
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No parties added</p>
            <p className="text-sm mt-1">
              Add shippers and receivers to manage deals
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">City</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(parties ?? []).map(([id, party], idx) => (
                <tr
                  key={String(id)}
                  className="hover:bg-muted/20 transition-colors"
                  data-ocid={`parties.item.${idx + 1}`}
                >
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-medium">{party.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {party.phone}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {party.city}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${partyTypeStyle(party.partyType)}`}
                    >
                      {party.partyType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(id, party)}
                      data-ocid={`parties.edit_button.${idx + 1}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" data-ocid="parties.dialog">
          <DialogHeader>
            <DialogTitle>
              {editId !== null ? "Edit Party" : "New Party"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Sharma Traders"
                data-ocid="parties.name.input"
              />
              {errors.name && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="parties.name.error_state"
                >
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                className="mt-1"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="9876543210"
                data-ocid="parties.phone.input"
              />
              {errors.phone && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="parties.phone.error_state"
                >
                  {errors.phone}
                </p>
              )}
            </div>
            <div>
              <Label>City</Label>
              <Input
                className="mt-1"
                value={form.city}
                onChange={(e) =>
                  setForm((p) => ({ ...p, city: e.target.value }))
                }
                placeholder="Mumbai"
                data-ocid="parties.city.input"
              />
              {errors.city && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="parties.city.error_state"
                >
                  {errors.city}
                </p>
              )}
            </div>
            <div>
              <Label>Party Type</Label>
              <Select
                value={form.partyType}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, partyType: v as PartyType }))
                }
              >
                <SelectTrigger className="mt-1" data-ocid="parties.type.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PartyType.shipper}>Shipper</SelectItem>
                  <SelectItem value={PartyType.receiver}>Receiver</SelectItem>
                  <SelectItem value={PartyType.both}>Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="parties.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              data-ocid="parties.submit.button"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : editId !== null ? (
                "Update"
              ) : (
                "Add Party"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
