import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Clock, Eye, ChevronRight, Search, Filter,
    Play, ArrowRight, TrendingUp, BookOpen, Tag, X, ChevronDown
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../api/client';

// =============================================================================
// BLOG PAGE - Premium Blogging Experience
// =============================================================================

const BlogCard = ({ blog, index }) => {
    const categoryColor = blog.category?.color || '#f43f5e';

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300"
        >
            <Link to={`/blog/${blog.slug}`} className="block">
                {/* Image Container - Smaller aspect ratio */}
                <div className="relative overflow-hidden aspect-[16/10]">
                    {blog.video_url ? (
                        <div className="relative w-full h-full">
                            <img
                                src={blog.featured_image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'}
                                alt={blog.title}
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                    <Play className="w-5 h-5 text-primary ml-0.5" fill="currentColor" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <img
                            src={blog.featured_image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'}
                            alt={blog.title}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                    )}

                    {/* Category Badge - Smaller on mobile */}
                    {blog.category && (
                        <div
                            className="absolute top-2 left-2 px-2 py-1 rounded-full text-white text-[10px] md:text-xs font-medium backdrop-blur-md max-w-[70%] truncate"
                            style={{ backgroundColor: `${categoryColor}dd` }}
                        >
                            {blog.category.icon} {blog.category.name}
                        </div>
                    )}

                    {/* Featured Badge */}
                    {blog.is_featured && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-white text-[10px] font-bold flex items-center gap-0.5 shadow-lg">
                            <TrendingUp className="w-2.5 h-2.5" />
                            Featured
                        </div>
                    )}
                </div>

                {/* Content - Compact padding */}
                <div className="p-4">
                    {/* Meta - Smaller text */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(blog.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short'
                            })}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {blog.reading_time} min
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {blog.views?.toLocaleString() || 0}
                        </span>
                    </div>

                    {/* Title - Smaller */}
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug">
                        {blog.title}
                    </h3>

                    {/* Excerpt - Compact */}
                    {blog.excerpt && (
                        <p className="mt-2 text-gray-500 line-clamp-2 text-xs leading-relaxed">
                            {blog.excerpt}
                        </p>
                    )}

                    {/* Read More - Smaller */}
                    <div className="mt-3 flex items-center text-primary text-xs font-semibold group-hover:gap-1.5 transition-all">
                        Read More
                        <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </Link>
        </motion.article>
    );
};

const CategoryCard = ({ category, isActive, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`flex items-center gap-1.5 md:gap-3 px-3 py-1.5 md:px-5 md:py-3 rounded-xl md:rounded-2xl transition-all duration-300 text-xs md:text-base ${isActive
            ? 'bg-primary text-white shadow-lg shadow-primary/30'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-primary/30'
            }`}
    >
        <span className="text-sm md:text-xl">{category.icon}</span>
        <span className="font-medium whitespace-nowrap">{category.name}</span>
        {category.blog_count > 0 && (
            <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                {category.blog_count}
            </span>
        )}
    </motion.button>
);

