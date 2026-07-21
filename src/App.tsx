import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, BarChart3, FileText, Settings, Zap } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Backtest from './pages/Backtest';

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-white/5 flex items-center px-6 justify-between">
      <div className="flex items-center gap-2">
        <Zap className="text-primary w-6 h-6" />
        <span className="font-bold text-lg bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
          Backtester Pro
        </span>
        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">Beta</span>
      </div>
      <div className="flex items-center gap-6 text-textMuted">
        <Link to="/" className="flex items-center gap-1.5 hover:text-white transition-colors">
          <LayoutDashboard size={18} /> Dashboard
        </Link>
        <Link to="/backtest" className="flex items-center gap-1.5 hover:text-white transition-colors text-white">
          <BarChart3 size={18} /> Backtest
        </Link>
        <Link to="/reports" className="flex items-center gap-1.5 hover:text-white transition-colors">
          <FileText size={18} /> Reports
        </Link>
        <div className="w-px h-6 bg-border" />
        <button className="hover:text-white transition-colors">
          <Settings size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-success flex items-center justify-center text-black font-bold text-sm">
          T
        </div>
      </div>
    </nav>
  );
}

function Layout() {
  return (
    <div className="min-h-screen pt-16">
      <Navbar />
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/backtest" element={<Backtest />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}