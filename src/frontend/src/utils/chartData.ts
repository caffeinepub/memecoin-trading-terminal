export interface OHLCPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function generateOHLC(
  basePrice: number,
  seed: number,
  count = 50,
): OHLCPoint[] {
  let price = basePrice;
  const data: OHLCPoint[] = [];
  let rng = seed;

  function rand(): number {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0xffffffff;
  }

  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (rand() - 0.48) * price * 0.04;
    const close = Math.max(open + change, open * 0.01);
    const high = Math.max(open, close) * (1 + rand() * 0.015);
    const low = Math.min(open, close) * (1 - rand() * 0.015);
    const volume = rand() * basePrice * 5000 + basePrice * 1000;
    const ts = new Date(now - i * 15 * 60 * 1000);
    const label = ts.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    data.push({ time: label, open, high, low, close, volume });
    price = close;
  }
  return data;
}
