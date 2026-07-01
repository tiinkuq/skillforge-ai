import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url }) => {
    const siteTitle = 'SkillForge AI - AI-Powered Learning Platform';
    const siteDescription = 'Learn with AI-powered courses, real-time chat, and personalized tutoring.';
    const siteUrl = 'https://skillforge-ai-platform-sigma.vercel.app';

    return (
        <Helmet>
            <title>{title ? `${title} | SkillForge AI` : siteTitle}</title>
            <meta name="description" content={description || siteDescription} />
            <meta name="keywords" content={keywords || 'AI, Learning, Courses, Education, Online Learning'} />
            
            {/* Open Graph */}
            <meta property="og:title" content={title || siteTitle} />
            <meta property="og:description" content={description || siteDescription} />
            <meta property="og:image" content={image || '/og-image.png'} />
            <meta property="og:url" content={url || siteUrl} />
            <meta property="og:type" content="website" />
            
            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title || siteTitle} />
            <meta name="twitter:description" content={description || siteDescription} />
            <meta name="twitter:image" content={image || '/og-image.png'} />
            
            <link rel="canonical" href={url || siteUrl} />
        </Helmet>
    );
};

export default SEO;