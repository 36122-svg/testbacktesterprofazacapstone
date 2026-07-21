import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BarChart3, TrendingUp, TrendingDown, Activity, Zap, Clock, ArrowRight } from 'lucide-react';

const dummyStrategies = [
  { name: 'SMA Crossover (10,30)', return: '+156%', sharpe: 1.12, winRate: '58%', updated: '2 hours ago' },
  { name: 'RSI Mean Reversion', return: '+89%', sharpe: 0.95, winRate: '52%', updated: '5 hours ago' },
  { name: 'Bollinger Squeeze', return: '+210%', sharpe: 1.45, winRate: '63%', updated: '1 day ago' },
];

export default function Dashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-textMuted mt-1">Selamat datang kembali! Siap menguji strategi barumu?</p>
        </div>
        <Button variant="primary" className="gap-2">
          <Zap size={18} /> Backtest Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-success/10 rounded-xl"><TrendingUp className="text-success w-6 h-6" /></div>
          <div><p className="text-textMuted text-sm">Total Strategi</p><p className="text-2xl font-bold">12</p></div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl"><BarChart3 className="text-primary w-6 h-6" /></div>
          <div><p className="text-textMuted text-sm">Backtest Bulan Ini</p><p className="text-2xl font-bold">47</p></div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-warning/10 rounded-xl"><Activity className="text-warning w-6 h-6" /></div>
          <div><p className="text-textMuted text-sm">Best Sharpe</p><p className="text-2xl font-bold">1.45</p></div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-danger/10 rounded-xl"><TrendingDown className="text-danger w-6 h-6" /></div>
          <div><p className="text-textMuted text-sm">Avg Max DD</p><p className="text-2xl font-bold">-12.3%</p></div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border border-white/5">
        <div className="p-5 border-b border-white/5 flex justify-between items-center">
          <h2 className="font-semibold">Strategi Terbaru</h2>
          <Button variant="ghost" size="sm">Lihat Semua <ArrowRight size={16} /></Button>
        </div>
        <div>
          {dummyStrategies.map((s, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
              <div>
                <p className="font-medium">{s.name}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-textMuted">
                  <span className="flex items-center gap-1"><Clock size={14} /> {s.updated}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right"><p className="text-sm text-textMuted">Return</p><p className="text-success font-bold">{s.return}</p></div>
                <div className="text-right"><p className="text-sm text-textMuted">Sharpe</p><p className="font-bold">{s.sharpe}</p></div>
                <div className="text-right"><p className="text-sm text-textMuted">Win Rate</p><p>{s.winRate}</p></div>
                <Button variant="outline" size="sm">Detail</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}