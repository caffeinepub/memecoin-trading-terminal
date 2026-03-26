# Memecoin Trading Terminal

## Current State
New project, no existing application.

## Requested Changes (Diff)

### Add
- Full trading terminal dashboard inspired by trade.padre.gg
- Dark theme (~#0B0D10 background) with card-based layout
- Top navigation with brand, nav links, chain selector, and connect wallet button
- Left sidebar: searchable token list with rank, price, 24h change, volume
- Center: candlestick price chart (recharts) with timeframe selector, token pair header
- Center below: Token Info card (FDV, liquidity, holders, market cap) and Recent Activity card
- Right sidebar: Quick Trade panel with Buy/Sell toggle, Pay/Receive fields, slippage, and CTA button
- Right below: My Holdings card
- Footer with links

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: store token list data, trade history, holdings
2. Frontend: 3-column layout with all panels described above
3. Mock candlestick chart using recharts ComposedChart
4. Interactive Buy/Sell form with state management
5. Token search/filter in sidebar
