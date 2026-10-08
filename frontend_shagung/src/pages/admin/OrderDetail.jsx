import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Package, Truck, MapPin, CreditCard,
    Clock, CheckCircle, XCircle, RefreshCw, User,
    Phone, Mail, Calendar, Edit, Save, X
} from 'lucide-react';
import { adminApi } from './index';
import { Button, Card, Badge, Skeleton } from '../../components/ui';
import AdminLayout from './AdminLayout';

// Helper to get color code from item
const getColorCode = (item) => item?.color_code || '#9ca3af';

// Status Timeline
const StatusTimeline = ({ status, history }) => {
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statuses.indexOf(status);

    const statusLabels = {
        pending: { label: 'Order Placed', icon: Clock },
        confirmed: { label: 'Confirmed', icon: CheckCircle },
        processing: { label: 'Processing', icon: RefreshCw },
        shipped: { label: 'Shipped', icon: Truck },
        delivered: { label: 'Delivered', icon: MapPin },
    };

    return (
        <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
            {statuses.map((s, index) => {
                const Config = statusLabels[s];
                const Icon = Config.icon;
                const isComplete = index <= currentIndex;
                const isCurrent = index === currentIndex;

                return (
                    <div key={s} className="relative flex items-start gap-4 pb-8 last:pb-0">
                        <div className={`
              relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0
              ${isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}
              ${isCurrent ? 'ring-4 ring-green-200' : ''}
            `}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="pt-1.5">
                            <p className={`font-medium ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                                {Config.label}
                            </p>
                            {history?.find(h => h.status === s) && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(history.find(h => h.status === s).created_at).toLocaleString('en-IN')}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Main Admin Order Detail
export default function AdminOrderDetail() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [editTracking, setEditTracking] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');

    // Fetch order
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await adminApi.getOrder(orderId);
                setOrder(data.order);
                setTrackingNumber(data.order?.tracking_number || '');
                setTrackingUrl(data.order?.tracking_url || '');
            } catch (error) {
                console.error('Failed to fetch order:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    // Update order status
    const handleUpdateStatus = async (newStatus) => {
        setUpdating(true);
        try {
            await adminApi.updateOrderStatus(orderId, {
                status: newStatus,
                trackingNumber: trackingNumber || undefined,
                trackingUrl: trackingUrl || undefined,
            });

            // Refresh order
            const data = await adminApi.getOrder(orderId);
            setOrder(data.order);
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setUpdating(false);
        }
    };

    // Save tracking info
    const handleSaveTracking = async () => {
        setUpdating(true);
        try {
            await adminApi.updateOrderStatus(orderId, {
                status: order.status,
                trackingNumber,
                trackingUrl,
            });
            setEditTracking(false);

            const data = await adminApi.getOrder(orderId);
            setOrder(data.order);
        } catch (error) {
            console.error('Failed to save tracking:', error);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="p-6">
                    <Skeleton className="h-10 w-48 mb-6" />
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-64 rounded-xl" />
                            <Skeleton className="h-48 rounded-xl" />
                        </div>
                        <Skeleton className="h-96 rounded-xl" />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!order) {
        return (
            <AdminLayout>
                <div className="p-16 text-center">
                    <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
                    <Link to="/admin/orders">
                        <Button>Back to Orders</Button>
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    const isCancelled = order.status === 'cancelled';
    const isDelivered = order.status === 'delivered';

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/admin/orders')} className="p-2 hover:bg-white rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
                        <p className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <Card className="p-6" hover={false}>
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary" />
                                Order Items
                            </h2>
                            <div className="space-y-4">
                                {order.items?.map((item, index) => (
                                    <div key={index} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                            <img
                                                src={item.image || '/placeholder.jpg'}
                                                alt={item.product_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{item.product_name}</p>
                                            {(item.size || item.color) && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    {item.size && <span>Size: {item.size}</span>}
                                                    {item.size && item.color && <span>/</span>}
                                                    {item.color && (
                                                        <span className="flex items-center gap-1">
                                                            <span
                                                                className="w-3 h-3 rounded-full border border-gray-200"
                                                                style={{ backgroundColor: getColorCode(item) }}
                                                            />
                                                            {item.color}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <p className="text-sm text-gray-600 mt-1">
                                                ₹{item.price} × {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">₹{item.total}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="mt-6 pt-4 border-t space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>₹{order.subtotal}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span>
                                        <span>-₹{order.discount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Shipping</span>
                                    <span>{order.shipping_cost > 0 ? `₹${order.shipping_cost}` : 'FREE'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Tax (GST)</span>
                                    <span>₹{order.tax_amount}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                    <span>Total</span>
                                    <span className="text-primary">₹{order.total}</span>
                                </div>
                            </div>
                        </Card>

                        {/* Customer Info */}
                        <Card className="p-6" hover={false}>
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Customer Information
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Shipping Address</h3>
                                    <div className="space-y-1 text-sm">
                                        <p className="font-medium">{order.shipping_address?.full_name}</p>
                                        <p>{order.shipping_address?.address_line1}</p>
                                        {order.shipping_address?.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                                        <p>{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postal_code}</p>
                                        <div className="flex items-center gap-2 mt-2 text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            {order.shipping_address?.phone}
                                        </div>
                                        {order.shipping_address?.email && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Mail className="w-4 h-4" />
                                                {order.shipping_address.email}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Payment</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                                                {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                                            </Badge>
                                        </div>
                                        {order.payment_intent_id && (
                                            <p className="text-xs text-gray-500">
                                                Payment ID: {order.payment_intent_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Tracking Info */}
                        <Card className="p-6" hover={false}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <Truck className="w-5 h-5 text-primary" />
                                    Shipping & Tracking
                                </h2>
                                {!editTracking && !isCancelled && (
                                    <Button variant="ghost" size="sm" onClick={() => setEditTracking(true)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>

                            {editTracking ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                                        <input
                                            type="text"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg"
                                            placeholder="Enter tracking number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tracking URL</label>
                                        <input
                                            type="url"
                                            value={trackingUrl}
                                            onChange={(e) => setTrackingUrl(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleSaveTracking} loading={updating} size="sm">
                                            <Save className="w-4 h-4 mr-1" /> Save
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setEditTracking(false)}>
                                            <X className="w-4 h-4 mr-1" /> Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 text-sm">
                                    {order.tracking_number ? (
                                        <>
                                            <p><strong>Tracking:</strong> {order.tracking_number}</p>
                                            {order.tracking_url && (
                                                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                    Track Package →
                                                </a>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-gray-500">No tracking information added yet</p>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status & Actions */}
                        <Card className="p-6" hover={false}>
                            <h2 className="font-bold text-lg mb-4">Order Status</h2>

                            {isCancelled ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <XCircle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <Badge variant="destructive" size="lg">Cancelled</Badge>
                                    {order.cancellation_reason && (
                                        <p className="text-sm text-gray-500 mt-4">
                                            Reason: {order.cancellation_reason}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <StatusTimeline status={order.status} history={order.history} />

                                    {!isDelivered && (
                                        <div className="mt-6 pt-4 border-t space-y-2">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
                                            {order.status === 'pending' && (
                                                <Button onClick={() => handleUpdateStatus('confirmed')} loading={updating} className="w-full" variant="outline">
                                                    <CheckCircle className="w-4 h-4 mr-2" /> Confirm Order
                                                </Button>
                                            )}
                                            {order.status === 'confirmed' && (
                                                <Button onClick={() => handleUpdateStatus('processing')} loading={updating} className="w-full" variant="outline">
                                                    <RefreshCw className="w-4 h-4 mr-2" /> Start Processing
                                                </Button>
                                            )}
                                            {order.status === 'processing' && (
                                                <Button onClick={() => handleUpdateStatus('shipped')} loading={updating} className="w-full" variant="gradient">
                                                    <Truck className="w-4 h-4 mr-2" /> Mark as Shipped
                                                </Button>
                                            )}
                                            {order.status === 'shipped' && (
                                                <Button onClick={() => handleUpdateStatus('delivered')} loading={updating} className="w-full" variant="gradient">
                                                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Delivered
                                                </Button>
                                            )}
                                            <Button onClick={() => handleUpdateStatus('cancelled')} loading={updating} className="w-full" variant="ghost">
                                                <XCircle className="w-4 h-4 mr-2 text-red-500" /> Cancel Order
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </Card>

                        {/* Order Notes */}
                        {order.notes && (
                            <Card className="p-6" hover={false}>
                                <h2 className="font-bold text-lg mb-2">Order Notes</h2>
                                <p className="text-sm text-gray-600">{order.notes}</p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
