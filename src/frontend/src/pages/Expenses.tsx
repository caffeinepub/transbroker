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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Receipt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type ExpenseCategory,
  useAddExpense,
  useExpenses,
  useVehicles,
} from "../hooks/useQueries";

type ExpenseCategoryKey = "fuel" | "maintenance" | "salary" | "toll" | "other";

type FormData = {
  categoryKey: ExpenseCategoryKey;
  categoryOther: string;
  amount: string;
  description: string;
  vehicleId: string;
};

const emptyForm: FormData = {
  categoryKey: "fuel",
  categoryOther: "",
  amount: "",
  description: "",
  vehicleId: "none",
};

function buildExpenseCategory(
  key: ExpenseCategoryKey,
  other: string,
): ExpenseCategory {
  switch (key) {
    case "fuel":
      return { __kind__: "fuel", fuel: null };
    case "maintenance":
      return { __kind__: "maintenance", maintenance: null };
    case "salary":
      return { __kind__: "salary", salary: null };
    case "toll":
      return { __kind__: "toll", toll: null };
    case "other":
      return { __kind__: "other", other: other.trim() || "Other" };
  }
}

function getCategoryLabel(cat: ExpenseCategory): string {
  switch (cat.__kind__) {
    case "fuel":
      return "Fuel";
    case "maintenance":
      return "Maintenance";
    case "salary":
      return "Salary";
    case "toll":
      return "Toll";
    case "other":
      return (cat as { __kind__: "other"; other: string }).other;
    default:
      return "Other";
  }
}

function categoryStyle(cat: ExpenseCategory) {
  switch (cat.__kind__) {
    case "fuel":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "maintenance":
      return "bg-red-100 text-red-700 border-red-200";
    case "salary":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "toll":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "other":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "";
  }
}

function fmt(n: bigint) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

export default function Expenses() {
  const { data: expenses, isLoading } = useExpenses();
  const { data: vehicles } = useVehicles();
  const addExpense = useAddExpense();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );

  const totalExpenses = (expenses ?? []).reduce(
    (acc, [, e]) => acc + Number(e.amount),
    0,
  );

  function openAdd() {
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  }

  function validate() {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (
      !form.amount ||
      Number.isNaN(Number(form.amount)) ||
      Number(form.amount) <= 0
    )
      e.amount = "Valid amount required";
    if (!form.description.trim()) e.description = "Required";
    if (form.categoryKey === "other" && !form.categoryOther.trim())
      e.categoryOther = "Specify category";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    const category = buildExpenseCategory(form.categoryKey, form.categoryOther);
    const vehicleId =
      form.vehicleId && form.vehicleId !== "none"
        ? BigInt(form.vehicleId)
        : null;
    try {
      await addExpense.mutateAsync({
        category,
        amount: BigInt(Math.round(Number(form.amount))),
        description: form.description.trim(),
        vehicleId,
      });
      toast.success("Expense recorded");
      setOpen(false);
    } catch {
      toast.error("Failed to add expense");
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Total:{" "}
            <span className="font-semibold text-foreground">
              ₹{totalExpenses.toLocaleString("en-IN")}
            </span>
          </p>
        </div>
        <Button onClick={openAdd} data-ocid="expenses.add.primary_button">
          <Plus className="w-4 h-4 mr-2" /> Add Expense
        </Button>
      </div>

      <div
        className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
        data-ocid="expenses.table"
      >
        {isLoading ? (
          <div className="p-6 space-y-3" data-ocid="expenses.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (expenses ?? []).length === 0 ? (
          <div
            className="py-16 text-center text-muted-foreground"
            data-ocid="expenses.empty_state"
          >
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No expenses recorded</p>
            <p className="text-sm mt-1">
              Track fuel, maintenance, toll and other costs
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Vehicle</th>
                <th className="text-right px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(expenses ?? []).map(([id, expense], idx) => {
                const vehicle = expense.vehicleId
                  ? (vehicles ?? []).find(([vid]) => vid === expense.vehicleId)
                  : null;
                return (
                  <tr
                    key={String(id)}
                    className="hover:bg-muted/20 transition-colors"
                    data-ocid={`expenses.item.${idx + 1}`}
                  >
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${categoryStyle(expense.category)}`}
                      >
                        {getCategoryLabel(expense.category)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {expense.description}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {vehicle
                        ? vehicle[1].vehicleNumber
                        : expense.vehicleId
                          ? `#${expense.vehicleId}`
                          : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-red-500">
                      {fmt(expense.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" data-ocid="expenses.dialog">
          <DialogHeader>
            <DialogTitle>Record Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Category</Label>
              <Select
                value={form.categoryKey}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    categoryKey: v as ExpenseCategoryKey,
                  }))
                }
              >
                <SelectTrigger
                  className="mt-1"
                  data-ocid="expenses.category.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="toll">Toll</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.categoryKey === "other" && (
              <div>
                <Label>Specify Category</Label>
                <Input
                  className="mt-1"
                  value={form.categoryOther}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, categoryOther: e.target.value }))
                  }
                  placeholder="e.g. Insurance"
                  data-ocid="expenses.category_other.input"
                />
                {errors.categoryOther && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.categoryOther}
                  </p>
                )}
              </div>
            )}
            <div>
              <Label>Amount (₹)</Label>
              <Input
                className="mt-1"
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
                placeholder="2500"
                data-ocid="expenses.amount.input"
              />
              {errors.amount && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="expenses.amount.error_state"
                >
                  {errors.amount}
                </p>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="e.g. Diesel fill - MH12AB1234"
                rows={2}
                data-ocid="expenses.description.textarea"
              />
              {errors.description && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="expenses.description.error_state"
                >
                  {errors.description}
                </p>
              )}
            </div>
            <div>
              <Label>Vehicle (optional)</Label>
              <Select
                value={form.vehicleId}
                onValueChange={(v) => setForm((p) => ({ ...p, vehicleId: v }))}
              >
                <SelectTrigger
                  className="mt-1"
                  data-ocid="expenses.vehicle.select"
                >
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No vehicle</SelectItem>
                  {(vehicles ?? []).map(([vid, vehicle]) => (
                    <SelectItem key={String(vid)} value={String(vid)}>
                      {vehicle.vehicleNumber} — {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="expenses.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={addExpense.isPending}
              data-ocid="expenses.submit.button"
            >
              {addExpense.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Record Expense"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
