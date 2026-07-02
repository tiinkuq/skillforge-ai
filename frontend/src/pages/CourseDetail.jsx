import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import { chatService } from '../services/chatService';
import { useToast } from '../context/ToastContext';
import AITutor from '../components/ai/AITutor';
import Reviews from '../components/reviews/Reviews';

const CourseDetail = () => {
    const { id } = useParams();
    console.log('🆔 Course ID from URL:', id);
    const navigate = useNavigate();
    const { user, isAuthenticated, refreshUser } = useAuth();
    const showToast = useToast();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeModule, setActiveModule] = useState(-1);
    const [activeLesson, setActiveLesson] = useState(0);

    const isInstructor = isAuthenticated && user && course && course.instructor && 
        (user.id === course.instructor._id || 
         user._id === course.instructor._id || 
         user.email === course.instructor.email);

    useEffect(() => {
        if (id) {
            fetchCourse();
        } else {
            console.error('❌ No course ID provided');
            navigate('/courses');
        }
    }, [id]);

    useEffect(() => {
        if (user && course) {
            const isUserEnrolled = user.enrolledCourses?.some(
                e => e.course === course._id || e.course?._id === course._id
            );
            const isInCourseStudents = course.enrolledStudents?.some(
                student => student._id === user.id || student._id === user._id
            );
            
            if (isUserEnrolled || isInCourseStudents) {
                if (!isEnrolled) {
                    console.log('🔄 Force updating isEnrolled to true');
                    setIsEnrolled(true);
                }
            }
        }
    }, [user, course]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            console.log('📤 Fetching course with ID:', id);
            const response = await courseService.getCourse(id);
            console.log('📚 Course Data:', response);
            
            if (!response.success || !response.course) {
                console.error('❌ Course not found');
                showToast.error('Course not found');
                navigate('/courses');
                return;
            }
            
            setCourse(response.course);
            
            let enrolled = response.isEnrolled || false;
            
            if (isAuthenticated && user && response.course?.enrolledStudents) {
                const userIsEnrolled = response.course.enrolledStudents.some(
                    student => student._id === user.id || student._id === user._id
                );
                if (userIsEnrolled) {
                    enrolled = true;
                    console.log('✅ User found in enrolledStudents, setting isEnrolled to true');
                }
            }
            
            if (isAuthenticated && user?.enrolledCourses) {
                const userHasEnrolled = user.enrolledCourses.some(
                    e => e.course === response.course._id || e.course?._id === response.course._id
                );
                if (userHasEnrolled) {
                    enrolled = true;
                    console.log('✅ User has course in enrolledCourses, setting isEnrolled to true');
                }
            }
            
            console.log('✅ Final isEnrolled:', enrolled);
            setIsEnrolled(enrolled);
            setProgress(response.progress || 0);
        } catch (error) {
            console.error('❌ Error fetching course:', error);
            showToast.error('Failed to load course');
            navigate('/courses');
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            showToast.error('Please login to enroll');
            navigate('/login');
            return;
        }

        if (isEnrolled) {
            console.log('✅ Already enrolled, redirecting to learn page');
            navigate(`/learn/${course._id}`);
            return;
        }

        setEnrolling(true);
        try {
            console.log('📤 Sending enroll request for course:', id);
            const response = await courseService.enrollCourse(id);
            console.log('📥 Enroll Response:', response);
            
            if (response.success) {
                setIsEnrolled(true);
                setProgress(0);
                showToast.success('🎉 Successfully enrolled in course!');
                
                console.log('🔄 Refreshing user data...');
                const updatedUser = await refreshUser();
                console.log('✅ User refreshed:', updatedUser);
                
                await fetchCourse();
                
                setTimeout(() => {
                    window.location.href = `/courses/${id}`;
                }, 1000);
            }
        } catch (error) {
            console.error('❌ Enrollment error:', error);
            
            if (error.response?.data?.message?.includes('already enrolled')) {
                console.log('ℹ️ User is already enrolled - updating state');
                setIsEnrolled(true);
                showToast.info('You are already enrolled in this course');
                await refreshUser();
                await fetchCourse();
            } else {
                showToast.error(error.response?.data?.message || 'Failed to enroll');
            }
        } finally {
            setEnrolling(false);
        }
    };

    const handleStartChat = async () => {
        try {
            if (!isAuthenticated) {
                showToast.error('Please login to send messages');
                navigate('/login');
                return;
            }

            if (!course.instructor?._id) {
                showToast.error('Instructor not found');
                return;
            }

            if (user.id === course.instructor._id) {
                showToast.info('You cannot chat with yourself');
                return;
            }

            console.log('💬 Starting chat with instructor:', course.instructor._id);
            
            const response = await chatService.createChat({
                recipientId: course.instructor._id,
                courseId: course._id
            });

            console.log('📩 Chat response:', response);

            if (response.success && response.chat) {
                navigate(`/chat/${response.chat._id}`);
            } else {
                showToast.error('Failed to start chat');
            }
        } catch (error) {
            console.error('Start chat error:', error);
            showToast.error(error.response?.data?.message || 'Failed to start chat');
        }
    };

    const handleTogglePublish = async () => {
        try {
            const response = await courseService.updateCourse(course._id, {
                isPublished: !course.isPublished
            });
            if (response.success) {
                await fetchCourse();
                showToast.success(
                    response.course.isPublished 
                        ? '🎉 Course published successfully!' 
                        : '📌 Course unpublished'
                );
            }
        } catch (error) {
            console.error('Publish error:', error);
            showToast.error(error.response?.data?.message || 'Failed to update publish status');
        }
    };

    const handleDeleteCourse = async () => {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await courseService.deleteCourse(course._id);
            if (response.success) {
                showToast.success('Course deleted successfully');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast.error(error.response?.data?.message || 'Failed to delete course');
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="loader">Loading course...</div></div>;
    }

    if (!course) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>Course not found</h3>
                <p>The course you're looking for doesn't exist</p>
                <Link to="/courses" className="btn-primary">Browse Courses</Link>
            </div>
        );
    }

    return (
        <div className="course-detail-page" suppressHydrationWarning>
            <div className="course-hero" suppressHydrationWarning>
                <div className="course-hero-content" suppressHydrationWarning>
                    <div className="course-hero-left" suppressHydrationWarning>
                        <div className="course-breadcrumb" suppressHydrationWarning>
                            <Link to="/courses">Courses</Link>
                            <span> / </span>
                            <span>{course.category}</span>
                        </div>
                        <h1 suppressHydrationWarning>{course.title}</h1>
                        {course.subtitle && <p className="course-subtitle" suppressHydrationWarning>{course.subtitle}</p>}
                        <div className="course-meta-details" suppressHydrationWarning>
                            <span className="course-level">{course.level}</span>
                            <span className="course-duration">
                                ⏱️ {course.totalDuration || 0} min
                            </span>
                            <span className="course-lessons">
                                📚 {course.totalLessons || 0} lessons
                            </span>
                            {course.isPublished ? (
                                <span className="badge-published">✅ Published</span>
                            ) : (
                                <span className="badge-draft">📝 Draft</span>
                            )}
                        </div>
                        <div className="course-instructor" suppressHydrationWarning>
                            <span>👨‍🏫 Instructor: </span>
                            <Link to={`/instructor/${course.instructor?._id}`}>
                                {course.instructor?.name || 'Unknown'}
                            </Link>
                            
                            {isAuthenticated && !isInstructor && course.instructor?._id && (
                                <button 
                                    onClick={handleStartChat}
                                    className="btn-chat"
                                    style={{
                                        marginLeft: '1rem',
                                        padding: '0.3rem 1rem',
                                        background: '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#4338ca';
                                        e.target.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = '#4f46e5';
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                >
                                    💬 Message
                                </button>
                            )}
                        </div>
                        <div className="course-rating" suppressHydrationWarning>
                            <span>⭐ {course.rating?.toFixed(1) || '0.0'}</span>
                            <span>({course.numberOfReviews || 0} reviews)</span>
                            <span className="students-count">
                                👥 {course.numberOfEnrollments || 0} students
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;
