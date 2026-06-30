import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

const AdminRevenue = () => {
    const [revenueData, setRevenueData] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    const showToast = useToast();

    useEffect(() => {
        fetchRevenue();
    }, [period]);

    const fetchRevenue = async () => {
        try {
            setLoading(true);
            const response = await adminService.getRevenueAnalytics(period);
            setRevenueData(response.revenueByPeriod);
            setTotalRevenue(response.totalRevenue);
        } catch (error) {
            console.error('Error fetching revenue:', error);
            showToast.error('Failed to load revenue data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="loader">Loading revenue data...</div></div>;
    }

    // Format data for charts
    const chartData = revenueData.map(item => ({
        name: period === 'month' ? `Day ${item._id.day}` : `Month ${item._id.month}`,
        revenue: item.total,
        orders: item.count
    }));

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Revenue Analytics</h2>
                <div className="admin-filters">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                    >
                        <option value="month">Monthly</option>
                        <option value="year">Yearly</option>
                    </select>
                </div>
            </div>

            <div className="admin-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon revenue">💰</div>
                    <div className="stat-info">
                        <h3>${totalRevenue?.toFixed(2) || '0.00'}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orders">🛒</div>
                    <div className="stat-info">
                        <h3>{revenueData.reduce((acc, item) => acc + item.count, 0)}</h3>
                        <p>Total Orders</p>
                    </div>
                </div>
            </div>

            <div className="admin-chart-card">
                <h3>Revenue by {period === 'month' ? 'Day' : 'Month'}</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="#4f46e5" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="admin-chart-card">
                <h3>Orders by {period === 'month' ? 'Day' : 'Month'}</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AdminRevenue;