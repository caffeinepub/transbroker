import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DashboardStats,
  Deal,
  Expense,
  ExpenseCategory,
  Party,
  PartyType,
  Trip,
  Vehicle,
  VehicleStatus,
  VehicleType,
} from "../backend.d";
import { DealStatus, TripStatus } from "../backend.d";
import { useActor } from "./useActor";

export type {
  Deal,
  Trip,
  Party,
  Vehicle,
  Expense,
  DashboardStats,
  VehicleType,
  VehicleStatus,
  PartyType,
  ExpenseCategory,
};
export { DealStatus, TripStatus };

// ---------- Dashboard ----------
export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

// ---------- Deals ----------
export function useDeals() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[bigint, Deal]>>({
    queryKey: ["deals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listDeals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddDeal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      partyId: bigint;
      fromCity: string;
      toCity: string;
      loadDescription: string;
      weight: bigint;
      freightAmount: bigint;
      brokerCommission: bigint;
      status: DealStatus;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addDeal(
        args.partyId,
        args.fromCity,
        args.toCity,
        args.loadDescription,
        args.weight,
        args.freightAmount,
        args.brokerCommission,
        args.status,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateDeal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: bigint;
      partyId: bigint;
      fromCity: string;
      toCity: string;
      loadDescription: string;
      weight: bigint;
      freightAmount: bigint;
      brokerCommission: bigint;
      status: DealStatus;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateDeal(
        args.id,
        args.partyId,
        args.fromCity,
        args.toCity,
        args.loadDescription,
        args.weight,
        args.freightAmount,
        args.brokerCommission,
        args.status,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

// ---------- Trips ----------
export function useTrips() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[bigint, Trip]>>({
    queryKey: ["trips"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTrips();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTrip() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      vehicleId: bigint;
      driverName: string;
      fromCity: string;
      toCity: string;
      freightAmount: bigint;
      expenses: bigint;
      status: TripStatus;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addTrip(
        args.vehicleId,
        args.driverName,
        args.fromCity,
        args.toCity,
        args.freightAmount,
        args.expenses,
        args.status,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdateTrip() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: bigint;
      vehicleId: bigint;
      driverName: string;
      fromCity: string;
      toCity: string;
      freightAmount: bigint;
      expenses: bigint;
      status: TripStatus;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateTrip(
        args.id,
        args.vehicleId,
        args.driverName,
        args.fromCity,
        args.toCity,
        args.freightAmount,
        args.expenses,
        args.status,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

// ---------- Parties ----------
export function useParties() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[bigint, Party]>>({
    queryKey: ["parties"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listParties();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddParty() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      name: string;
      phone: string;
      city: string;
      partyType: PartyType;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addParty(args.name, args.phone, args.city, args.partyType);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parties"] }),
  });
}

export function useUpdateParty() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: bigint;
      name: string;
      phone: string;
      city: string;
      partyType: PartyType;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateParty(
        args.id,
        args.name,
        args.phone,
        args.city,
        args.partyType,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parties"] }),
  });
}

// ---------- Vehicles ----------
export function useVehicles() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[bigint, Vehicle]>>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listVehicles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddVehicle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      vehicleNumber: string;
      model: string;
      vehicleType: VehicleType;
      status: VehicleStatus;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addVehicle(
        args.vehicleNumber,
        args.model,
        args.vehicleType,
        args.status,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useUpdateVehicle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: bigint;
      vehicleNumber: string;
      model: string;
      vehicleType: VehicleType;
      status: VehicleStatus;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateVehicle(
        args.id,
        args.vehicleNumber,
        args.model,
        args.vehicleType,
        args.status,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

// ---------- Expenses ----------
export function useExpenses() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[bigint, Expense]>>({
    queryKey: ["expenses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listExpenses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddExpense() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      category: ExpenseCategory;
      amount: bigint;
      description: string;
      vehicleId: bigint | null;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addExpense(
        args.category,
        args.amount,
        args.description,
        args.vehicleId,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}
