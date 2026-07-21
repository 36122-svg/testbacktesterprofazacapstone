// Parser sederhana untuk strategi PineScript (Support: SMA, RSI, MACD, BB, Crossover)
export function parsePineScriptToStrategy(code: string): (data: any[]) => { signal: 'buy' | 'sell' | null } {
  const params: Record<string, number> = {};
  const paramRegex = /(\w+)\s*=\s*(\d+)/g;
  let match;
  while ((match = paramRegex.exec(code)) !== null) {
    params[match[1]] = parseInt(match[2]);
  }

  const hasRSI = code.includes('rsi') || code.includes('RSI');
  const hasMACD = code.includes('macd') || code.includes('MACD');
  const hasBB = code.includes('bb') || code.includes('Bollinger') || code.includes('bollinger');
  const hasCrossover = code.includes('crossover');
  const hasCrossunder = code.includes('crossunder');

  return (ohlcvData: any[]) => {
    if (ohlcvData.length < (params.slow || 30)) return { signal: null };

    const closes = ohlcvData.map(d => d.close);
    
    const SMA = (arr: number[], period: number) => {
      if (arr.length < period) return 0;
      const slice = arr.slice(-period);
      return slice.reduce((a, b) => a + b, 0) / period;
    };

    const RSI = (arr: number[], period: number = 14) => {
      if (arr.length < period + 1) return 50;
      let gains = 0, losses = 0;
      const recent = arr.slice(-period - 1);
      for (let i = 1; i < recent.length; i++) {
        const diff = recent[i] - recent[i-1];
        if (diff > 0) gains += diff;
        else losses += Math.abs(diff);
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      if (avgLoss === 0) return 100;
      return 100 - (100 / (1 + avgGain / avgLoss));
    };

    let signal: 'buy' | 'sell' | null = null;
    const current = ohlcvData[ohlcvData.length - 1];
    const prev = ohlcvData[ohlcvData.length - 2];
    if (!prev) return { signal: null };

    if (hasRSI) {
      const rsi = RSI(closes, params.rsiLength || 14);
      const prevRsi = RSI(closes.slice(0, -1), params.rsiLength || 14);
      if (hasCrossover && prevRsi < 30 && rsi >= 30) signal = 'buy';
      else if (hasCrossunder && prevRsi > 70 && rsi <= 70) signal = 'sell';
      else if (rsi > 70) signal = 'sell';
      else if (rsi < 30) signal = 'buy';
    }

    if (hasMACD && !signal) {
      const fast = params.fast || 12;
      const slow = params.slow || 26;
      const emaFast = SMA(closes, fast);
      const emaSlow = SMA(closes, slow);
      const macd = emaFast - emaSlow;
      if (macd > 0 && current.close > prev.close) signal = 'buy';
      else if (macd < 0 && current.close < prev.close) signal = 'sell';
    }

    if (hasBB && !signal) {
      const period = params.bbPeriod || 20;
      const mult = params.bbMult || 2;
      const sma = SMA(closes, period);
      const std = Math.sqrt(closes.slice(-period).reduce((s, v) => s + Math.pow(v - sma, 2), 0) / period);
      const upper = sma + std * mult;
      const lower = sma - std * mult;
      if (current.close < lower) signal = 'buy';
      else if (current.close > upper) signal = 'sell';
    }

    if (!signal && (params.fast && params.slow)) {
      const fastSMA = SMA(closes, params.fast);
      const slowSMA = SMA(closes, params.slow);
      const prevFast = SMA(closes.slice(0, -1), params.fast);
      const prevSlow = SMA(closes.slice(0, -1), params.slow);
      if (prevFast <= prevSlow && fastSMA > slowSMA) signal = 'buy';
      else if (prevFast >= prevSlow && fastSMA < slowSMA) signal = 'sell';
    }

    return { signal };
  };
}