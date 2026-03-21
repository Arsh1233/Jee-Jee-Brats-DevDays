import { NavLink } from 'react-router-dom';

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="icon">⚡</div>
                <div>
                    <h1>PowerPilot</h1>
                    <span>Admin Portal</span>
                </div>
            </div>
            <nav>
                <ul className="sidebar-nav">
                    {/* ── Overview ── */}
                    <li className="nav-section-label">Overview</li>
                    <li>
                        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
                            <span className="nav-icon">📊</span>
                            <span>Dashboard</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/environment" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">🌳</span>
                            <span>Environment</span>
                        </NavLink>
                    </li>

                    {/* ── Operations ── */}
                    <li className="nav-section-label">Operations</li>
                    <li>
                        <NavLink to="/tariffs" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">💰</span>
                            <span>Tariff Management</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/optimizer" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">🤖</span>
                            <span>Optimizer</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/ai-models" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">🧠</span>
                            <span>AI Engine</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/appliances" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">🔌</span>
                            <span>Appliances</span>
                        </NavLink>
                    </li>

                    {/* ── Management ── */}
                    <li className="nav-section-label">Management</li>
                    <li>
                        <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">👥</span>
                            <span>Users & Devices</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/complaints" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">📋</span>
                            <span>Complaints</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/notifications" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">🔔</span>
                            <span>Notifications</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/flyers" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">📢</span>
                            <span>Flyers</span>
                        </NavLink>
                    </li>

                    {/* ── Platform ── */}
                    <li className="nav-section-label">Platform</li>
                    <li>
                        <NavLink to="/integrations" className={({ isActive }) => isActive ? 'active' : ''}>
                            <span className="nav-icon">🔗</span>
                            <span>Integrations</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>

            {/* Admin profile at bottom */}
            <div className="sidebar-footer">
                <div className="admin-avatar">A</div>
                <div className="admin-info">
                    <div className="admin-name">Admin</div>
                    <div className="admin-role">Super Administrator</div>
                </div>
                <span className="online-dot" title="Online"></span>
            </div>
        </aside>
    );
}
