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

    // Check if current user is the instructor
    const isInstructor = isAuthenticated && user && course && course.instructor && 
        (user.id === course.instructor._id || 
         user._id === course.instructor._id || 
         user.email === course.instructor.email);

    useEffect(() => {
        fetchCourse();
    }, [id]);

    // Force check enrollment status when user or course changes
    useEffect(() => {
        if (user && course) {
            // Check if user is enrolled in this course
            const isUserEnrolled = user.enrolledCourses?.some(
                e => e.course === course._id || e.course?._id === course._id
            );
            
            // Also check in course's enrolledStudents
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
            const response = await courseService.getCourse(id);
            console.log('📚 Course Data:', response);
            
            setCourse(response.course);
            
            // CRITICAL FIX: Check enrollment from multiple sources
            let enrolled = response.isEnrolled || false;
            
            // Also check if user is in the enrolledStudents array
            if (isAuthenticated && user && response.course?.enrolledStudents) {
                const userIsEnrolled = response.course.enrolledStudents.some(
                    student => student._id === user.id || student._id === user._id
                );
                if (userIsEnrolled) {
                    enrolled = true;
                    console.log('✅ User found in enrolledStudents, setting isEnrolled to true');
                }
            }
            
            // Also check in user's enrolledCourses
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
            console.error('Error fetching course:', error);
            showToast.error('Failed to load course');
            navigate('/courses');
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        console.log('🎯 Enroll clicked - Current state:', { isEnrolled, isAuthenticated });

        if (!isAuthenticated) {
            showToast.error('Please login to enroll');
            navigate('/login');
            return;
        }

        // If already enrolled, redirect to learning page
        if (isEnrolled) {
            console.log('✅ Already enrolled, redirecting to learn page');
            navigate(`/learn/${course._id}`);
            return;
        }

        setEnrolling(true);
        try {
            console.log('📤 Sending enroll request...');
            const response = await courseService.enrollCourse(id);
            console.log('📥 Enroll Response:', response);
            
            if (response.success) {
                // CRITICAL FIX: Force update states immediately
                setIsEnrolled(true);
                setProgress(0);
                
                // Show success message
                showToast.success('🎉 Successfully enrolled in course!');
                
                // Refresh user data to update enrolledCourses
                console.log('🔄 Refreshing user data...');
                const updatedUser = await refreshUser();
                console.log('✅ User refreshed:', updatedUser);
                
                // Force fetch course data again
                await fetchCourse();
                
                // Double-check and force state update
                if (updatedUser?.enrolledCourses) {
                    const isNowEnrolled = updatedUser.enrolledCourses.some(
                        e => e.course === course._id || e.course?._id === course._id
                    );
                    if (isNowEnrolled) {
                        console.log('✅ Enrollment confirmed in refreshed user data');
                        setIsEnrolled(true);
                    }
                }
                
                // Reload page after a moment to ensure all states are fresh
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } catch (error) {
            console.error('❌ Enrollment error:', error);
            
            // Check if already enrolled
            if (error.response?.data?.message?.includes('already enrolled')) {
                console.log('ℹ️ User is already enrolled - updating state');
                setIsEnrolled(true);
                showToast.info('You are already enrolled in this course');
                
                // Refresh user data and course data
                await refreshUser();
                await fetchCourse();
                
                // Reload page to show updated state
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast.error(error.response?.data?.message || 'Failed to enroll');
            }
        } finally {
            setEnrolling(false);
            console.log('🏁 Enrollment process complete, isEnrolled:', isEnrolled);
        }
    };

    // Start chat with instructor
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
        return (
            <div className="loading-container">
                <div className="loader">Loading course...</div>
            </div>
        );
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
        <div className="course-detail-page">
            <div className="course-hero">
                <div className="course-hero-content">
                    <div className="course-hero-left">
                        <div className="course-breadcrumb">
                            <Link to="/courses">Courses</Link>
                            <span> / </span>
                            <span>{course.category}</span>
                        </div>
                        <h1>{course.title}</h1>
                        {course.subtitle && <p className="course-subtitle">{course.subtitle}</p>}
                        <div className="course-meta-details">
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
                        <div className="course-instructor">
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
                        <div className="course-rating">
                            <span>⭐ {course.rating?.toFixed(1) || '0.0'}</span>
                            <span>({course.numberOfReviews || 0} reviews)</span>
                            <span className="students-count">
                                👥 {course.numberOfEnrollments || 0} students
                            </span>
                        </div>
                    </div>

                    <div className="course-hero-right">
                        <div className="course-price-card">
                            {isInstructor ? (
                                <div className="instructor-view">
                                    <div className="instructor-badge">👨‍🏫 You are the instructor</div>
                                    <p style={{ color: '#4a5568', marginTop: '0.5rem' }}>
                                        You created this course. Students will see the price and enroll options.
                                    </p>
                                    <div className="course-stats-instructor">
                                        <div className="stat-item">
                                            <span className="stat-value">{course.numberOfEnrollments || 0}</span>
                                            <span className="stat-label">Students</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">{course.rating?.toFixed(1) || '0.0'}⭐</span>
                                            <span className="stat-label">Rating</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">{course.isPublished ? '✅' : '📝'}</span>
                                            <span className="stat-label">Status</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="price">
                                        {course.price === 0 ? (
                                            <span className="free">Free</span>
                                        ) : (
                                            <span>${course.price}</span>
                                        )}
                                    </div>
                                    
                                    {isEnrolled ? (
                                        <div className="enrolled-status">
                                            <div className="progress-section">
                                                <p>Your Progress</p>
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <span className="progress-text">{progress}%</span>
                                            </div>
                                            <Link to={`/learn/${course._id}`} className="btn-primary btn-full">
                                                📖 Continue Learning
                                            </Link>
                                        </div>
                                    ) : (
                                        <>
                                            <button 
                                                className="btn-primary btn-full"
                                                onClick={handleEnroll}
                                                disabled={enrolling || !course.isPublished}
                                            >
                                                {enrolling ? '⏳ Enrolling...' : '🎯 Enroll Now'}
                                            </button>
                                            {!course.isPublished && (
                                                <p style={{ 
                                                    color: '#e53e3e', 
                                                    fontSize: '0.9rem', 
                                                    marginTop: '0.5rem',
                                                    textAlign: 'center'
                                                }}>
                                                    ⚠️ This course is not published yet
                                                </p>
                                            )}
                                        </>
                                    )}
                                    
                                    <div className="course-features">
                                        <div className="feature">
                                            <span>✅</span>
                                            <span>Lifetime access</span>
                                        </div>
                                        <div className="feature">
                                            <span>📱</span>
                                            <span>Mobile friendly</span>
                                        </div>
                                        <div className="feature">
                                            <span>🎓</span>
                                            <span>Certificate of completion</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {isAuthenticated && !isInstructor && course.instructor?._id && (
                                <button 
                                    onClick={handleStartChat}
                                    className="btn-chat-primary"
                                    style={{
                                        width: '100%',
                                        marginTop: '1rem',
                                        padding: '0.75rem',
                                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        transition: 'all 0.3s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.3)';
                                    }}
                                >
                                    💬 Message Instructor
                                </button>
                            )}

                            {isInstructor && (
                                <div className="instructor-controls" style={{ marginTop: '1rem' }}>
                                    <button 
                                        className={`btn-${course.isPublished ? 'secondary' : 'primary'}`}
                                        onClick={handleTogglePublish}
                                        style={{ width: '100%' }}
                                    >
                                        {course.isPublished ? '📌 Unpublish Course' : '🚀 Publish Course'}
                                    </button>
                                    <button 
                                        className="btn-secondary"
                                        onClick={() => navigate(`/edit-course/${course._id}`)}
                                        style={{ width: '100%', marginTop: '0.5rem' }}
                                    >
                                        ✏️ Edit Course
                                    </button>
                                    <button 
                                        className="btn-danger"
                                        onClick={handleDeleteCourse}
                                        style={{ width: '100%', marginTop: '0.5rem' }}
                                    >
                                        🗑️ Delete Course
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Content */}
            <div className="course-content">
                <div className="course-content-grid">
                    <div className="course-main">
                        <section className="course-section">
                            <h2>Description</h2>
                            <p className="course-description-full">{course.description}</p>
                        </section>

                        {course.learningObjectives?.length > 0 && (
                            <section className="course-section">
                                <h2>What You'll Learn</h2>
                                <ul className="objectives-list">
                                    {course.learningObjectives.map((obj, index) => (
                                        <li key={index}>✅ {obj}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {course.requirements?.length > 0 && (
                            <section className="course-section">
                                <h2>Requirements</h2>
                                <ul className="requirements-list">
                                    {course.requirements.map((req, index) => (
                                        <li key={index}>📌 {req}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        <section className="course-section">
                            <h2>Course Content</h2>
                            <div className="modules-list">
                                {course.modules?.length > 0 ? (
                                    course.modules.map((module, moduleIndex) => (
                                        <motion.div 
                                            key={moduleIndex}
                                            className="module-item"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: moduleIndex * 0.1 }}
                                        >
                                            <div 
                                                className="module-header"
                                                onClick={() => setActiveModule(activeModule === moduleIndex ? -1 : moduleIndex)}
                                            >
                                                <div className="module-title">
                                                    <span className="module-number">Module {moduleIndex + 1}</span>
                                                    <h3>{module.title}</h3>
                                                </div>
                                                <span className="module-toggle">
                                                    {activeModule === moduleIndex ? '−' : '+'}
                                                </span>
                                            </div>
                                            {activeModule === moduleIndex && (
                                                <div className="lessons-list">
                                                    {module.lessons?.map((lesson, lessonIndex) => (
                                                        <div 
                                                            key={lessonIndex}
                                                            className={`lesson-item ${lesson.isFree || isEnrolled ? '' : 'locked'}`}
                                                            onClick={() => {
                                                                if (lesson.isFree || isEnrolled) {
                                                                    setActiveLesson(lessonIndex);
                                                                    showToast.info(`Opening lesson: ${lesson.title}`);
                                                                } else {
                                                                    showToast.info('Enroll to access this lesson');
                                                                }
                                                            }}
                                                        >
                                                            <span className="lesson-icon">
                                                                {lesson.isFree ? '🔓' : isEnrolled ? '▶️' : '🔒'}
                                                            </span>
                                                            <span className="lesson-title">{lesson.title}</span>
                                                            <span className="lesson-duration">
                                                                {lesson.duration || 0} min
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                ) : (
                                    <p className="no-content">No modules yet. Check back later!</p>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="course-sidebar">
                        <div className="sidebar-card">
                            <h4>About the Instructor</h4>
                            <div className="instructor-profile">
                                {course.instructor?.avatar?.url ? (
                                    <img 
                                        src={course.instructor.avatar.url} 
                                        alt={course.instructor.name}
                                        className="instructor-avatar"
                                    />
                                ) : (
                                    <div className="instructor-avatar-placeholder">
                                        {course.instructor?.name?.charAt(0) || 'I'}
                                    </div>
                                )}
                                <div className="instructor-info">
                                    <h5>{course.instructor?.name || 'Unknown'}</h5>
                                    <p className="instructor-role">Instructor</p>
                                </div>
                            </div>
                            {course.instructor?.bio && (
                                <p className="instructor-bio">{course.instructor.bio}</p>
                            )}
                        </div>

                        <div className="sidebar-card">
                            <h4>Course Details</h4>
                            <ul className="course-details-list">
                                <li>
                                    <span>Category:</span>
                                    <span>{course.category}</span>
                                </li>
                                <li>
                                    <span>Level:</span>
                                    <span>{course.level}</span>
                                </li>
                                <li>
                                    <span>Language:</span>
                                    <span>{course.language}</span>
                                </li>
                                <li>
                                    <span>Status:</span>
                                    <span>{course.isPublished ? '✅ Published' : '📝 Draft'}</span>
                                </li>
                                <li>
                                    <span>Last Updated:</span>
                                    <span>{new Date(course.updatedAt).toLocaleDateString()}</span>
                                </li>
                            </ul>
                        </div>

                        {course.tags?.length > 0 && (
                            <div className="sidebar-card">
                                <h4>Tags</h4>
                                <div className="tags-container">
                                    {course.tags.map((tag, index) => (
                                        <span key={index} className="tag">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="reviews-section-container">
                <div className="reviews-header">
                    <h2>Student Reviews</h2>
                </div>
                <Reviews courseId={course._id} courseInstructorId={course.instructor?._id} />
            </div>

            <AITutor courseId={course._id} courseTitle={course.title} />
        </div>
    );
};

export default CourseDetail;