const FeaturedHero = ({ blog }) => {
    if (!blog) return null;

    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative h-[70vh] min-h-[500px] overflow-hidden mb-16"
        >
            {/* Background */}
            <div className="absolute inset-0">
                {blog.video_url ? (
                    <video
                        src={blog.video_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img
                        src={blog.background_image || blog.featured_image || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1900'}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                    />
                )}
                <div
                    className="absolute inset-0"
                    style={{
                        background: blog.gradient
                            ? `linear-gradient(135deg, ${blog.gradient})`
                            : 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)'
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center">
                <div className="max-w-3xl">
                    {blog.category && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white mb-6"
                        >
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-medium">Featured Story</span>
                        </motion.div>
                    )}

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
                    >
                        {blog.title}
                    </motion.h1>

                    {blog.excerpt && (
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-lg md:text-xl text-white/80 mb-8 line-clamp-3"
                        >
                            {blog.excerpt}
                        </motion.p>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center gap-6"
                    >
                        <Link
                            to={`/blog/${blog.slug}`}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-full hover:bg-gray-100 transition-colors shadow-xl"
                        >
                            <BookOpen className="w-5 h-5" />
                            Read Full Story
                        </Link>

                        <div className="flex items-center gap-4 text-white/80 text-sm">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {blog.reading_time} min read
                            </span>
                            <span className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {blog.views?.toLocaleString() || 0} views
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
};

export default function Blogs() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [featuredBlogs, setFeaturedBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    const [sortBy, setSortBy] = useState('recent');
    const [showFilters, setShowFilters] = useState(false);

    // Get params from URL
    const page = parseInt(searchParams.get('page')) || 1;
    const categoryFromUrl = searchParams.get('category');

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.blogCategories();
                if (response.success) {
                    setCategories(response.categories);
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    // Fetch featured blogs
    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const response = await api.featuredBlogs(3);
                if (response.success) {
                    setFeaturedBlogs(response.blogs);
                }
            } catch (error) {
                console.error('Failed to fetch featured blogs:', error);
            }
        };
        fetchFeatured();
    }, []);

    // Fetch blogs
    const fetchBlogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 12,
                sort: sortBy,
            };
            if (activeCategory) params.category = activeCategory;
            if (searchQuery) params.search = searchQuery;

            const response = await api.blogs(params);
            if (response.success) {
                setBlogs(response.blogs);
                setPagination(response.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch blogs:', error);
        } finally {
            setLoading(false);
        }
    }, [page, activeCategory, sortBy, searchQuery]);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    // Set category from URL
    useEffect(() => {
        if (categoryFromUrl) {
            setActiveCategory(parseInt(categoryFromUrl));
        }
    }, [categoryFromUrl]);

    // Handle category change
    const handleCategoryChange = (categoryId) => {
        setActiveCategory(categoryId === activeCategory ? null : categoryId);
        const newParams = new URLSearchParams(searchParams);
        if (categoryId && categoryId !== activeCategory) {
            newParams.set('category', categoryId);
        } else {
            newParams.delete('category');
        }
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', newPage.toString());
        setSearchParams(newParams);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        fetchBlogs();
    };

    const mainFeatured = featuredBlogs[0];

    return (
        <>
            <Helmet>
                <title>Blog - Shagun Gallery | Fashion, Beauty & Culture Stories</title>
                <meta
                    name="description"
                    content="Explore our blog for the latest fashion trends, styling tips, beauty advice, wedding inspiration, and cultural stories from Shagun Gallery."
                />
            </Helmet>

            <Header />

            <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* Featured Hero */}
                {mainFeatured && page === 1 && !activeCategory && !searchQuery && (
                    <FeaturedHero blog={mainFeatured} />
                )}

                {/* Page Header (when not showing hero) */}
                {(page > 1 || activeCategory || searchQuery) && (
                    <section className="pt-32 pb-16 px-4">
                        <div className="max-w-7xl mx-auto text-center">
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
                            >
                                Our <span className="text-gradient">Blog</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg text-gray-600 max-w-2xl mx-auto"
                            >
                                Discover stories about fashion, beauty, culture, and more
                            </motion.p>
                        </div>
                    </section>
                )}

                {/* Search & Filter Bar */}
                <section className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex flex-col lg:flex-row items-center gap-4">
                            {/* Search */}
                            <form onSubmit={handleSearch} className="relative flex-1 max-w-xl w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search articles..."
                                    className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </form>

                            {/* Sort & Filter Toggle */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="appearance-none px-3 py-2 pr-8 text-sm md:px-4 md:py-3 md:pr-10 md:text-base bg-gray-100 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                                    >
                                        <option value="recent">Most Recent</option>
                                        <option value="popular">Most Popular</option>
                                        <option value="oldest">Oldest First</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                </div>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-sm md:px-4 md:py-3 md:text-base rounded-xl transition-colors ${showFilters ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Filter className="w-4 h-4 md:w-5 md:h-5" />
                                    <span className="hidden sm:inline">Categories</span>
                                    <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Categories */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex flex-wrap gap-2 md:gap-3 pt-3 md:pt-4">
                                        <CategoryCard
                                            category={{ name: 'All Posts', icon: '✨', blog_count: pagination.total }}
                                            isActive={!activeCategory}
                                            onClick={() => handleCategoryChange(null)}
                                        />
                                        {categories.map((category) => (
                                            <CategoryCard
                                                key={category.id}
                                                category={category}
                                                isActive={activeCategory === category.id}
                                                onClick={() => handleCategoryChange(category.id)}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Blog Grid */}
                <section className="py-16 px-4">
                    <div className="max-w-7xl mx-auto">
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-md">
                                        <div className="aspect-[16/10] skeleton" />
                                        <div className="p-4 space-y-3">
                                            <div className="skeleton-text w-1/3 h-2" />
                                            <div className="skeleton-title h-4" />
                                            <div className="skeleton-text h-2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : blogs.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">📝</div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">No articles found</h3>
                                <p className="text-gray-600">
                                    {searchQuery
                                        ? `No results for "${searchQuery}". Try a different search term.`
                                        : 'Check back soon for new content!'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {blogs.map((blog, index) => (
                                    <BlogCard
                                        key={blog.id}
                                        blog={blog}
                                        index={index}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination with API Info */}
                        {pagination.totalPages >= 1 && (
                            <div className="mt-12 space-y-4">
                                {/* Pagination Info */}
                                <div className="text-center text-sm text-gray-500">
                                    Showing {((page - 1) * (pagination.limit || 12)) + 1} - {Math.min(page * (pagination.limit || 12), pagination.total || 0)} of {pagination.total || 0} articles
                                    <span className="mx-2">•</span>
                                    Page {page} of {pagination.totalPages}
                                </div>

                                {/* Pagination Controls */}
                                {pagination.totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-2">
                                        {/* First Page */}
                                        <button
                                            onClick={() => handlePageChange(1)}
                                            disabled={page === 1}
                                            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            First
                                        </button>

                                        {/* Previous */}
                                        <button
                                            onClick={() => handlePageChange(page - 1)}
                                            disabled={page === 1}
                                            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            ← Prev
                                        </button>

                                        {/* Page Numbers */}
                                        <div className="flex items-center gap-1">
                                            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                                                let pageNum;
                                                if (pagination.totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (page >= pagination.totalPages - 2) {
                                                    pageNum = pagination.totalPages - 4 + i;
                                                } else {
                                                    pageNum = page - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === pageNum
                                                            ? 'bg-primary text-white shadow-md'
                                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Next */}
                                        <button
                                            onClick={() => handlePageChange(page + 1)}
                                            disabled={!pagination.hasMore}
                                            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next →
                                        </button>

                                        {/* Last Page */}
                                        <button
                                            onClick={() => handlePageChange(pagination.totalPages)}
                                            disabled={page === pagination.totalPages}
                                            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Last
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* Newsletter CTA */}
                <section className="py-20 px-4 bg-gradient-to-br from-primary via-pink-500 to-purple-600">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Subscribe to Our Newsletter
                            </h2>
                            <p className="text-lg text-white/80 mb-8">
                                Get the latest articles, fashion tips, and exclusive content delivered to your inbox
                            </p>
                            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 px-6 py-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                                />
                                <button
                                    type="submit"
                                    className="px-8 py-4 bg-white text-primary font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-xl"
                                >
                                    Subscribe
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
