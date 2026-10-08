import { useState, useEffect } from 'react';
import {
    Mail, Download, Search, RefreshCw, Calendar, Check, Ban
} from 'lucide-react';
import { adminApi } from './index';
import { Button, Card, Badge, Skeleton } from '../../components/ui';
import AdminLayout from './AdminLayout';

export default function AdminNewsletter() {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        active: 'true',
        page: 1,
    });
    const [pagination, setPagination] = useState({});

    const fetchSubscribers = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getSubscribers({ active: filters.active, page: filters.page });
            setSubscribers(data.subscribers || []);
            setPagination(data.pagination || {});
        } catch (error) {
            console.error('Failed to fetch subscribers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscribers();
    }, [filters]);

    const handleExport = async () => {
        try {
            const blob = await adminApi.exportSubscribers();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'newsletter_subscribers.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export:', error);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
                        <p className="text-gray-500">Manage email subscribers</p>
                    </div>
                    <Button onClick={handleExport} variant="outline" leftIcon={<Download className="w-4 h-4" />}>
                        Export CSV
                    </Button>
                </div>

                <Card className="p-4 mb-6" hover={false}>
                    <div className="flex gap-4">
                        <select
                            value={filters.active}
                            onChange={(e) => setFilters({ ...filters, active: e.target.value, page: 1 })}
                            className="px-4 py-2 border border-gray-200 rounded-lg"
                        >
                            <option value="true">Active Subscribers</option>
                            <option value="false">Unsubscribed</option>
                            <option value="">All History</option>
                        </select>
                        <Button variant="outline" onClick={fetchSubscribers}>
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>

                <Card className="overflow-hidden" hover={false}>
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : subscribers.length === 0 ? (
                        <div className="p-16 text-center">
                            <Mail className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No subscribers found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr className="text-left text-sm text-gray-500">
                                        <th className="py-3 px-4 font-medium">Email</th>
                                        <th className="py-3 px-4 font-medium">Status</th>
                                        <th className="py-3 px-4 font-medium">Subscribed Date</th>
                                        <th className="py-3 px-4 font-medium">Unsubscribed Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscribers.map((sub, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                                                        <Mail className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-medium text-gray-900">{sub.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={sub.is_active ? 'success' : 'ghost'} size="sm">
                                                    {sub.is_active ? 'Subscribed' : 'Unsubscribed'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-500">
                                                {new Date(sub.subscribed_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-500">
                                                {sub.unsubscribed_at ? new Date(sub.unsubscribed_at).toLocaleDateString('en-IN') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Page {pagination.page} of {pagination.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                    disabled={filters.page <= 1}
                                    variant="outline"
                                    size="sm"
                                >
                                    Previous
                                </Button>
                                <Button
                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                    disabled={filters.page >= pagination.totalPages}
                                    variant="outline"
                                    size="sm"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
