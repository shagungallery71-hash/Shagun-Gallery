import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Briefcase, Users,
    MapPin, Clock, DollarSign, FileText, Search, Filter, RefreshCw,
    Check, ChevronDown, Mail, Phone, Download, ExternalLink, Star
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './AdminLayout';

// Status badge colors
const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    reviewing: 'bg-blue-100 text-blue-700',
    shortlisted: 'bg-purple-100 text-purple-700',
    interview: 'bg-cyan-100 text-cyan-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-green-100 text-green-700',
};

// Default job form
const DEFAULT_JOB = {
    title: '',
    department: '',
    location: 'Remote',
    employment_type: 'Full-time',
    experience_level: 'Mid',
    salary_min: '',
    salary_max: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    is_active: true,
    is_featured: false,
    application_deadline: '',
    positions_available: 1,
};

export default function CareersAdmin() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('jobs'); // jobs | applications
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [formData, setFormData] = useState(DEFAULT_JOB);

    // Application detail modal
    const [selectedApplication, setSelectedApplication] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        job_id: '',
        status: '',
    });

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [jobsRes, appsRes, statsRes] = await Promise.all([
                api.getJobsAdmin(token),
                api.getApplicationsAdmin(filters, token),
                api.getCareersStats(token),
            ]);

            if (jobsRes.success) setJobs(jobsRes.data || []);
            if (appsRes.success) setApplications(appsRes.data || []);
            if (statsRes.success) setStats(statsRes.data || {});
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [token, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle form changes
    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Open modal for new job
    const handleAddNew = () => {
        setEditingJob(null);
        setFormData(DEFAULT_JOB);
        setIsModalOpen(true);
    };

    // Open modal to edit job
    const handleEdit = (job) => {
        setEditingJob(job);
        setFormData({
            title: job.title || '',
            department: job.department || '',
            location: job.location || 'Remote',
            employment_type: job.employment_type || 'Full-time',
            experience_level: job.experience_level || 'Mid',
            salary_min: job.salary_min || '',
            salary_max: job.salary_max || '',
            description: job.description || '',
            requirements: job.requirements || '',
            responsibilities: job.responsibilities || '',
            benefits: job.benefits || '',
            is_active: job.is_active ?? true,
            is_featured: job.is_featured ?? false,
            application_deadline: job.application_deadline ? job.application_deadline.split('T')[0] : '',
            positions_available: job.positions_available || 1,
        });
        setIsModalOpen(true);
    };

    // Save job
    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            if (!formData.title || !formData.description) {
                setError('Title and description are required');
                return;
            }

            let result;
            if (editingJob) {
                result = await api.updateJob(editingJob.id, formData, token);
            } else {
                result = await api.createJob(formData, token);
            }

            if (result.success) {
                setSuccess(editingJob ? 'Job updated successfully!' : 'Job created successfully!');
                setIsModalOpen(false);
                fetchData();
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.message || 'Failed to save job');
        } finally {
            setSaving(false);
        }
    };

    // Delete job
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this job? All applications will also be deleted.')) return;

        try {
            const result = await api.deleteJob(id, token);
            if (result.success) {
                setSuccess('Job deleted successfully!');
                fetchData();
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.message || 'Failed to delete job');
        }
    };

    // Toggle job status
    const handleToggle = async (id) => {
        try {
            const result = await api.toggleJob(id, token);
            if (result.success) {
                fetchData();
            }
        } catch (err) {
            setError(err.message || 'Failed to toggle job');
        }
    };

    // Update application status
    const handleUpdateStatus = async (appId, status) => {
        try {
            const result = await api.updateApplicationStatus(appId, { status }, token);
            if (result.success) {
                setSuccess('Application status updated!');
                fetchData();
                if (selectedApplication) {
                    setSelectedApplication(prev => ({ ...prev, status }));
                }
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.message || 'Failed to update status');
        }
    };

    // Delete application
    const handleDeleteApplication = async (id) => {
        if (!confirm('Are you sure you want to delete this application?')) return;

        try {
            const result = await api.deleteApplication(id, token);
            if (result.success) {
                setSuccess('Application deleted successfully!');
                setSelectedApplication(null);
                fetchData();
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.message || 'Failed to delete application');
        }
    };

    // Handle File Download
    const handleDownload = (url, filename) => {
        // Define API_BASE similar to client.js to ensure we hit the backend directly in dev
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        // Use backend proxy to avoid CORS/Auth issues
        const proxyUrl = `${API_BASE}/api/careers/download-resume?url=${encodeURIComponent(url)}`;

        // Trigger download via hidden link
        const link = document.createElement('a');
        link.href = proxyUrl;
        link.download = filename || 'resume.pdf';

        // Direct navigation creates a better "download" experience
        window.location.href = proxyUrl;
    };

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Careers Management</h1>
                        <p className="text-gray-500 mt-1">Manage job postings and applications</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            <Plus className="w-4 h-4" />
                            Add Job
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    {[
                        { label: 'Active Jobs', value: stats.active_jobs || 0, icon: Briefcase, color: 'text-green-600 bg-green-50' },
                        { label: 'Total Jobs', value: stats.total_jobs || 0, icon: FileText, color: 'text-blue-600 bg-blue-50' },
                        { label: 'Applications', value: stats.total_applications || 0, icon: Users, color: 'text-purple-600 bg-purple-50' },
                        { label: 'Pending', value: stats.pending_applications || 0, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
                        { label: 'Shortlisted', value: stats.shortlisted || 0, icon: Star, color: 'text-cyan-600 bg-cyan-50' },
                        { label: 'Hired', value: stats.hired || 0, icon: Check, color: 'text-emerald-600 bg-emerald-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-xl border p-4">
                            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Alerts */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between"
                        >
                            <span>{error}</span>
                            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            {success}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
                    <button
                        onClick={() => setActiveTab('jobs')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'jobs' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Briefcase className="w-4 h-4 inline mr-2" />
                        Jobs ({jobs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'applications' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Users className="w-4 h-4 inline mr-2" />
                        Applications ({applications.length})
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : activeTab === 'jobs' ? (
                    /* Jobs List */
                    jobs.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border">
                            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Job Postings</h3>
                            <p className="text-gray-500 mb-4">Create your first job posting</p>
                            <button
                                onClick={handleAddNew}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg"
                            >
                                <Plus className="w-4 h-4" />
                                Add First Job
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    className={`bg-white rounded-xl border p-4 ${!job.is_active ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                                                {job.is_featured && (
                                                    <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">Featured</span>
                                                )}
                                                {!job.is_active && (
                                                    <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">Inactive</span>
                                                )}
                                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                    {job.applications_count || 0} applications
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="w-4 h-4" />
                                                    {job.department}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {job.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {job.employment_type}
                                                </span>
                                                {(job.salary_min || job.salary_max) && (
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4" />
                                                        ₹{job.salary_min ? (job.salary_min / 1000).toFixed(0) + 'K' : ''}
                                                        {job.salary_min && job.salary_max ? ' - ' : ''}
                                                        {job.salary_max ? '₹' + (job.salary_max / 1000).toFixed(0) + 'K' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggle(job.id)}
                                                className={`p-2 rounded-lg transition-colors ${job.is_active ? 'hover:bg-gray-100' : 'hover:bg-green-50 text-green-600'
                                                    }`}
                                                title={job.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                {job.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(job)}
                                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(job.id)}
                                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    /* Applications List */
                    <>
                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 mb-4">
                            <select
                                value={filters.job_id}
                                onChange={(e) => setFilters(prev => ({ ...prev, job_id: e.target.value }))}
                                className="px-3 py-2 border rounded-lg bg-white"
                            >
                                <option value="">All Jobs</option>
                                {jobs.map(job => (
                                    <option key={job.id} value={job.id}>{job.title}</option>
                                ))}
                            </select>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="px-3 py-2 border rounded-lg bg-white"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="reviewing">Reviewing</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="interview">Interview</option>
                                <option value="rejected">Rejected</option>
                                <option value="hired">Hired</option>
                            </select>
                        </div>

                        {applications.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications</h3>
                                <p className="text-gray-500">Applications will appear here when candidates apply</p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {applications.map((app) => (
                                        <div key={app.id} className="bg-white rounded-xl border p-4">
                                            {/* Candidate Info */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">{app.full_name}</p>
                                                    <p className="text-sm text-gray-500 truncate">{app.email}</p>
                                                </div>
                                                <select
                                                    value={app.status}
                                                    onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[app.status] || 'bg-gray-100'}`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="reviewing">Reviewing</option>
                                                    <option value="shortlisted">Shortlisted</option>
                                                    <option value="interview">Interview</option>
                                                    <option value="rejected">Rejected</option>
                                                    <option value="hired">Hired</option>
                                                </select>
                                            </div>

                                            {/* Job & Details */}
                                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                                <div>
                                                    <p className="text-gray-500">Job</p>
                                                    <p className="font-medium text-gray-900 truncate">{app.job_title}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Department</p>
                                                    <p className="font-medium text-gray-900">{app.department || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Experience</p>
                                                    <p className="font-medium text-gray-900">{app.years_of_experience ? `${app.years_of_experience} years` : '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Applied</p>
                                                    <p className="font-medium text-gray-900">{new Date(app.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2 pt-3 border-t">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedApplication(app)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteApplication(app.id)}
                                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {app.resume_url && (
                                                    <a
                                                        href={app.resume_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs hover:bg-gray-100 truncate"
                                                    >
                                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                                        <span className="truncate">{app.resume_url}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Candidate</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Job</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Experience</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Applied</th>
                                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {applications.map((app) => (
                                                    <tr key={app.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{app.full_name}</p>
                                                                <p className="text-sm text-gray-500">{app.email}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-gray-900">{app.job_title}</p>
                                                            <p className="text-sm text-gray-500">{app.department}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {app.years_of_experience ? `${app.years_of_experience} years` : '-'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select
                                                                value={app.status}
                                                                onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                                                className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[app.status] || 'bg-gray-100'}`}
                                                            >
                                                                <option value="pending">Pending</option>
                                                                <option value="reviewing">Reviewing</option>
                                                                <option value="shortlisted">Shortlisted</option>
                                                                <option value="interview">Interview</option>
                                                                <option value="rejected">Rejected</option>
                                                                <option value="hired">Hired</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">
                                                            {new Date(app.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex flex-col items-end gap-2">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => setSelectedApplication(app)}
                                                                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                                                                        title="View Details"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteApplication(app.id)}
                                                                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                                {app.resume_url && (
                                                                    <a
                                                                        href={app.resume_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 hover:underline max-w-[180px] truncate"
                                                                        title={app.resume_url}
                                                                    >
                                                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                                                        Resume URL
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Job Edit/Create Modal */}
                <AnimatePresence>
                    {isModalOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsModalOpen(false)}
                                className="fixed inset-0 bg-black/50 z-40"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-4 md:inset-10 lg:inset-20 bg-white rounded-2xl z-50 overflow-hidden flex flex-col"
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b">
                                    <h2 className="text-xl font-bold">
                                        {editingJob ? 'Edit Job' : 'Create New Job'}
                                    </h2>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
                                        {/* Basic Info */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                                                <input
                                                    type="text"
                                                    value={formData.title}
                                                    onChange={(e) => handleFormChange('title', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                                                    placeholder="e.g., Senior Fashion Designer"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                                    <input
                                                        type="text"
                                                        value={formData.department}
                                                        onChange={(e) => handleFormChange('department', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                        placeholder="e.g., Design"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                                    <input
                                                        type="text"
                                                        value={formData.location}
                                                        onChange={(e) => handleFormChange('location', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                        placeholder="e.g., Mumbai or Remote"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                                                    <select
                                                        value={formData.employment_type}
                                                        onChange={(e) => handleFormChange('employment_type', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg bg-white"
                                                    >
                                                        <option value="Full-time">Full-time</option>
                                                        <option value="Part-time">Part-time</option>
                                                        <option value="Contract">Contract</option>
                                                        <option value="Internship">Internship</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                                                    <select
                                                        value={formData.experience_level}
                                                        onChange={(e) => handleFormChange('experience_level', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg bg-white"
                                                    >
                                                        <option value="Entry">Entry Level</option>
                                                        <option value="Mid">Mid Level</option>
                                                        <option value="Senior">Senior Level</option>
                                                        <option value="Lead">Lead/Manager</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (₹/month)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.salary_min}
                                                        onChange={(e) => handleFormChange('salary_min', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                        placeholder="50000"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary (₹/month)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.salary_max}
                                                        onChange={(e) => handleFormChange('salary_max', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                        placeholder="80000"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Positions Available</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={formData.positions_available}
                                                        onChange={(e) => handleFormChange('positions_available', parseInt(e.target.value))}
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                                                    <input
                                                        type="date"
                                                        value={formData.application_deadline}
                                                        onChange={(e) => handleFormChange('application_deadline', e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.is_active}
                                                        onChange={(e) => handleFormChange('is_active', e.target.checked)}
                                                        className="w-4 h-4 text-primary rounded"
                                                    />
                                                    <span className="text-sm text-gray-700">Active</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.is_featured}
                                                        onChange={(e) => handleFormChange('is_featured', e.target.checked)}
                                                        className="w-4 h-4 text-primary rounded"
                                                    />
                                                    <span className="text-sm text-gray-700">Featured</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => handleFormChange('description', e.target.value)}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                    placeholder="Job description..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (one per line)</label>
                                                <textarea
                                                    value={formData.requirements}
                                                    onChange={(e) => handleFormChange('requirements', e.target.value)}
                                                    rows={4}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                    placeholder="Bachelor's degree in...&#10;5+ years of experience...&#10;Proficiency in..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities (one per line)</label>
                                                <textarea
                                                    value={formData.responsibilities}
                                                    onChange={(e) => handleFormChange('responsibilities', e.target.value)}
                                                    rows={4}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                    placeholder="Lead the design team...&#10;Create seasonal collections...&#10;Collaborate with..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (one per line)</label>
                                                <textarea
                                                    value={formData.benefits}
                                                    onChange={(e) => handleFormChange('benefits', e.target.value)}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                    placeholder="Health insurance...&#10;Flexible hours...&#10;Employee discount..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {editingJob ? 'Save Changes' : 'Create Job'}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Application Detail Modal */}
                <AnimatePresence>
                    {selectedApplication && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedApplication(null)}
                                className="fixed inset-0 bg-black/50 z-40"
                            />
                            <motion.div
                                initial={{ opacity: 0, x: 300 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 300 }}
                                className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white z-50 overflow-y-auto shadow-2xl"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold">Application Details</h2>
                                        <button
                                            onClick={() => setSelectedApplication(null)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Applicant Info */}
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
                                            <h3 className="text-2xl font-bold">{selectedApplication.full_name}</h3>
                                            <p className="opacity-80">{selectedApplication.job_title}</p>
                                            <div className="flex items-center gap-4 mt-4">
                                                <a href={`mailto:${selectedApplication.email}`} className="flex items-center gap-1 text-sm hover:underline">
                                                    <Mail className="w-4 h-4" />
                                                    {selectedApplication.email}
                                                </a>
                                                {selectedApplication.phone && (
                                                    <a href={`tel:${selectedApplication.phone}`} className="flex items-center gap-1 text-sm hover:underline">
                                                        <Phone className="w-4 h-4" />
                                                        {selectedApplication.phone}
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                            <select
                                                value={selectedApplication.status}
                                                onChange={(e) => handleUpdateStatus(selectedApplication.id, e.target.value)}
                                                className={`w-full px-4 py-2 rounded-lg font-medium ${STATUS_COLORS[selectedApplication.status]}`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="reviewing">Reviewing</option>
                                                <option value="shortlisted">Shortlisted</option>
                                                <option value="interview">Interview</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="hired">Hired</option>
                                            </select>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedApplication.years_of_experience && (
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-500">Experience</p>
                                                    <p className="font-medium">{selectedApplication.years_of_experience} years</p>
                                                </div>
                                            )}
                                            {selectedApplication.notice_period && (
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-500">Notice Period</p>
                                                    <p className="font-medium">{selectedApplication.notice_period}</p>
                                                </div>
                                            )}
                                            {selectedApplication.current_company && (
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-500">Current Company</p>
                                                    <p className="font-medium">{selectedApplication.current_company}</p>
                                                </div>
                                            )}
                                            {selectedApplication.applicant_role && (
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-500">Current Role</p>
                                                    <p className="font-medium">{selectedApplication.applicant_role}</p>
                                                </div>
                                            )}
                                            {selectedApplication.expected_salary && (
                                                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                                                    <p className="text-xs text-gray-500">Expected Salary</p>
                                                    <p className="font-medium">₹{selectedApplication.expected_salary}/month</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Links */}
                                        <div className="flex flex-wrap gap-2">
                                            {selectedApplication.resume_url && (
                                                <div className="w-full">
                                                    <p className="text-xs text-gray-500 mb-1">Resume URL</p>
                                                    <a
                                                        href={selectedApplication.resume_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm break-all"
                                                    >
                                                        <ExternalLink className="w-4 h-4 shrink-0" />
                                                        {selectedApplication.resume_url}
                                                    </a>
                                                </div>
                                            )}
                                            {selectedApplication.linkedin_url && (
                                                <a
                                                    href={selectedApplication.linkedin_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    LinkedIn
                                                </a>
                                            )}
                                            {selectedApplication.portfolio_url && (
                                                <a
                                                    href={selectedApplication.portfolio_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Portfolio
                                                </a>
                                            )}
                                        </div>

                                        {/* Cover Letter */}
                                        {selectedApplication.cover_letter && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter</label>
                                                <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                                                    {selectedApplication.cover_letter}
                                                </div>
                                            </div>
                                        )}

                                        {/* Applied Date */}
                                        <p className="text-sm text-gray-500 text-center">
                                            Applied on {new Date(selectedApplication.created_at).toLocaleDateString('en-IN', {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </p>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => handleDeleteApplication(selectedApplication.id)}
                                            className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Application
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
}
