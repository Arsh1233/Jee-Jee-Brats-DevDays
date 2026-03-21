export default function StatCard({ icon, iconClass, value, label }) {
    return (
        <div className="stat-card animate-in">
            <div className={`stat-icon ${iconClass || ''}`}>{icon}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
}
