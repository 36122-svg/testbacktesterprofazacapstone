import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createChart } from 'lightweight-charts';
import { 
  Play, Save, Download, Settings, Activity, 
  TrendingUp, AlertCircle, RefreshCw, 
  Server, Coins
} from 'lucide-react';
import { runBacktest, PropFirmConfig } from '@/lib/backtestEngine';

const defaultPineCode = `//@version=6
strategy("SMA Golden Cross", overlay=true)

fast = 10
slow = 30

smaFast = ta.sma(close, fast)
smaSlow = ta.sma(close, slow)

plot(smaFast, color=color.blue, linewidth=2)
plot(smaSlow, color=color.orange, linewidth=2)

if (ta.crossover(smaFast, smaSlow))
    strategy.entry("Long", strategy.long)

if (ta.crossunder(smaFast, smaSlow))
    strategy.entry("Short", strategy.short)`;

const EXCHANGES = [
  { value: 'binance', label: '🟡 Binance' },
  { value: 'bybit', label: '🔵 Bybit' },
  { value: 'bitget', label: '🟢 Bitget' },
  { value: 'kraken', label: '🟣 Kraken' },
  { value: 'coinbase', label: '🔷 Coinbase' },
  { value: 'okx', label: '⚫ OKX' },
];

const SYMBOLS = [
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 
  'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'LINK/USDT',
  'MATIC/USDT', 'DOT/USDT', 'BNB/USDT', 'ATOM/USDT',
  'LTC/USDT', 'BCH/USDT', 'NEAR/USDT', 'APT/USDT',
  'ARB/USDT', 'OP/USDT', 'INJ/USDT', 'SUI/USDT'
];

