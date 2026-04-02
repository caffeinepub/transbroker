import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MonthSummary {
    month: bigint;
    expenses: bigint;
    year: bigint;
    income: bigint;
}
export interface Trip {
    status: TripStatus;
    expenses: bigint;
    createdAt: Time;
    createdBy: Principal;
    toCity: string;
    fromCity: string;
    freightAmount: bigint;
    driverName: string;
    vehicleId: bigint;
}
export type Time = bigint;
export type ExpenseCategory = {
    __kind__: "salary";
    salary: null;
} | {
    __kind__: "other";
    other: string;
} | {
    __kind__: "fuel";
    fuel: null;
} | {
    __kind__: "toll";
    toll: null;
} | {
    __kind__: "maintenance";
    maintenance: null;
};
export interface Expense {
    createdAt: Time;
    createdBy: Principal;
    description: string;
    category: ExpenseCategory;
    amount: bigint;
    vehicleId?: bigint;
}
export interface Vehicle {
    status: VehicleStatus;
    model: string;
    vehicleType: VehicleType;
    vehicleNumber: string;
    createdAt: Time;
    createdBy: Principal;
}
export interface DashboardStats {
    pendingDealsCount: bigint;
    monthlySummary: Array<MonthSummary>;
    totalIncome: bigint;
    totalExpenses: bigint;
    activeTripsCount: bigint;
}
export type VehicleType = {
    __kind__: "truck";
    truck: null;
} | {
    __kind__: "other";
    other: string;
} | {
    __kind__: "trailer";
    trailer: null;
} | {
    __kind__: "container";
    container: null;
};
export interface Party {
    city: string;
    name: string;
    createdAt: Time;
    createdBy: Principal;
    partyType: PartyType;
    phone: string;
}
export interface Deal {
    weight: bigint;
    status: DealStatus;
    createdAt: Time;
    createdBy: Principal;
    toCity: string;
    fromCity: string;
    loadDescription: string;
    freightAmount: bigint;
    brokerCommission: bigint;
    partyId: bigint;
}
export interface UserProfile {
    name: string;
}
export enum DealStatus {
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed"
}
export enum PartyType {
    shipper = "shipper",
    both = "both",
    receiver = "receiver"
}
export enum TripStatus {
    completed = "completed",
    ongoing = "ongoing"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VehicleStatus {
    active = "active",
    idle = "idle",
    maintenance = "maintenance"
}
export interface backendInterface {
    addDeal(partyId: bigint, fromCity: string, toCity: string, loadDescription: string, weight: bigint, freightAmount: bigint, brokerCommission: bigint, status: DealStatus): Promise<bigint>;
    addExpense(category: ExpenseCategory, amount: bigint, description: string, vehicleId: bigint | null): Promise<bigint>;
    addParty(name: string, phone: string, city: string, partyType: PartyType): Promise<bigint>;
    addTrip(vehicleId: bigint, driverName: string, fromCity: string, toCity: string, freightAmount: bigint, expenses: bigint, status: TripStatus): Promise<bigint>;
    addVehicle(vehicleNumber: string, model: string, vehicleType: VehicleType, status: VehicleStatus): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listDeals(): Promise<Array<[bigint, Deal]>>;
    listExpenses(): Promise<Array<[bigint, Expense]>>;
    listParties(): Promise<Array<[bigint, Party]>>;
    listTrips(): Promise<Array<[bigint, Trip]>>;
    listVehicles(): Promise<Array<[bigint, Vehicle]>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateDeal(id: bigint, partyId: bigint, fromCity: string, toCity: string, loadDescription: string, weight: bigint, freightAmount: bigint, brokerCommission: bigint, status: DealStatus): Promise<void>;
    updateParty(id: bigint, name: string, phone: string, city: string, partyType: PartyType): Promise<void>;
    updateTrip(id: bigint, vehicleId: bigint, driverName: string, fromCity: string, toCity: string, freightAmount: bigint, expenses: bigint, status: TripStatus): Promise<void>;
    updateVehicle(id: bigint, vehicleNumber: string, model: string, vehicleType: VehicleType, status: VehicleStatus): Promise<void>;
}
