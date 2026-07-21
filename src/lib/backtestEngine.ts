import { parsePineScriptToStrategy } from './pineParser';

export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface PropFirmConfig {
  initialBalance: number;
  dailyDrawdownPercent: number;
  maxDrawdownPercent: number;
  riskPerTradePercent: number;
  maxTradesPerDay: number;
  feePercent: number;
}

export interface BacktestResult {
  metrics: {
    totalReturn: number;
    sharpe: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    totalTrades: number;
    avgWin: number;
    avgLoss: number;
  };
  equityCurve: { time: number; equity: number }[];
  trades: { entryTime: number; exitTime: number; type: 'long' | 'short'; entryPrice: number; exitPrice: number; pnl: number; }[];
}

export function runBacktest(data: OHLCV[], pineCode: string, config: PropFirmConfig): BacktestResult {
  const strategyFn = parsePineScriptToStrategy(pineCode);
  let equity = config.initialBalance;
  let peakEquity = equity;
  let position: { type: 'long' | 'short'; entryPrice: number; entryTime: number; sl: number; tp: number } | null = null;
  const trades: any[] = [];
  const equityCurve: any[] = [];
  let dailyLoss = 0;
  let tradesToday = 0;
  let currentDay = '';
  let maxEquityDrawdown = 0;
  let winCount = 0, lossCount = 0;
  let sumWin = 0, sumLoss = 0;

  for (let i = 0; i < data.length; i++) {
    const candle = data[i];
    const date = new Date(candle.time);
    const dayKey = date.toDateString();

    if (dayKey !== currentDay) {
      dailyLoss = 0;
      tradesToday = 0;
      currentDay = dayKey;
    }

    const pastData = data.slice(0, i + 1);
    const { signal } = strategyFn(pastData);

    if (signal && !position) {
      if (dailyLoss / config.initialBalance >= config.dailyDrawdownPercent / 100) break;
      if (tradesToday >= config.maxTradesPerDay) break;
      
      const slPercent = 0.01;
      const tpPercent = 0.02;
      
      position = {
        type: signal === 'buy' ? 'long' : 'short',
        entryPrice: candle.close,
        entryTime: candle.time,
        sl: signal === 'buy' ? candle.close * (1 - slPercent) : candle.close * (1 + slPercent),
        tp: signal === 'buy' ? candle.close * (1 + tpPercent) : candle.close * (1 - tpPercent),
      };
    }

    if (position) {
      const currentPrice = candle.close;
      let exit = false;
      let exitPrice = currentPrice;

      if (position.type === 'long') {
        if (currentPrice <= position.sl) { exit = true; exitPrice = position.sl; }
        else if (currentPrice >= position.tp) { exit = true; exitPrice = position.tp; }
      } else {
        if (currentPrice >= position.sl) { exit = true; exitPrice = position.sl; }
        else if (currentPrice <= position.tp) { exit = true; exitPrice = position.tp; }
      }

      if (i === data.length - 1) exit = true;

      if (exit) {
        const pnl = position.type === 'long' 
          ? (exitPrice - position.entryPrice) / position.entryPrice 
          : (position.entryPrice - exitPrice) / position.entryPrice;
        
        const pnlValue = pnl * equity;
        const fee = config.feePercent / 100 * (position.entryPrice + exitPrice) / 2 * (equity / position.entryPrice);
        const netPnl = pnlValue - fee;

        equity += netPnl;
        if (netPnl > 0) { winCount++; sumWin += netPnl; } else { lossCount++; sumLoss += netPnl; }
        if (netPnl < 0) dailyLoss += Math.abs(netPnl);

        trades.push({
          entryTime: position.entryTime,
          exitTime: candle.time,
          type: position.type,
          entryPrice: position.entryPrice,
          exitPrice: exitPrice,
          pnl: netPnl,
        });

        position = null;
        tradesToday++;

        if (equity > peakEquity) peakEquity = equity;
        const dd = (peakEquity - equity) / peakEquity;
        if (dd > maxEquityDrawdown) maxEquityDrawdown = dd;
      }
    }

    equityCurve.push({ time: candle.time, equity });
  }

  const totalReturn = ((equity - config.initialBalance) / config.initialBalance) * 100;
  const returns = equityCurve.map((v, idx) => idx === 0 ? 0 : (v.equity - equityCurve[idx-1].equity) / equityCurve[idx-1].equity);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdReturn = Math.sqrt(returns.reduce((s, v) => s + Math.pow(v - avgReturn, 2), 0) / returns.length);
  const sharpe = stdReturn === 0 ? 0 : (avgReturn / stdReturn) * Math.sqrt(365);
  const winRate = (winCount + lossCount) === 0 ? 0 : (winCount / (winCount + lossCount)) * 100;
  const profitFactor = sumLoss === 0 ? (sumWin > 0 ? 999 : 0) : Math.abs(sumWin / sumLoss);

  return {
    metrics: {
      totalReturn,
      sharpe,
      maxDrawdown: maxEquityDrawdown * 100,
      winRate,
      profitFactor,
      totalTrades: trades.length,
      avgWin: winCount === 0 ? 0 : sumWin / winCount,
      avgLoss: lossCount === 0 ? 0 : sumLoss / lossCount,
    },
    equityCurve,
    trades,
  };
}
