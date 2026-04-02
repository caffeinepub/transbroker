import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Handshake,
  Route,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboardStats, useDeals, useVehicles } from "../hooks/useQueries";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmt(n: bigint) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function statusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700 border-green-200";
    case "idle":
      return "bg-sky-100 text-sky-700 border-sky-200";
    case "maintenance":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function dealStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: deals } = useDeals();
  const { data: vehicles } = useVehicles();

  const recentDeals = (deals ?? []).slice(-5).reverse();
  const chartData = (stats?.monthlySummary ?? []).map((m) => ({
    month: MONTH_NAMES[Number(m.month) - 1] ?? `M${m.month}`,
    income: Number(m.income),
    expenses: Number(m.expenses),
  }));

  const kpis = [
    {
      title: "Total Income",
      value: stats ? fmt(stats.totalIncome) : "—",
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
      ocid: "dashboard.income.card",
    },
    {
      title: "Total Expenses",
      value: stats ? fmt(stats.totalExpenses) : "—",
      icon: TrendingDown,
      color: "text-red-500",
      bg: "bg-red-50",
      ocid: "dashboard.expenses.card",
    },
    {
      title: "Active Trips",
      value: stats ? String(Number(stats.activeTripsCount)) : "—",
      icon: Route,
      color: "text-blue-600",
      bg: "bg-blue-50",
      ocid: "dashboard.trips.card",
    },
    {
      title: "Pending Deals",
      value: stats ? String(Number(stats.pendingDealsCount)) : "—",
      icon: Handshake,
      color: "text-amber-600",
      bg: "bg-amber-50",
      ocid: "dashboard.deals.card",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Welcome back to Sangwan Container Service
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="shadow-card" data-ocid={kpi.ocid}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </p>
                  <div
                    className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {kpi.value}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart + Vehicle Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Income vs Expenses Chart */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Income vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div
                className="h-52 flex items-center justify-center text-muted-foreground text-sm"
                data-ocid="dashboard.chart.empty_state"
              >
                No monthly data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.90 0.01 240)"
                  />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="income"
                    fill="#2F6FB5"
                    name="Income"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="#D58A4A"
                    name="Expenses"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Status */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Fleet Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(vehicles ?? []).length === 0 ? (
              <div
                className="text-sm text-muted-foreground py-4 text-center"
                data-ocid="dashboard.fleet.empty_state"
              >
                No vehicles added
              </div>
            ) : (
              (vehicles ?? []).slice(0, 6).map(([id, v], idx) => (
                <div
                  key={String(id)}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  data-ocid={`dashboard.fleet.item.${idx + 1}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {v.vehicleNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">{v.model}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColor(v.status)}`}
                  >
                    {v.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Deals */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Recent Broker Deals
            </CardTitle>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {recentDeals.length === 0 ? (
            <div
              className="text-sm text-muted-foreground py-6 text-center"
              data-ocid="dashboard.deals.empty_state"
            >
              No deals recorded yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                    <th className="text-left pb-2 pr-4">Route</th>
                    <th className="text-left pb-2 pr-4">Load</th>
                    <th className="text-right pb-2 pr-4">Freight</th>
                    <th className="text-right pb-2 pr-4">Commission</th>
                    <th className="text-left pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentDeals.map(([id, deal], idx) => (
                    <tr
                      key={String(id)}
                      data-ocid={`dashboard.deals.item.${idx + 1}`}
                    >
                      <td className="py-2.5 pr-4 font-medium">
                        {deal.fromCity} → {deal.toCity}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground truncate max-w-[120px]">
                        {deal.loadDescription}
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        {fmt(deal.freightAmount)}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-green-600 font-medium">
                        {fmt(deal.brokerCommission)}
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant="outline"
                          className={`text-xs ${dealStatusColor(deal.status)}`}
                        >
                          {deal.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
