import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Token {
    fdv: number;
    change24h: number;
    marketCap: number;
    name: string;
    liquidity: number;
    volume24h: number;
    holders: bigint;
    price: number;
    symbol: string;
}
export type Time = bigint;
export interface UserProfile {
    name: string;
}
export interface Trade {
    tradeType: Variant_buy_sell;
    timestamp: Time;
    tokenPair: string;
    price: number;
    amount: number;
    symbol: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_buy_sell {
    buy = "buy",
    sell = "sell"
}
export interface backendInterface {
    addOrUpdateToken(token: Token): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    buyToken(symbol: string, amount: number): Promise<void>;
    getAllTokens(): Promise<Array<Token>>;
    getAllTrades(): Promise<Array<Trade>>;
    getCallerHoldings(): Promise<Array<[{
            amount: number;
            symbol: string;
        }, Token]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getHoldings(user: Principal): Promise<Array<[{
            amount: number;
            symbol: string;
        }, Token]>>;
    getToken(symbol: string): Promise<Token | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeSampleData(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sellToken(symbol: string, amount: number): Promise<void>;
    updateTokenPrice(symbol: string, newPrice: number, newChange24h: number): Promise<void>;
}