export default function Backtest() {
  const [pineCode, setPineCode] = useState(defaultPineCode);
  const [selectedExchange, setSelectedExchange] = useState('binance');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [marketData, setMarketData] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  const fetchMarketData = async () => {
    setIsFetching(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/.netlify/functions/fetch-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange: selectedExchange,
          symbol: selectedSymbol,
          timeframe: '1h',
          limit: 500,
        }),
      });

      const json = await response.json();
      
      if (!json.success) {
        throw new Error(json.error || 'Gagal mengambil data');
      }

      if (!json.data || json.data.length === 0) {
        throw new Error(`Data ${selectedSymbol} di ${selectedExchange} tidak ditemukan`);
      }

      setMarketData(json.data);
      return json.data;
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat fetch data');
      setMarketData([]);
      return null;
    } finally {
      setIsFetching(false);
    }
  };

  const handleRunBacktest = async () => {
    let data = marketData;
    if (data.length === 0) {
      data = await fetchMarketData();
      if (!data) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const config: PropFirmConfig = {
        initialBalance: 10000,
        dailyDrawdownPercent: 5,
        maxDrawdownPercent: 10,
        riskPerTradePercent: 2,
        maxTradesPerDay: 2,
        feePercent: 0.1,
      };

      const res = runBacktest(data, pineCode, config);
      setResult(res);
      renderChart(data, res);
    } catch (err: any) {
      setError('Error backtest: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = (data: any[], res: any) => {
    if (!chartContainerRef.current) return;
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#0A0A0F' },
        textColor: '#8888AA',
      },
      grid: {
        vertLines: { color: '#1A1A2E' },
        horzLines: { color: '#1A1A2E' },
      },
      timeScale: { timeVisible: true },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00FF88',
      downColor: '#FF4466',
      borderUpColor: '#00FF88',
      borderDownColor: '#FF4466',
      wickUpColor: '#00FF88',
      wickDownColor: '#FF4466',
    });

    candleSeries.setData(data.map(d => ({
      ...d,
      time: Math.floor(d.time / 1000),
    })));

    if (res.trades && res.trades.length > 0) {
      const markers = res.trades.map((t: any) => ({
        time: Math.floor(t.entryTime / 1000),
        position: t.type === 'long' ? 'belowBar' : 'aboveBar',
        color: t.pnl > 0 ? '#00FF88' : '#FF4466',
        shape: t.type === 'long' ? 'arrowUp' : 'arrowDown',
        text: t.pnl > 0 ? '✅' : '❌',
      }));
      candleSeries.setMarkers(markers);
    }

    chartRef.current = chart;
  };

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.resize(chartContainerRef.current.clientWidth, 400);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setResult(null);
    setMarketData([]);
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    fetchMarketData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExchange, selectedSymbol]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col p-4 gap-4 bg-background">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">🧪 Backtest Studio</h2>
          <Badge variant="default">Live Data</Badge>
          {marketData.length > 0 && (
            <span className="text-xs text-textMuted flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              {marketData.length} candles loaded
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm"><Save size={16} /> Simpan</Button>
          <Button variant="outline" size="sm"><Download size={16} /> Export PDF</Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleRunBacktest} 
            loading={isLoading || isFetching}
            disabled={isFetching}
          >
            <Play size={16} /> {isLoading ? 'Processing...' : isFetching ? 'Fetching...' : 'Run Backtest'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-l-4 border-danger bg-danger/10 p-3">
          <p className="text-danger text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </p>
        </Card>
      )}

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        <div className="col-span-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <select
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:border-primary focus:outline-none"
              >
                {EXCHANGES.map((ex) => (
                  <option key={ex.value} value={ex.value}>{ex.label}</option>
                ))}
              </select>
              <Server className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted w-4 h-4 pointer-events-none" />
            </div>
            <div className="flex-[1.5] relative">
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:border-primary focus:outline-none"
              >
                {SYMBOLS.map((sym) => (
                  <option key={sym} value={sym}>{sym}</option>
                ))}
              </select>
              <Coins className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted w-4 h-4 pointer-events-none" />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchMarketData}
              disabled={isFetching}
              className="px-3"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
            </Button>
          </div>

          <Card className="flex-1 p-0 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={pineCode}
              onChange={(value) => setPineCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                padding: { top: 12 },
                lineNumbers: 'on',
                automaticLayout: true,
              }}
            />
          </Card>
        </div>

        <div className="col-span-5 flex flex-col gap-4">
          <Card className="flex-1 p-0 overflow-hidden relative">
            <div ref={chartContainerRef} className="w-full h-full" />
            {!result && marketData.length === 0 && !isFetching && (
              <div className="absolute inset-0 flex items-center justify-center text-textMuted bg-background/80 backdrop-blur-sm">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-primary/30" />
                  <p>Pilih exchange & aset, lalu klik <span className="text-primary">Run Backtest</span></p>
                  <p className="text-xs mt-1 text-textMuted/60">Data akan diambil otomatis dari exchange via REST API</p>
                </div>
              </div>
            )}
            {isFetching && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center">
                  <RefreshCw className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                  <p className="text-textMuted">Mengambil data dari {selectedExchange}...</p>
                </div>
              </div>
            )}
          </Card>
          <Card className="h-20 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-sm text-textMuted">
                  {selectedSymbol} · <span className="text-white font-mono">{marketData.length > 0 ? marketData[marketData.length-1]?.close?.toFixed(2) : '---'}</span>
                </span>
              </div>
              <div className="h-6 w-px bg-border" />
              <span className="text-xs text-textMuted">{selectedExchange.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-textMuted">
              <span>Sharpe: <span className="text-white">{result?.metrics?.sharpe?.toFixed(2) || '---'}</span></span>
              <span>Max DD: <span className="text-danger">{result?.metrics?.maxDrawdown?.toFixed(2) || '---'}%</span></span>
              <span>Win Rate: <span className="text-success">{result?.metrics?.winRate?.toFixed(1) || '---'}%</span></span>
            </div>
          </Card>
        </div>

        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto">
          <Card>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Settings size={14} /> Risk Config (PropFirm)
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-textMuted">Initial Balance</span><span>$10,000</span></div>
              <div className="flex justify-between"><span className="text-textMuted">Daily DD</span><span className="text-danger">5%</span></div>
              <div className="flex justify-between"><span className="text-textMuted">Max DD</span><span className="text-danger">10%</span></div>
              <div className="flex justify-between"><span className="text-textMuted">Risk/Trade</span><span>2%</span></div>
              <div className="flex justify-between"><span className="text-textMuted">Max Trades/Day</span><span>2</span></div>
            </div>
          </Card>

          {result && (
            <>
              <Card>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Activity size={14} /> Metrics
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-textMuted">Total Return</span>
                    <span className={result.metrics.totalReturn >= 0 ? 'text-success' : 'text-danger'}>
                      {result.metrics.totalReturn.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textMuted">Sharpe Ratio</span>
                    <span>{result.metrics.sharpe.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textMuted">Max Drawdown</span>
                    <span className="text-danger">{result.metrics.maxDrawdown.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textMuted">Win Rate</span>
                    <span>{result.metrics.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textMuted">Profit Factor</span>
                    <span>{result.metrics.profitFactor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textMuted">Total Trades</span>
                    <span>{result.metrics.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textMuted">Avg Win</span>
                    <span className="text-success">${result.metrics.avgWin.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textMuted">Avg Loss</span>
                    <span className="text-danger">${result.metrics.avgLoss.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
              <Card className={`border-l-4 ${result.metrics.sharpe > 1 && result.metrics.winRate > 50 ? 'border-success' : 'border-warning'}`}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className={result.metrics.sharpe > 1 && result.metrics.winRate > 50 ? 'text-success' : 'text-warning'} />
                  <span className={`text-sm font-medium ${result.metrics.sharpe > 1 && result.metrics.winRate > 50 ? 'text-success' : 'text-warning'}`}>
                    {result.metrics.sharpe > 1 && result.metrics.winRate > 50 
                      ? '✅ Layak untuk forward test!' 
                      : '⚠️ Perlu optimasi lebih lanjut'}
                  </span>
                </div>
                <p className="text-xs text-textMuted mt-1">
                  Sharpe &gt; 1.0 dan Win Rate &gt; 50% adalah indikator strategi sehat.
                </p>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
