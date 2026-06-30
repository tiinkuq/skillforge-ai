import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
    const [filters, setFilters] = useState({ status: '' });
    const showToast = useToast();

    useEffect(() => {
        fetchOrders();
    }, [pagination.page, filters]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await adminService.getOrders({ ...filters, page: pagination.page });
            setOrders(response.orders);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error fetching orders:', error);
            showToast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="loader">Loading orders...</div></div>;
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Orders Management</h2>
                <div className="admin-filters">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Student</th>
                            <th>Course</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order._id}>
                                <td>#{order._id.slice(-6)}</td>
                                <td>{order.student?.name || 'Unknown'}</td>
                                <td>{order.course?.title || 'Unknown'}</td>
                                <td>${order.amount || 0}</td>
                                <td>
                                    <span className={`status-badge ${order.paymentStatus}`}>
                                        {order.paymentStatus || 'pending'}
                                    </span>
                                </td>
                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination.pages > 1 && (
                <div className="pagination">
                    <button onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })} disabled={pagination.page === 1}>
                        Previous
                    </button>
                    <span>Page {pagination.page} of {pagination.pages}</span>
                    <button onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })} disabled={pagination.page === pagination.pages}>
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;