import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  ChevronDown,
  Github,
  MessageCircle,
  Search,
  TrendingDown,
  TrendingUp,
  Twitter,
  Wallet,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { Token, Trade } from "./backend";
import { Variant_buy_sell } from "./backend";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useBuyToken,
  useGetAllTokens,
  useGetAllTrades,
  useGetCallerHoldings,
  useSellToken,
} from "./hooks/useQueries";
import { generateOHLC } from "./utils/chartData";

const qc = new QueryClient();

const FALLBACK_TOKENS: Token[] = [
  {
    symbol: "PEPE",
    name: "Pepe",
    price: 0.00000842,
    change24h: 14.3,
    volume24h: 2840000,
    fdv: 3540000000,
    liquidity: 12400000,
    marketCap: 3540000000,
    holders: BigInt(245000),
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    price: 0.1824,
    change24h: -3.2,
    volume24h: 890000000,
    fdv: 24200000000,
    liquidity: 45000000,
    marketCap: 24200000000,
    holders: BigInt(5200000),
  },
  {
    symbol: "SHIB",
    name: "Shiba Inu",
    price: 0.00001234,
    change24h: 7.8,
    volume24h: 234000000,
    fdv: 7280000000,
    liquidity: 8900000,
    marketCap: 7280000000,
    holders: BigInt(1300000),
  },
  {
    symbol: "FLOKI",
    name: "Floki",
    price: 0.000198,
    change24h: 22.1,
    volume24h: 45000000,
    fdv: 1890000000,
    liquidity: 3400000,
    marketCap: 1890000000,
    holders: BigInt(420000),
  },
  {
    symbol: "WIF",
    name: "dogwifhat",
    price: 2.34,
    change24h: -8.4,
    volume24h: 124000000,
    fdv: 2340000000,
    liquidity: 18700000,
    marketCap: 2340000000,
    holders: BigInt(180000),
  },
  {
    symbol: "BONK",
    name: "Bonk",
    price: 0.0000234,
    change24h: 5.6,
    volume24h: 67000000,
    fdv: 1570000000,
    liquidity: 5600000,
    marketCap: 1570000000,
    holders: BigInt(320000),
  },
  {
    symbol: "POPCAT",
    name: "Popcat",
    price: 0.892,
    change24h: 31.2,
    volume24h: 89000000,
    fdv: 892000000,
    liquidity: 7800000,
    marketCap: 892000000,
    holders: BigInt(95000),
  },
  {
    symbol: "MEW",
    name: "cat in a dogs world",
    price: 0.00754,
    change24h: -12.7,
    volume24h: 31000000,
    fdv: 754000000,
    liquidity: 2300000,
    marketCap: 754000000,
    holders: BigInt(67000),
  },
];

const FALLBACK_TRADES: Trade[] = [
  {
    symbol: "PEPE",
    tokenPair: "PEPE/SOL",
    amount: 1500000,
    price: 0.00000842,
    tradeType: Variant_buy_sell.buy,
    timestamp: BigInt(Date.now() - 12000),
  },
  {
    symbol: "WIF",
    tokenPair: "WIF/SOL",
    amount: 450,
    price: 2.34,
    tradeType: Variant_buy_sell.sell,
    timestamp: BigInt(Date.now() - 45000),
  },
  {
    symbol: "BONK",
    tokenPair: "BONK/SOL",
    amount: 8900000,
    price: 0.0000234,
    tradeType: Variant_buy_sell.buy,
    timestamp: BigInt(Date.now() - 90000),
  },
  {
    symbol: "SHIB",
    tokenPair: "SHIB/SOL",
    amount: 2000000,
    price: 0.00001234,
    tradeType: Variant_buy_sell.buy,
    timestamp: BigInt(Date.now() - 180000),
  },
  {
    symbol: "FLOKI",
    tokenPair: "FLOKI/SOL",
    amount: 95000,
    price: 0.000198,
    tradeType: Variant_buy_sell.sell,
    timestamp: BigInt(Date.now() - 300000),
  },
  {
    symbol: "DOGE",
    tokenPair: "DOGE/SOL",
    amount: 12000,
    price: 0.1824,
    tradeType: Variant_buy_sell.buy,
    timestamp: BigInt(Date.now() - 420000),
  },
];

