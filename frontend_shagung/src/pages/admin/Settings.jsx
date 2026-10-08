import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, User, Shield, Bell, Database, RefreshCw, Download, HardDrive } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContext';
import { adminApi, getToken } from './index';
import AdminLayout from './AdminLayout';
import { Button, Card } from '../../components/ui';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminSettings() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { showToast } = useToast();
    const [loggingOut, setLoggingOut] = useState(false);
    const [clearingCache, setClearingCache] = useState(false);
    const [downloadingDB, setDownloadingDB] = useState(false);
    const [downloadingRedis, setDownloadingRedis] = useState(false);

    const handleLogout = async () => {
        if (!confirm('Are you sure you want to log out?')) return;

        setLoggingOut(true);
        try {
            signOut();
            showToast('Logged out successfully', 'success');
            navigate('/');
        } catch (error) {
            showToast('Error logging out: ' + error.message, 'error');
        } finally {
            setLoggingOut(false);
        }
    };

    const handleClearCache = async () => {
        if (!confirm('⚠️ This will clear all cached data. Continue?')) return;

        setClearingCache(true);
        try {
            await adminApi.clearCache();
            showToast('Cache cleared successfully', 'success');
        } catch (error) {
            showToast('Error clearing cache: ' + error.message, 'error');
        } finally {
            setClearingCache(false);
        }
    };

    const handleDownloadDatabase = async () => {
        setDownloadingDB(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/api/admin/export/database`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to download database');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `database_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showToast('Database exported successfully', 'success');
        } catch (error) {
            showToast('Error downloading database: ' + error.message, 'error');
        } finally {
            setDownloadingDB(false);
        }
    };

    const handleDownloadRedis = async () => {
        setDownloadingRedis(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE}/api/admin/export/redis`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to download Redis cache');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `redis_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showToast('Redis cache exported successfully', 'success');
        } catch (error) {
            showToast('Error downloading Redis: ' + error.message, 'error');
        } finally {
            setDownloadingRedis(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Settings className="w-7 h-7" />
                        Settings
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your account and system settings</p>
                </div>

                {/* Admin Profile */}
                <Card className="p-6 mb-6" hover={false}>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <User className="w-5 h-5" />
                        Admin Profile
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-gray-900">{user?.name || user?.email}</p>
                            <p className="text-gray-500">{user?.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-green-600 font-medium">Administrator</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Backup & Export */}
                <Card className="p-6 mb-6" hover={false}>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <Download className="w-5 h-5" />
                        Backup & Export
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Database className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Download Neon Database</p>
                                    <p className="text-sm text-gray-500">
                                        Export all tables as JSON backup file
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleDownloadDatabase}
                                loading={downloadingDB}
                                variant="primary"
                                size="sm"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <HardDrive className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Download Redis Cache</p>
                                    <p className="text-sm text-gray-500">
                                        Export cached data from Upstash Redis
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleDownloadRedis}
                                loading={downloadingRedis}
                                variant="outline"
                                size="sm"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* System Actions */}
                <Card className="p-6 mb-6" hover={false}>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <RefreshCw className="w-5 h-5" />
                        System Actions
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="font-medium text-gray-900">Clear Cache</p>
                                <p className="text-sm text-gray-500">
                                    Clear all cached data to refresh product listings and categories
                                </p>
                            </div>
                            <Button
                                onClick={handleClearCache}
                                loading={clearingCache}
                                variant="outline"
                                size="sm"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Clear Cache
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Logout Section */}
                <Card className="p-6 border-red-100" hover={false}>
                    <h2 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-4">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Sign out from the admin panel. You will need to log in again to access admin features.
                    </p>
                    <Button
                        onClick={handleLogout}
                        loading={loggingOut}
                        variant="destructive"
                        size="lg"
                        className="w-full sm:w-auto"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                    </Button>
                </Card>
            </div>
        </AdminLayout>
    );
}
