import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import BACKEND_URL from './config';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AppliancesPage from './pages/Appliances';
import TariffManagement from './pages/TariffManagement';
import OptimizerPage from './pages/Optimizer';
import UserManagement from './pages/UserManagement';
import EnvironmentPage from './pages/Environment';
import NotificationsPage from './pages/Notifications';
import Complaints from './pages/Complaints';
import FlyersPage from './pages/Flyers';
import AIModels from './pages/AIModels';
import Integrations from './pages/Integrations';

const PAGE_NAMES = {
    '/': 'Dashboard',
    '/appliances': 'Appliances',
    '/tariffs': 'Tariff Management',
    '/optimizer': 'Optimizer Engine',
    '/users': 'Users & Devices',
    '/environment': 'Environment',
    '/notifications': 'Notifications',
    '/complaints': 'Complaints',
    '/flyers': 'Flyers',
    '/ai-models': 'AI Engine',
    '/integrations': 'Integration Hub',
};

function TopBar() {
    const location = useLocation();
    const [clock, setClock] = useState(new Date());
    const [health, setHealth] = useState(null);

    useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const fetchHealth = () =>
            fetch(`${BACKEND_URL}/api/health`).then(r => r.json()).then(setHealth).catch(() => setHealth(null));
        fetchHealth();
        const t = setInterval(fetchHealth, 15000);
        return () => clearInterval(t);
    }, []);

    const currentPage = PAGE_NAMES[location.pathname] || 'Admin';
    const uptime = health?.uptime
        ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`
        : '—';

    return (
        <div className="admin-topbar">
            <div className="topbar-left">
                <span className="topbar-breadcrumb">
                    Admin / <strong style={{ color: '#1a2332' }}>{currentPage}</strong>
                </span>
            </div>
            <div className="topbar-right">
                <div className={`topbar-status ${health ? 'online' : ''}`}>
                    <span className="dot" />
                    {health ? 'All Systems Operational' : 'Checking…'}
                </div>
                <div className="topbar-pill">
                    ⏱ Uptime: {uptime}
                </div>
                <div className="topbar-pill" style={{ background: '#f0fdf4', color: '#16a34a', borderColor: 'rgba(22,163,106,0.15)' }}>
                    🟢 {health?.users?.toLocaleString() || '—'} Users
                </div>
                <div className="topbar-clock">
                    {clock.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    &nbsp;&nbsp;
                    {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter basename="/">
            <div className="app-layout">
                <Sidebar />
                <TopBar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/appliances" element={<AppliancesPage />} />
                        <Route path="/tariffs" element={<TariffManagement />} />
                        <Route path="/optimizer" element={<OptimizerPage />} />
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="/environment" element={<EnvironmentPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/complaints" element={<Complaints />} />
                        <Route path="/flyers" element={<FlyersPage />} />
                        <Route path="/ai-models" element={<AIModels />} />
                        <Route path="/integrations" element={<Integrations />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}
