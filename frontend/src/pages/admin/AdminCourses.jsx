import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const AdminCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
    const [filters, setFilters] = useState({ status: 'all', search: '' });
    const showToast = useToast();

    useEffect(() => {
        fetchCourses();
    }, [pagination.page, filters]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await adminService.getCourses({ ...filters, page: pagination.page });
            setCourses(response.courses);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Error fetching courses:', error);
            showToast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        try {
            await adminService.deleteCourse(courseId);
            showToast.success('Course deleted');
            fetchCourses();
        } catch (error) {
            showToast.error('Failed to delete course');
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="loader">Loading courses...</div></div>;
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Course Management</h2>
                <div className="admin-filters">
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="all">All Courses</option>
                        <option value="published">Published</option>
                        <option value="draft">Drafts</option>
                    </select>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Instructor</th>
                            <th>Price</th>
                            <th>Students</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map((course) => (
                            <tr key={course._id}>
                                <td>
                                    <Link to={`/courses/${course._id}`} className="course-link">
                                        {course.title}
                                    </Link>
                                </td>
                                <td>{course.instructor?.name || 'Unknown'}</td>
                                <td>${course.price || 0}</td>
                                <td>{course.numberOfEnrollments || 0}</td>
                                <td>
                                    <span className={`status-badge ${course.isPublished ? 'published' : 'draft'}`}>
                                        {course.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="btn-danger-small"
                                        onClick={() => handleDeleteCourse(course._id)}
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

export default AdminCourses;