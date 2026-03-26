import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile System
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Types
  type Token = {
    name : Text;
    symbol : Text;
    price : Float;
    change24h : Float;
    volume24h : Float;
    marketCap : Float;
    fdv : Float;
    liquidity : Float;
    holders : Nat;
  };

  type Trade = {
    tokenPair : Text;
    amount : Float;
    tradeType : { #buy; #sell };
    timestamp : Time.Time;
    price : Float;
    symbol : Text;
  };

  type Holding = {
    symbol : Text;
    amount : Float;
    value : Float;
  };

  // Token and Trade Management
  let tokens = Map.empty<Text, Token>();
  let trades = List.empty<Trade>();

  // User-specific holdings
  type UserTokenHolding = Map.Map<Text, Float>;
  let holdings = Map.empty<Principal, UserTokenHolding>();

  // Token management functions (Admin only)
  public shared ({ caller }) func addOrUpdateToken(token : Token) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage tokens");
    };
    tokens.add(token.symbol, token);
  };

  public query func getToken(symbol : Text) : async ?Token {
    // Public read access - no auth required
    tokens.get(symbol);
  };

  public shared ({ caller }) func updateTokenPrice(symbol : Text, newPrice : Float, newChange24h : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update token prices");
    };
    switch (tokens.get(symbol)) {
      case (null) {};
      case (?token) {
        let updatedToken = {
          token with
          price = newPrice;
          change24h = newChange24h;
        };
        tokens.add(symbol, updatedToken);
      };
    };
  };

  // Holdings management functions (Internal)
  private func addOrUpdateHolding(user : Principal, symbol : Text, amount : Float) {
    let userHoldings = switch (holdings.get(user)) {
      case (null) { Map.empty<Text, Float>() };
      case (?existing) { existing };
    };

    userHoldings.add(symbol, amount);
    holdings.add(user, userHoldings);
  };

  private func getHolding(user : Principal, symbol : Text) : Float {
    if (user == Principal.anonymous()) {
      return 0.0;
    };
    switch (holdings.get(user)) {
      case (null) { 0.0 };
      case (?userHoldings) {
        switch (userHoldings.get(symbol)) {
          case (null) { 0.0 };
          case (?amount) { amount };
        };
      };
    };
  };

  // Record trade and update holdings (User only)
  public shared ({ caller }) func buyToken(symbol : Text, amount : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can buy tokens");
    };
    
    switch (tokens.get(symbol)) {
      case (null) {
        Runtime.trap("Token not found");
      };
      case (?token) {
        let trade : Trade = {
          tokenPair = symbol;
          amount;
          tradeType = #buy;
          timestamp = Time.now();
          price = token.price;
          symbol;
        };

        trades.add(trade);

        // Update holdings for the caller
        let existingAmount = getHolding(caller, symbol);
        addOrUpdateHolding(caller, symbol, existingAmount + amount);
      };
    };
  };

  public shared ({ caller }) func sellToken(symbol : Text, amount : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can sell tokens");
    };

    let existingAmount = getHolding(caller, symbol);
    if (existingAmount < amount) {
      Runtime.trap("Insufficient holdings");
    };

    switch (tokens.get(symbol)) {
      case (null) {
        Runtime.trap("Token not found");
      };
      case (?token) {
        let trade : Trade = {
          tokenPair = symbol;
          amount;
          tradeType = #sell;
          timestamp = Time.now();
          price = token.price;
          symbol;
        };
        trades.add(trade);
        addOrUpdateHolding(caller, symbol, existingAmount - amount);
      };
    };
  };

  // Query functions
  public query func getAllTokens() : async [Token] {
    // Public read access - no auth required
    tokens.values().toArray();
  };

  public query func getAllTrades() : async [Trade] {
    // Public read access - no auth required
    trades.toArray();
  };

  public query ({ caller }) func getHoldings(user : Principal) : async [({ symbol : Text; amount : Float }, Token)] {
    // Users can only see their own holdings, admins can see any
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own holdings");
    };

    switch (holdings.get(user)) {
      case (null) { [] };
      case (?userHoldings) {
        let holdingArray = userHoldings.toArray();
        holdingArray.map(
          func((symbol, amount)) {
            let token = switch (tokens.get(symbol)) {
              case (null) { 
                // Return a default token if not found
                {
                  name = "Unknown";
                  symbol = symbol;
                  price = 0.0;
                  change24h = 0.0;
                  volume24h = 0.0;
                  marketCap = 0.0;
                  fdv = 0.0;
                  liquidity = 0.0;
                  holders = 0;
                }
              };
              case (?token) { token };
            };
            ({ symbol; amount }, token);
          }
        );
      };
    };
  };

  public query ({ caller }) func getCallerHoldings() : async [({ symbol : Text; amount : Float }, Token)] {
    // Convenience function for getting caller's own holdings
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view holdings");
    };

    switch (holdings.get(caller)) {
      case (null) { [] };
      case (?userHoldings) {
        let holdingArray = userHoldings.toArray();
        holdingArray.map(
          func((symbol, amount)) {
            let token = switch (tokens.get(symbol)) {
              case (null) { 
                {
                  name = "Unknown";
                  symbol = symbol;
                  price = 0.0;
                  change24h = 0.0;
                  volume24h = 0.0;
                  marketCap = 0.0;
                  fdv = 0.0;
                  liquidity = 0.0;
                  holders = 0;
                }
              };
              case (?token) { token };
            };
            ({ symbol; amount }, token);
          }
        );
      };
    };
  };

  // Sample data initialization (Admin only)
  public shared ({ caller }) func initializeSampleData() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can initialize sample data");
    };

    let sampleTokens = [
      {
        name = "Pepe Coin";
        symbol = "PEPE";
        price = 0.0000012;
        change24h = 5.2;
        volume24h = 12000000.0;
        marketCap = 420000000.0;
        fdv = 500000000.0;
        liquidity = 200000.0;
        holders = 123456;
      },
      {
        name = "Dogecoin";
        symbol = "DOGE";
        price = 0.12;
        change24h = 2.1;
        volume24h = 50000000.0;
        marketCap = 16000000000.0;
        fdv = 16000000000.0;
        liquidity = 1000000.0;
        holders = 3000000;
      },
      {
        name = "Shiba Inu";
        symbol = "SHIB";
        price = 0.000021;
        change24h = 3.7;
        volume24h = 30000000.0;
        marketCap = 11000000000.0;
        fdv = 12000000000.0;
        liquidity = 800000.0;
        holders = 1500000;
      },
      {
        name = "Floki Inu";
        symbol = "FLOKI";
        price = 0.000035;
        change24h = 4.5;
        volume24h = 8000000.0;
        marketCap = 1200000000.0;
        fdv = 1400000000.0;
        liquidity = 400000.0;
        holders = 200000;
      },
      {
        name = "Bonk";
        symbol = "BONK";
        price = 0.0000025;
        change24h = 6.8;
        volume24h = 18000000.0;
        marketCap = 600000000.0;
        fdv = 700000000.0;
        liquidity = 220000.0;
        holders = 90000;
      },
      {
        name = "Dogwifhat";
        symbol = "WIF";
        price = 3.2;
        change24h = 1.9;
        volume24h = 9000000.0;
        marketCap = 3200000000.0;
        fdv = 3500000000.0;
        liquidity = 600000.0;
        holders = 150000;
      },
      {
        name = "Popcat";
        symbol = "POPCAT";
        price = 0.45;
        change24h = 7.3;
        volume24h = 7000000.0;
        marketCap = 450000000.0;
        fdv = 500000000.0;
        liquidity = 180000.0;
        holders = 80000;
      },
      {
        name = "Mog Coin";
        symbol = "MOG";
        price = 0.0000018;
        change24h = 5.9;
        volume24h = 6000000.0;
        marketCap = 180000000.0;
        fdv = 220000000.0;
        liquidity = 140000.0;
        holders = 40000;
      },
      {
        name = "Turbo";
        symbol = "TURBO";
        price = 0.0000022;
        change24h = 3.4;
        volume24h = 10000000.0;
        marketCap = 220000000.0;
        fdv = 250000000.0;
        liquidity = 160000.0;
        holders = 50000;
      },
      {
        name = "Brett Coin";
        symbol = "BRETT";
        price = 0.35;
        change24h = 2.7;
        volume24h = 12000000.0;
        marketCap = 350000000.0;
        fdv = 400000000.0;
        liquidity = 200000.0;
        holders = 60000;
      },
    ];

    for (token in sampleTokens.values()) {
      tokens.add(token.symbol, token);
    };
  };
};
