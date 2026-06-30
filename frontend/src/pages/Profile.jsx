import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        bio: user?.bio || ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await updateProfile(formData);
        setLoading(false);
    };

    return (
        <div className="profile-page">
            <motion.div 
                className="profile-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="profile-header">
                    <div className="profile-avatar">
                        {user?.avatar?.url ? (
                            <img src={user.avatar.url} alt={user.name} />
                        ) : (
                            <div className="avatar-large">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>
                    <div className="profile-title">
                        <h1>{user?.name}</h1>
                        <p className="profile-role">{user?.role || 'Student'}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email (Cannot be changed)</label>
                        <input
                            type="email"
                            id="email"
                            value={user?.email || ''}
                            disabled
                            className="disabled-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio">Bio</label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell us about yourself"
                            rows={4}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Profile;