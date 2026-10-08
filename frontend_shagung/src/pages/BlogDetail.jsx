import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
    Calendar, Clock, Eye, ChevronLeft, Share2, Heart,
    Facebook, Twitter, Linkedin, Copy, Check, Tag,
    ArrowRight, Play, BookOpen, User
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../api/client';

// =============================================================================
// BLOG DETAIL PAGE - Immersive Reading Experience
// =============================================================================

export default function BlogDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [liked, setLiked] = useState(false);

    useEffect(() => {
        const fetchBlog = async () => {
            setLoading(true);
            try {
                const response = await api.blogDetail(slug);
                if (response.success) {
                    setBlog(response.blog);
                } else {
                    navigate('/blogs');
                }
            } catch (error) {
                console.error('Failed to fetch blog:', error);
                navigate('/blogs');
            } finally {
                setLoading(false);
            }
        };
        fetchBlog();
    }, [slug, navigate]);

    const handleShare = async (platform) => {
        const url = window.location.href;
        const title = blog?.title || 'Blog Post';

        switch (platform) {
            case 'copy':
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
                break;
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <main className="min-h-screen bg-gray-50 pt-24">
                    <div className="max-w-4xl mx-auto px-4 py-12">
                        {/* Skeleton */}
                        <div className="space-y-6">
                            <div className="skeleton h-8 w-32" />
                            <div className="skeleton h-16 w-full" />
                            <div className="skeleton h-6 w-2/3" />
                            <div className="skeleton aspect-video rounded-2xl" />
                            <div className="space-y-4">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="skeleton h-4 w-full" />
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    if (!blog) {
        return null;
    }

    const categoryColor = blog.category?.color || '#f43f5e';

    return (
        <>
            <Helmet>
                <title>{blog.meta_title || blog.title} - Shagun Gallery Blog</title>
                <meta name="description" content={blog.meta_description || blog.excerpt} />
                <meta property="og:title" content={blog.title} />
                <meta property="og:description" content={blog.excerpt} />
                <meta property="og:image" content={blog.featured_image} />
                <meta property="og:type" content="article" />
            </Helmet>

            <Header />

            <main className="min-h-screen">
                {/* Hero Section */}
                <section
                    className="relative pt-24 pb-32 overflow-hidden"
                    style={{
                        background: blog.gradient
                            ? `linear-gradient(135deg, ${blog.gradient})`
                            : blog.background_color
                                ? blog.background_color
                                : 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)'
                    }}
                >
                    {/* Background Image */}
                    {blog.background_image && (
                        <div className="absolute inset-0">
                            <img
                                src={blog.background_image}
                                alt=""
                                className="w-full h-full object-cover opacity-20"
                            />
                        </div>
                    )}

                    <div className="relative max-w-4xl mx-auto px-4">
                        {/* Back Button */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-8"
                        >
                            <Link
                                to="/blogs"
                                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Back to Blog
                            </Link>
                        </motion.div>

                        {/* Category */}
                        {blog.category && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Link
                                    to={`/blogs?category=${blog.category.id}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium backdrop-blur-md transition-transform hover:scale-105"
                                    style={{ backgroundColor: `${categoryColor}cc` }}
                                >
                                    {blog.category.icon} {blog.category.name}
                                </Link>
                            </motion.div>
                        )}

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mt-6 mb-6 leading-tight"
                        >
                            {blog.title}
                        </motion.h1>

                        {/* Excerpt */}
                        {blog.excerpt && (
                            <motion.p
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-xl text-white/80 mb-8 max-w-3xl"
                            >
                                {blog.excerpt}
                            </motion.p>
                        )}

                        {/* Meta */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-wrap items-center gap-6 text-white/70"
                        >
                            {blog.author && (
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-medium">{blog.author.name}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(blog.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {blog.reading_time} min read
                            </div>
                            <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {blog.views?.toLocaleString() || 0} views
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Featured Image / Video */}
                <section className="relative -mt-20 mb-12 px-4">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="relative rounded-3xl overflow-hidden shadow-2xl"
                        >
                            {blog.video_url ? (
                                <video
                                    src={blog.video_url}
                                    controls
                                    poster={blog.featured_image}
                                    className="w-full aspect-video object-cover"
                                />
                            ) : blog.featured_image ? (
                                <img
                                    src={blog.featured_image}
                                    alt={blog.title}
                                    className="w-full aspect-video object-cover"
                                />
                            ) : null}
                        </motion.div>
                    </div>
                </section>

                {/* Content */}
                <section className="py-12 px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-8">
                            {/* Share Sidebar (Desktop) */}
                            <aside className="hidden lg:block">
                                <div className="sticky top-32 flex flex-col gap-3">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Share</span>
                                    <button
                                        onClick={() => handleShare('facebook')}
                                        className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
                                    >
                                        <Facebook className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleShare('twitter')}
                                        className="w-12 h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
                                    >
                                        <Twitter className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleShare('linkedin')}
                                        className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
                                    >
                                        <Linkedin className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleShare('copy')}
                                        className="w-12 h-12 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                    >
                                        {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                    <hr className="my-2" />
                                    <button
                                        onClick={() => setLiked(!liked)}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${liked
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                                    </button>
                                </div>
                            </aside>

                            {/* Main Content */}
                            <article className="flex-1">
                                {/* Tags */}
                                {blog.tags && blog.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {blog.tags.map(tag => (
                                            <span
                                                key={tag.id}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                                            >
                                                <Tag className="w-3 h-3" />
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Blog Content */}
                                <div
                                    className="prose prose-lg max-w-none
                                        prose-headings:font-bold prose-headings:text-gray-900
                                        prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                                        prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4
                                        prose-p:text-gray-700 prose-p:leading-relaxed
                                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                        prose-strong:text-gray-900
                                        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-gray-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
                                        prose-img:rounded-2xl prose-img:shadow-lg
                                        prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-primary
                                        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-2xl
                                        prose-ul:list-disc prose-ol:list-decimal
                                        prose-li:text-gray-700"
                                    dangerouslySetInnerHTML={{ __html: blog.content }}
                                />

                                {/* Mobile Share */}
                                <div className="lg:hidden mt-12 flex items-center gap-4">
                                    <span className="font-medium text-gray-700">Share:</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleShare('facebook')}
                                            className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center"
                                        >
                                            <Facebook className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleShare('twitter')}
                                            className="w-10 h-10 rounded-lg bg-sky-500 text-white flex items-center justify-center"
                                        >
                                            <Twitter className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleShare('linkedin')}
                                            className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center"
                                        >
                                            <Linkedin className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleShare('copy')}
                                            className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Author Box */}
                                {blog.author && (
                                    <div className="mt-16 p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl">
                                        <div className="flex items-start gap-6">
                                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <User className="w-10 h-10 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                    Written by {blog.author.name}
                                                </h3>
                                                <p className="text-gray-600">
                                                    Sharing insights about fashion, culture, and style. Follow us for more inspiring content.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </article>
                        </div>
                    </div>
                </section>

                {/* Related Blogs */}
                {blog.relatedBlogs && blog.relatedBlogs.length > 0 && (
                    <section className="py-16 px-4 bg-gray-50">
                        <div className="max-w-7xl mx-auto">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8">
                                Related Articles
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {blog.relatedBlogs.map((related, index) => (
                                    <motion.article
                                        key={related.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                                    >
                                        <Link to={`/blog/${related.slug}`}>
                                            <div className="aspect-[3/2] overflow-hidden">
                                                <img
                                                    src={related.featured_image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}
                                                    alt={related.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="p-5">
                                                <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                                                    {related.title}
                                                </h3>
                                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {related.reading_time} min
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.article>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* CTA */}
                <section className="py-16 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Enjoyed this article?
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Explore more stories and stay updated with our latest posts
                        </p>
                        <Link
                            to="/blogs"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
                        >
                            <BookOpen className="w-5 h-5" />
                            View All Articles
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
