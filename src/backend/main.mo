import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import List "mo:core/List";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profiles
  type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can get other user profiles");
    };
    userProfiles.get(user);
  };

  public type PartyType = {
    #shipper;
    #receiver;
    #both;
  };

  public type VehicleType = {
    #truck;
    #container;
    #trailer;
    #other : Text;
  };

  public type VehicleStatus = {
    #active;
    #maintenance;
    #idle;
  };

  public type DealStatus = {
    #pending;
    #completed;
    #cancelled;
  };

  public type TripStatus = {
    #ongoing;
    #completed;
  };

  public type ExpenseCategory = {
    #fuel;
    #maintenance;
    #salary;
    #toll;
    #other : Text;
  };

  public type Party = {
    name : Text;
    phone : Text;
    city : Text;
    partyType : PartyType;
    createdBy : Principal;
    createdAt : Time.Time;
  };

  public type Vehicle = {
    vehicleNumber : Text;
    model : Text;
    vehicleType : VehicleType;
    status : VehicleStatus;
    createdBy : Principal;
    createdAt : Time.Time;
  };

  public type Deal = {
    partyId : Nat;
    fromCity : Text;
    toCity : Text;
    loadDescription : Text;
    weight : Nat;
    freightAmount : Nat;
    brokerCommission : Nat;
    status : DealStatus;
    createdBy : Principal;
    createdAt : Time.Time;
  };

  public type Trip = {
    vehicleId : Nat;
    driverName : Text;
    fromCity : Text;
    toCity : Text;
    freightAmount : Nat;
    expenses : Nat;
    status : TripStatus;
    createdBy : Principal;
    createdAt : Time.Time;
  };

  public type Expense = {
    category : ExpenseCategory;
    amount : Nat;
    description : Text;
    vehicleId : ?Nat;
    createdBy : Principal;
    createdAt : Time.Time;
  };

  public type DashboardStats = {
    totalIncome : Nat;
    totalExpenses : Nat;
    activeTripsCount : Nat;
    pendingDealsCount : Nat;
    monthlySummary : [MonthSummary];
  };

  public type MonthSummary = {
    month : Nat;
    year : Nat;
    income : Nat;
    expenses : Nat;
  };

  type ListId = Nat;
  type ListEntry<Entries> = {
    nextId : ListId;
    entries : Map.Map<ListId, Entries>;
  };

  module ListEntry {
    public func add<Entries>(list : ListEntry<Entries>, entry : Entries) : (ListId, ListEntry<Entries>) {
      let id = list.nextId;
      list.entries.add(id, entry);
      let newList = {
        list with
        nextId = id + 1;
      };
      (id, newList);
    };

    public func getAll<Entries>(list : ListEntry<Entries>) : [(ListId, Entries)] {
      list.entries.toArray();
    };

    public func get<Entries>(list : ListEntry<Entries>, id : ListId) : ?Entries {
      list.entries.get(id);
    };

    public func updateEntry<Entries>(list : ListEntry<Entries>, id : ListId, entry : Entries) : ListEntry<Entries> {
      if (not list.entries.containsKey(id)) {
        Runtime.trap("Entry does not exist");
      };
      list.entries.add(id, entry);
      list;
    };

    public func filterByUser<Entries>(list : ListEntry<Entries>, user : Principal, getCreatedBy : Entries -> Principal) : [(ListId, Entries)] {
      list.entries.filter(
        func(_, entry) { getCreatedBy(entry) == user }
      ).toArray();
    };

    public func empty<Entries>() : ListEntry<Entries> {
      { nextId = 0; entries = Map.empty<ListId, Entries>() };
    };
  };

  type UserData = {
    parties : ListEntry<Party>;
    vehicles : ListEntry<Vehicle>;
    deals : ListEntry<Deal>;
    trips : ListEntry<Trip>;
    expenses : ListEntry<Expense>;
  };

  module UserData {
    public func empty() : UserData {
      {
        parties = ListEntry.empty<Party>();
        vehicles = ListEntry.empty<Vehicle>();
        deals = ListEntry.empty<Deal>();
        trips = ListEntry.empty<Trip>();
        expenses = ListEntry.empty<Expense>();
      };
    };
  };

  let userData = Map.empty<Principal, UserData>();

  func getUserData(caller : Principal) : UserData {
    switch (userData.get(caller)) {
      case (?data) { data };
      case null {
        let newData = UserData.empty();
        userData.add(caller, newData);
        newData;
      };
    };
  };

  func setUserData(caller : Principal, data : UserData) {
    userData.add(caller, data);
  };

  // Party Management
  public shared ({ caller }) func addParty(name : Text, phone : Text, city : Text, partyType : PartyType) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add parties");
    };
    let data = getUserData(caller);
    let party : Party = {
      name;
      phone;
      city;
      partyType;
      createdBy = caller;
      createdAt = Time.now();
    };
    let (id, newParties) = ListEntry.add(data.parties, party);
    setUserData(caller, { data with parties = newParties });
    id;
  };

  public shared ({ caller }) func updateParty(id : Nat, name : Text, phone : Text, city : Text, partyType : PartyType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update parties");
    };
    let data = getUserData(caller);
    switch (data.parties.entries.get(id)) {
      case (?existingParty) {
        let updatedParty : Party = {
          name;
          phone;
          city;
          partyType;
          createdBy = existingParty.createdBy;
          createdAt = existingParty.createdAt;
        };
        let newParties = ListEntry.updateEntry(data.parties, id, updatedParty);
        setUserData(caller, { data with parties = newParties });
      };
      case null {
        Runtime.trap("Party not found");
      };
    };
  };

  public query ({ caller }) func listParties() : async [(Nat, Party)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list parties");
    };
    let data = getUserData(caller);
    ListEntry.getAll(data.parties);
  };

  // Vehicle Management
  public shared ({ caller }) func addVehicle(vehicleNumber : Text, model : Text, vehicleType : VehicleType, status : VehicleStatus) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add vehicles");
    };
    let data = getUserData(caller);
    let vehicle : Vehicle = {
      vehicleNumber;
      model;
      vehicleType;
      status;
      createdBy = caller;
      createdAt = Time.now();
    };
    let (id, newVehicles) = ListEntry.add(data.vehicles, vehicle);
    setUserData(caller, { data with vehicles = newVehicles });
    id;
  };

  public shared ({ caller }) func updateVehicle(id : Nat, vehicleNumber : Text, model : Text, vehicleType : VehicleType, status : VehicleStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update vehicles");
    };
    let data = getUserData(caller);
    switch (data.vehicles.entries.get(id)) {
      case (?existingVehicle) {
        let updatedVehicle : Vehicle = {
          vehicleNumber;
          model;
          vehicleType;
          status;
          createdBy = existingVehicle.createdBy;
          createdAt = existingVehicle.createdAt;
        };
        let newVehicles = ListEntry.updateEntry(data.vehicles, id, updatedVehicle);
        setUserData(caller, { data with vehicles = newVehicles });
      };
      case null {
        Runtime.trap("Vehicle not found");
      };
    };
  };

  public query ({ caller }) func listVehicles() : async [(Nat, Vehicle)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list vehicles");
    };
    let data = getUserData(caller);
    ListEntry.getAll(data.vehicles);
  };

  // Broker Deal Management
  public shared ({ caller }) func addDeal(partyId : Nat, fromCity : Text, toCity : Text, loadDescription : Text, weight : Nat, freightAmount : Nat, brokerCommission : Nat, status : DealStatus) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add deals");
    };
    let data = getUserData(caller);
    let deal : Deal = {
      partyId;
      fromCity;
      toCity;
      loadDescription;
      weight;
      freightAmount;
      brokerCommission;
      status;
      createdBy = caller;
      createdAt = Time.now();
    };
    let (id, newDeals) = ListEntry.add(data.deals, deal);
    setUserData(caller, { data with deals = newDeals });
    id;
  };

  public shared ({ caller }) func updateDeal(id : Nat, partyId : Nat, fromCity : Text, toCity : Text, loadDescription : Text, weight : Nat, freightAmount : Nat, brokerCommission : Nat, status : DealStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update deals");
    };
    let data = getUserData(caller);
    switch (data.deals.entries.get(id)) {
      case (?existingDeal) {
        let updatedDeal : Deal = {
          partyId;
          fromCity;
          toCity;
          loadDescription;
          weight;
          freightAmount;
          brokerCommission;
          status;
          createdBy = existingDeal.createdBy;
          createdAt = existingDeal.createdAt;
        };
        let newDeals = ListEntry.updateEntry(data.deals, id, updatedDeal);
        setUserData(caller, { data with deals = newDeals });
      };
      case null {
        Runtime.trap("Deal not found");
      };
    };
  };

  public query ({ caller }) func listDeals() : async [(Nat, Deal)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list deals");
    };
    let data = getUserData(caller);
    ListEntry.getAll(data.deals);
  };

  // Trip Management
  public shared ({ caller }) func addTrip(vehicleId : Nat, driverName : Text, fromCity : Text, toCity : Text, freightAmount : Nat, expenses : Nat, status : TripStatus) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add trips");
    };
    let data = getUserData(caller);
    let trip : Trip = {
      vehicleId;
      driverName;
      fromCity;
      toCity;
      freightAmount;
      expenses;
      status;
      createdBy = caller;
      createdAt = Time.now();
    };
    let (id, newTrips) = ListEntry.add(data.trips, trip);
    setUserData(caller, { data with trips = newTrips });
    id;
  };

  public shared ({ caller }) func updateTrip(id : Nat, vehicleId : Nat, driverName : Text, fromCity : Text, toCity : Text, freightAmount : Nat, expenses : Nat, status : TripStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update trips");
    };
    let data = getUserData(caller);
    switch (data.trips.entries.get(id)) {
      case (?existingTrip) {
        let updatedTrip : Trip = {
          vehicleId;
          driverName;
          fromCity;
          toCity;
          freightAmount;
          expenses;
          status;
          createdBy = existingTrip.createdBy;
          createdAt = existingTrip.createdAt;
        };
        let newTrips = ListEntry.updateEntry(data.trips, id, updatedTrip);
        setUserData(caller, { data with trips = newTrips });
      };
      case null {
        Runtime.trap("Trip not found");
      };
    };
  };

  public query ({ caller }) func listTrips() : async [(Nat, Trip)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list trips");
    };
    let data = getUserData(caller);
    ListEntry.getAll(data.trips);
  };

  // Expense Management
  public shared ({ caller }) func addExpense(category : ExpenseCategory, amount : Nat, description : Text, vehicleId : ?Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add expenses");
    };
    let data = getUserData(caller);
    let expense : Expense = {
      category;
      amount;
      description;
      vehicleId;
      createdBy = caller;
      createdAt = Time.now();
    };
    let (id, newExpenses) = ListEntry.add(data.expenses, expense);
    setUserData(caller, { data with expenses = newExpenses });
    id;
  };

  public query ({ caller }) func listExpenses() : async [(Nat, Expense)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list expenses");
    };
    let data = getUserData(caller);
    ListEntry.getAll(data.expenses);
  };

  // Dashboard Stats
  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view dashboard stats");
    };
    let data = getUserData(caller);

    var totalIncome : Nat = 0;
    var totalExpenses : Nat = 0;
    var activeTripsCount : Nat = 0;
    var pendingDealsCount : Nat = 0;

    for ((_, deal) in data.deals.entries.entries()) {
      switch (deal.status) {
        case (#completed) {
          totalIncome += deal.brokerCommission;
        };
        case (#pending) {
          pendingDealsCount += 1;
        };
        case _ {};
      };
    };

    for ((_, trip) in data.trips.entries.entries()) {
      switch (trip.status) {
        case (#completed) {
          totalIncome += trip.freightAmount;
        };
        case (#ongoing) {
          activeTripsCount += 1;
        };
      };
    };

    for ((_, expense) in data.expenses.entries.entries()) {
      totalExpenses += expense.amount;
    };

    {
      totalIncome;
      totalExpenses;
      activeTripsCount;
      pendingDealsCount;
      monthlySummary = [];
    };
  };
};
