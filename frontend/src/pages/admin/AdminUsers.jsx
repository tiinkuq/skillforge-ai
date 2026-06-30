import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
    const [filters, setFilters] = useState({ role: '', search: '' });
    const showToast = useToast();

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, filters]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await adminService.getUsers({ ...filters, page: pagination.page });
            setUsers(response.users);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await adminService.updateUserRole(userId, newRole);
            showToast.success('User role updated');
            fetchUsers();
        } catch (error) {
            showToast.error('Failed to update role');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await adminService.deleteUser(userId);
            showToast.success('User deleted');
            fetchUsers();
        } catch (error) {
            showToast.error('Failed to delete user');
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="loader">Loading users...</div></div>;
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>User Management</h2>
                <div className="admin-filters">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                    <select
                        value={filters.role}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    >
                        <option value="">All Roles</option>
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td>
                                    <div className="user-cell">
                                        {user.avatar?.url ? (
                                            <img src={user.avatar.url} alt={user.name} className="user-avatar-small" />
                                        ) : (
                                            <div className="user-avatar-placeholder">
                                                {user.name?.charAt(0) || 'U'}
                                            </div>
                                        )}
                                        <span>{user.name}</span>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                        className="role-select"
                                    >
                                        <option value="student">Student</option>
                                        <option value="instructor">Instructor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        className="btn-danger-small"
                                        onClick={() => handleDeleteUser(user._id)}
                                    >
                                        Delete
                                    </button>
                                </td>
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

export default AdminUsers;