const CHAINS = [
  { id: "solana", name: "Solana", color: "#9945FF" },
  { id: "ethereum", name: "Ethereum", color: "#627EEA" },
  { id: "bnb", name: "BNB Chain", color: "#F0B90B" },
  { id: "base", name: "Base", color: "#0052FF" },
];

const TIMEFRAMES = ["15m", "1h", "4h", "1D"];

function formatPrice(p: number): string {
  if (p < 0.0001) return p.toFixed(8);
  if (p < 0.01) return p.toFixed(6);
  if (p < 1) return p.toFixed(4);
  return p.toFixed(2);
}

function formatLarge(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatAmount(a: number): string {
  if (a >= 1e9) return `${(a / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${(a / 1e3).toFixed(1)}K`;
  return a.toFixed(0);
}

function timeAgo(ts: bigint): string {
  const ms = Date.now() - Number(ts);
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function TokenAvatar({ symbol }: { symbol: string }) {
  const colors: Record<string, string> = {
    PEPE: "#27ae60",
    DOGE: "#e67e22",
    SHIB: "#e74c3c",
    FLOKI: "#f39c12",
    WIF: "#9b59b6",
    BONK: "#e74c3c",
    POPCAT: "#1abc9c",
    MEW: "#3498db",
  };
  const bg = colors[symbol] ?? "#2F7BFF";
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
      style={{ backgroundColor: bg }}
    >
      {symbol.slice(0, 2)}
    </div>
  );
}

function TradingApp() {
  const [selectedToken, setSelectedToken] = useState<Token>(FALLBACK_TOKENS[0]);
  const [search, setSearch] = useState("");
  const [timeframe, setTimeframe] = useState("15m");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [payAmount, setPayAmount] = useState("");
  const [slippage, setSlippage] = useState("1.0");
  const [chain, setChain] = useState(CHAINS[0]);

  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;

  const { data: backendTokens, isLoading: tokensLoading } = useGetAllTokens();
  const { data: backendTrades } = useGetAllTrades();
  const { data: backendHoldings } = useGetCallerHoldings();
  const buyMutation = useBuyToken();
  const sellMutation = useSellToken();

  const tokens: Token[] =
    backendTokens && backendTokens.length > 0 ? backendTokens : FALLBACK_TOKENS;
  const trades: Trade[] =
    backendTrades && backendTrades.length > 0 ? backendTrades : FALLBACK_TRADES;

  const filteredTokens = useMemo(
    () =>
      tokens.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.symbol.toLowerCase().includes(search.toLowerCase()),
      ),
    [tokens, search],
  );

  const chartData = useMemo(() => {
    const seed = selectedToken.symbol
      .split("")
      .reduce((a, c) => a + c.charCodeAt(0), 0);
    return generateOHLC(selectedToken.price, seed, 50);
  }, [selectedToken.symbol, selectedToken.price]);

  const priceMin = useMemo(
    () => Math.min(...chartData.map((d) => d.low)) * 0.998,
    [chartData],
  );
  const priceMax = useMemo(
    () => Math.max(...chartData.map((d) => d.high)) * 1.002,
    [chartData],
  );

  const receiveAmount = useMemo(() => {
    const sol = Number.parseFloat(payAmount);
    if (!sol || sol <= 0) return "";
    return (sol / selectedToken.price).toFixed(0);
  }, [payAmount, selectedToken.price]);

  async function handleTrade() {
    const amount = Number.parseFloat(payAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      if (tradeType === "buy") {
        await buyMutation.mutateAsync({ symbol: selectedToken.symbol, amount });
      } else {
        await sellMutation.mutateAsync({
          symbol: selectedToken.symbol,
          amount,
        });
      }
      toast.success(
        `${tradeType === "buy" ? "Bought" : "Sold"} ${selectedToken.symbol} successfully!`,
      );
      setPayAmount("");
    } catch {
      toast.error("Trade failed. Please try again.");
    }
  }

  const isTradePending = buyMutation.isPending || sellMutation.isPending;
  const holdings = backendHoldings ?? [];

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ background: "oklch(0.1 0.012 240)" }}
    >
      {/* Header */}
      <header
        className="h-16 border-b border-border flex items-center px-6 gap-6 sticky top-0 z-50"
        style={{ background: "oklch(0.12 0.015 240)" }}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[15px] tracking-widest text-foreground uppercase">
            PADRE
          </span>
        </div>

        <nav className="flex items-center gap-1 flex-1">
          {[
            "Dashboard",
            "Discover",
            "Leaderboard",
            "Settings",
            "Community",
          ].map((item) => (
            <button
              key={item}
              type="button"
              data-ocid={`nav.${item.toLowerCase()}.link`}
              className={`px-3 py-1.5 text-[13px] font-medium rounded transition-colors relative ${item === "Dashboard" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item}
              {item === "Dashboard" && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-ocid="chain.select"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-[13px] font-medium text-foreground hover:border-primary transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: chain.color }}
                />
                {chain.name}
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              {CHAINS.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => setChain(c)}
                  className="text-foreground hover:bg-secondary cursor-pointer"
                >
                  <span
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ background: c.color }}
                  />
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isLoggedIn ? (
            <button
              type="button"
              data-ocid="wallet.disconnect.button"
              onClick={() => clear()}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold border border-success text-success hover:bg-success/10 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              {identity.getPrincipal().toString().slice(0, 8)}...
            </button>
          ) : (
            <button
              type="button"
              data-ocid="wallet.connect.button"
              onClick={() => login()}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold bg-primary text-white hover:opacity-90 transition-opacity"
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Main grid */}
      <main className="flex-1 flex gap-5 p-6 min-h-0">
        {/* Left sidebar: Token List */}
        <aside className="w-72 flex-shrink-0 flex flex-col gap-4">
          <div
            className="rounded-2xl border border-border flex flex-col flex-1"
            style={{ background: "oklch(var(--card))" }}
          >
            <div className="px-4 pt-4 pb-3 border-b border-border">
              <h2 className="text-[13px] font-semibold text-foreground mb-3">
                Token List
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  data-ocid="tokenlist.search_input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tokens..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg text-[12px] bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="px-4 py-2 grid grid-cols-5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>#</span>
              <span className="col-span-2">Token</span>
              <span className="text-right">Price</span>
              <span className="text-right">24h</span>
            </div>

            <ScrollArea className="flex-1">
              {tokensLoading ? (
                <div
                  className="px-4 py-2 space-y-3"
                  data-ocid="tokenlist.loading_state"
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                    <Skeleton key={i} className="h-8 w-full bg-secondary" />
                  ))}
                </div>
              ) : (
                <div data-ocid="tokenlist.table">
                  {filteredTokens.map((token, idx) => (
                    <button
                      key={token.symbol}
                      type="button"
                      data-ocid={`tokenlist.item.${idx + 1}`}
                      onClick={() => setSelectedToken(token)}
                      className={`w-full px-4 py-2.5 grid grid-cols-5 items-center hover:bg-secondary/50 transition-colors text-left ${selectedToken.symbol === token.symbol ? "bg-secondary" : ""}`}
                    >
                      <span className="text-[11px] text-muted-foreground">
                        {idx + 1}
                      </span>
                      <span className="col-span-2 flex items-center gap-2">
                        <TokenAvatar symbol={token.symbol} />
                        <div className="min-w-0">
                          <div className="text-[12px] font-semibold text-foreground truncate">
                            {token.symbol}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {token.name}
                          </div>
                        </div>
                      </span>
                      <span className="text-right text-[11px] font-medium text-foreground">
                        ${formatPrice(token.price)}
                      </span>
                      <span
                        className={`text-right text-[11px] font-semibold ${token.change24h >= 0 ? "text-chart-up" : "text-destructive"}`}
                      >
                        {token.change24h >= 0 ? "+" : ""}
                        {token.change24h.toFixed(1)}%
                      </span>
                    </button>
                  ))}
                  {filteredTokens.length === 0 && (
                    <div
                      data-ocid="tokenlist.empty_state"
                      className="px-4 py-8 text-center text-muted-foreground text-[12px]"
                    >
                      No tokens found
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </aside>

        {/* Center column */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Chart card */}
          <div
            className="rounded-2xl border border-border p-4 flex flex-col"
            style={{ background: "oklch(var(--card))" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <TokenAvatar symbol={selectedToken.symbol} />
                  <div>
                    <div className="text-[14px] font-bold text-foreground">
                      {selectedToken.symbol}/SOL
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {selectedToken.name}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[18px] font-bold text-foreground">
                    ${formatPrice(selectedToken.price)}
                  </div>
                  <div
                    className={`text-[12px] font-semibold flex items-center gap-1 ${selectedToken.change24h >= 0 ? "text-chart-up" : "text-destructive"}`}
                  >
                    {selectedToken.change24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {selectedToken.change24h >= 0 ? "+" : ""}
                    {selectedToken.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-input rounded-lg p-1">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    data-ocid={`chart.${tf.toLowerCase()}.tab`}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${timeframe === tf ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#252B36"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "#7E8796" }}
                    tickLine={false}
                    axisLine={false}
                    interval={9}
                  />
                  <YAxis
                    domain={[priceMin, priceMax]}
                    tick={{ fontSize: 10, fill: "#7E8796" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${formatPrice(v)}`}
                    width={72}
                  />
                  <ReTooltip
                    contentStyle={{
                      background: "#141922",
                      border: "1px solid #252B36",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "#E7EAF0",
                    }}
                    formatter={(value: number) => [
                      `$${formatPrice(value)}`,
                      "",
                    ]}
                    labelStyle={{ color: "#7E8796" }}
                  />
                  <Bar dataKey="close" minPointSize={1}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.time}
                        fill={entry.close >= entry.open ? "#23D18B" : "#E25555"}
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom row: Token Info + Recent Activity */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-2xl border border-border p-4"
              style={{ background: "oklch(var(--card))" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-[13px] font-semibold text-foreground">
                  {selectedToken.symbol} Info
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "FDV", value: formatLarge(selectedToken.fdv) },
                  {
                    label: "Liquidity",
                    value: formatLarge(selectedToken.liquidity),
                  },
                  {
                    label: "Holders",
                    value: Number(selectedToken.holders).toLocaleString(),
                  },
                  {
                    label: "Market Cap",
                    value: formatLarge(selectedToken.marketCap),
                  },
                  {
                    label: "Volume 24h",
                    value: formatLarge(selectedToken.volume24h),
                  },
                  {
                    label: "Price",
                    value: `$${formatPrice(selectedToken.price)}`,
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-input rounded-xl p-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                      {item.label}
                    </div>
                    <div className="text-[13px] font-semibold text-foreground">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-2xl border border-border p-4"
              style={{ background: "oklch(var(--card))" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-[13px] font-semibold text-foreground">
                  Recent Activity
                </h3>
              </div>
              <div className="space-y-1">
                <div className="grid grid-cols-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
                  <span>Pair</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Type</span>
                  <span className="text-right">Time</span>
                </div>
                {trades.slice(0, 6).map((trade, i) => (
                  <div
                    key={String(trade.timestamp)}
                    data-ocid={`activity.item.${i + 1}`}
                    className="grid grid-cols-4 py-2 items-center hover:bg-secondary/30 rounded-lg px-1 transition-colors"
                  >
                    <span className="text-[11px] font-medium text-foreground">
                      {trade.tokenPair}
                    </span>
                    <span className="text-right text-[11px] text-muted-foreground">
                      {formatAmount(trade.amount)}
                    </span>
                    <span
                      className={`text-right text-[11px] font-semibold ${trade.tradeType === Variant_buy_sell.buy ? "text-chart-up" : "text-destructive"}`}
                    >
                      {trade.tradeType === Variant_buy_sell.buy
                        ? "BUY"
                        : "SELL"}
                    </span>
                    <span className="text-right text-[10px] text-muted-foreground">
                      {timeAgo(trade.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar: Trading panel */}
        <aside className="w-80 flex-shrink-0 flex flex-col gap-4">
          <div
            className="rounded-2xl border border-border p-4"
            style={{ background: "oklch(var(--card))" }}
          >
            <h3 className="text-[13px] font-semibold text-foreground mb-4">
              Quick Trade:{" "}
              <span className="text-primary">{selectedToken.symbol}/SOL</span>
            </h3>

            <div className="flex bg-input rounded-xl p-1 mb-4">
              <button
                type="button"
                data-ocid="trade.buy.tab"
                onClick={() => setTradeType("buy")}
                className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${tradeType === "buy" ? "bg-cta-buy text-cta-buy-fg shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Buy
              </button>
              <button
                type="button"
                data-ocid="trade.sell.tab"
                onClick={() => setTradeType("sell")}
                className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${tradeType === "sell" ? "bg-destructive text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Sell
              </button>
            </div>

            <div className="mb-3">
              <span className="text-[11px] text-muted-foreground mb-1.5 block">
                Pay (SOL)
              </span>
              <div className="relative">
                <input
                  id="trade-pay"
                  data-ocid="trade.pay.input"
                  type="number"
                  min="0"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pr-14 pl-3 py-3 rounded-xl bg-input border border-border text-foreground text-[14px] font-medium placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-muted-foreground">
                  SOL
                </span>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-[11px] text-muted-foreground mb-1.5 block">
                Receive ({selectedToken.symbol})
              </span>
              <div className="relative">
                <input
                  id="trade-receive"
                  data-ocid="trade.receive.input"
                  readOnly
                  value={receiveAmount}
                  placeholder="0"
                  className="w-full pr-16 pl-3 py-3 rounded-xl bg-input border border-border text-foreground text-[14px] font-medium placeholder:text-muted-foreground focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-muted-foreground">
                  {selectedToken.symbol}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] mb-3">
              <span className="text-muted-foreground">Rate</span>
              <span className="text-foreground font-medium">
                1 SOL = {(1 / selectedToken.price).toFixed(0)}{" "}
                {selectedToken.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] mb-4">
              <span className="text-muted-foreground">Slippage</span>
              <div className="flex gap-1">
                {["0.5", "1.0", "2.0"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    data-ocid={`trade.slippage.${s.replace(".", "")}.toggle`}
                    onClick={() => setSlippage(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${slippage === s ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              data-ocid="trade.submit.button"
              onClick={handleTrade}
              disabled={isTradePending}
              className={`w-full py-3.5 rounded-xl text-[14px] font-bold transition-all disabled:opacity-60 ${tradeType === "buy" ? "bg-cta-buy text-cta-buy-fg hover:opacity-90" : "bg-destructive text-white hover:opacity-90"}`}
            >
              {isTradePending
                ? "Processing..."
                : tradeType === "buy"
                  ? `Buy ${selectedToken.symbol}`
                  : `Sell ${selectedToken.symbol}`}
            </button>

            {!isLoggedIn && (
              <p className="text-center text-[11px] text-muted-foreground mt-2">
                Connect wallet to trade
              </p>
            )}
          </div>

          <div
            className="rounded-2xl border border-border p-4 flex-1"
            style={{ background: "oklch(var(--card))" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <h3 className="text-[13px] font-semibold text-foreground">
                My Holdings
              </h3>
            </div>

            {!isLoggedIn ? (
              <div
                data-ocid="holdings.empty_state"
                className="py-6 text-center"
              >
                <Wallet className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-[12px] text-muted-foreground">
                  Connect wallet to view holdings
                </p>
              </div>
            ) : holdings.length === 0 ? (
              <div
                data-ocid="holdings.empty_state"
                className="py-6 text-center"
              >
                <p className="text-[12px] text-muted-foreground">
                  No holdings yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {holdings.map(([holding, token], i) => (
                  <div
                    key={holding.symbol}
                    data-ocid={`holdings.item.${i + 1}`}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <TokenAvatar symbol={holding.symbol} />
                      <div>
                        <div className="text-[12px] font-semibold text-foreground">
                          {holding.symbol}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatAmount(holding.amount)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-semibold text-foreground">
                        $
                        {formatLarge(holding.amount * token.price).replace(
                          "$",
                          "",
                        )}
                      </div>
                      <div
                        className={`text-[10px] font-medium ${token.change24h >= 0 ? "text-chart-up" : "text-destructive"}`}
                      >
                        {token.change24h >= 0 ? "+" : ""}
                        {token.change24h.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer
        className="border-t border-border px-6 py-4"
        style={{ background: "oklch(0.12 0.015 240)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            {["Status", "Privacy", "Terms", "Documentation"].map((item) => (
              <button
                key={item}
                type="button"
                className="hover:text-foreground transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()}. Built with &hearts; using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <TradingApp />
    </QueryClientProvider>
  );
}
