import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Token, Trade } from "../backend";
import { useActor } from "./useActor";

export function useGetAllTokens() {
  const { actor, isFetching } = useActor();
  return useQuery<Token[]>({
    queryKey: ["tokens"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTokens();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllTrades() {
  const { actor, isFetching } = useActor();
  return useQuery<Trade[]>({
    queryKey: ["trades"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTrades();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerHoldings() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[{ amount: number; symbol: string }, Token]>>({
    queryKey: ["holdings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerHoldings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBuyToken() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      amount,
    }: { symbol: string; amount: number }) => {
      if (!actor) throw new Error("Not connected");
      return actor.buyToken(symbol, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holdings"] });
      qc.invalidateQueries({ queryKey: ["trades"] });
      qc.invalidateQueries({ queryKey: ["tokens"] });
    },
  });
}

export function useSellToken() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      amount,
    }: { symbol: string; amount: number }) => {
      if (!actor) throw new Error("Not connected");
      return actor.sellToken(symbol, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holdings"] });
      qc.invalidateQueries({ queryKey: ["trades"] });
      qc.invalidateQueries({ queryKey: ["tokens"] });
    },
  });
}

export function useInitSampleData() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.initializeSampleData();
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}
