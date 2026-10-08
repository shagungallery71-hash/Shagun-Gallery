import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Package, FolderTree, Users, ShoppingCart,
    Star, Settings, LogOut, Menu, X, ChevronDown, Bell,
    Store, BarChart3, Mail, Tag, CreditCard, Flame, UserCog, Home, Briefcase, FileText, Link2
} from 'lucide-react';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/admin/dashboard'
    },
    {
        label: 'Hero Banners',
        icon: Home,
        path: '/admin/hero',
        badge: 'New'
    },
    {
        label: 'Orders',
        icon: ShoppingCart,
        path: '/admin/orders',
        badge: 'New'
    },
    {
        label: 'Products',
        icon: Package,
        path: '/admin/products'
    },
    {
        label: 'Related Products',
        icon: Link2,
        path: '/admin/related-products'
    },
    {
        label: 'Categories',
        icon: FolderTree,
        path: '/admin/categories'
    },
    {
        label: 'Users',
        icon: UserCog,
        path: '/admin/users',
        badge: 'New'
    },
    {
        label: 'Customers',
        icon: Users,
        path: '/admin/customers'
    },
    {
        label: 'Reviews',
        icon: Star,
        path: '/admin/reviews'
    },
    {
        label: 'Coupons',
        icon: Tag,
        path: '/admin/coupons'
    },
    {
        label: 'Sales',
        icon: Flame,
        path: '/admin/sales',
        badge: 'Hot'
    },
    {
        label: 'Newsletter',
        icon: Mail,
        path: '/admin/newsletter'
    },
    {
        label: 'Blogs',
        icon: FileText,
        path: '/admin/blogs',
        badge: 'New'
    },
    {
        label: 'Careers',
        icon: Briefcase,
        path: '/admin/careers'
    },
];

export default function AdminLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut, user, token, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Handle automatic logout when session expires or user is not authenticated
    useEffect(() => {
        if (!loading) {
            // If no user, no token - redirect to products (they can login from header)
            if (!user || !token) {
                navigate('/products', { replace: true });
            } else if (user?.role?.toLowerCase() !== 'admin') {
                // User is logged in but not admin - redirect to products
                navigate('/products', { replace: true });
            }
        }
    }, [user, token, loading, navigate]);

    // Listen for 401 errors from API calls (session expired)
    useEffect(() => {
        const handleSessionExpired = (event) => {
            console.log('Session expired, logging out...');
            signOut();
            navigate('/products', { replace: true });
        };

        // Listen for custom auth-expired event
        window.addEventListener('auth-expired', handleSessionExpired);

        return () => {
            window.removeEventListener('auth-expired', handleSessionExpired);
        };
    }, [signOut, navigate]);

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const handleLogout = () => {
        if (confirm('Are you sure you want to log out?')) {
            signOut();
            navigate('/');
        }
    };

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated as admin - redirect is handled in useEffect
    if (!user || !token || user?.role?.toLowerCase() !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b sticky top-0 z-20">
                <div className="flex items-center justify-between px-4 h-16">
                    <button onClick={() => setMobileMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <Menu className="w-6 h-6" />
                    </button>
                    <Link to="/admin/dashboard" className="font-bold text-lg">Admin Panel</Link>
                    <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg">
                        <Store className="w-5 h-5" />
                    </Link>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/50 z-30"
                        />
                        <motion.div
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-white z-40 shadow-xl flex flex-col"
                        >
                            <div className="flex items-center justify-between p-4 border-b">
                                <span className="font-bold text-lg">Admin Panel</span>
                                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Menu Items */}
                            <nav className="flex-1 p-4 overflow-y-auto">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive(item.path)
                                            ? 'bg-primary text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                        {item.badge && (
                                            <span className="ml-auto px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </nav>

                            {/* Mobile Footer - View Store, Settings, Logout */}
                            <div className="p-4 border-t bg-gray-50">
                                <Link
                                    to="/"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Store className="w-5 h-5" />
                                    <span>View Store</span>
                                </Link>
                                <Link
                                    to="/admin/settings"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/settings')
                                        ? 'bg-primary text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <Settings className="w-5 h-5" />
                                    <span>Settings</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-white border-r z-20 transition-all duration-300 ${sidebarOpen ? 'w-[260px]' : 'w-[80px]'
                }`}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b">
                    {sidebarOpen && (
                        <Link to="/admin/dashboard" className="font-bold text-lg text-gray-900">
                            ShagunGallery
                        </Link>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${isActive(item.path)
                                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            title={!sidebarOpen ? item.label : undefined}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {sidebarOpen && (
                                <>
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge && (
                                        <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t">
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <Store className="w-5 h-5" />
                        {sidebarOpen && <span>View Store</span>}
                    </Link>
                    <Link
                        to="/admin/settings"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/admin/settings')
                            ? 'bg-gradient-to-r from-primary to-secondary text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Settings className="w-5 h-5" />
                        {sidebarOpen && <span>Settings</span>}
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1"
                        title={!sidebarOpen ? 'Logout' : undefined}
                    >
                        <LogOut className="w-5 h-5" />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[80px]'}`}>
                {/* Top Bar */}
                <header className="hidden lg:flex items-center justify-between h-16 px-6 bg-white border-b sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                            <Bell className="w-5 h-5 text-gray-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>
                        <div className="flex items-center gap-2 pl-4 border-l">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                                A
                            </div>
                            <span className="font-medium text-gray-900">Admin</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="min-h-[calc(100vh-64px)]">
                    {children}
                </div>
            </main>
        </div>
    );
}
