import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ChevronRight, Briefcase, MapPin, Clock, Mail, Users, Star, Coffee,
  Heart, Zap, Gift, TrendingUp, X, Upload, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, IndianRupee, Calendar, Layers, Eye, Send, Loader2
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { fetchJSON } from '../api/client'

const BENEFITS = [
  { icon: Heart,      label: 'Health Insurance',   desc: 'Comprehensive medical coverage for you and your family.',        color: 'bg-rose-100 text-rose-700' },
  { icon: Coffee,     label: 'Flexible Hours',      desc: 'Work-life balance is a priority — we mean it.',                 color: 'bg-amber-100 text-amber-700' },
  { icon: Star,       label: 'Employee Discounts',  desc: '40% off on all Shagun Gallery products, year-round.',           color: 'bg-violet-100 text-violet-700' },
  { icon: TrendingUp, label: 'Growth Path',         desc: 'Clear career progression with annual reviews and mentorship.',  color: 'bg-emerald-100 text-emerald-700' },
  { icon: Gift,       label: 'Festival Bonuses',    desc: 'Special bonuses during Diwali, Eid, and other festivals.',      color: 'bg-indigo-100 text-indigo-700' },
  { icon: Zap,        label: 'Learning Budget',     desc: '₹10,000/year for courses, workshops, and skill development.',   color: 'bg-blue-100 text-blue-700' },
]

// ─── Apply Modal ──────────────────────────────────────────────────────────────
function ApplyModal({ job, onClose }) {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', cover_letter: '',
    linkedin_url: '', portfolio_url: '', years_of_experience: '',
    current_company: '', expected_salary: '', notice_period: '',
  })
  const [resumeFile, setResumeFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleResumeChange = (e) => {
    const file = e.target.files[0]
    if (file) setResumeFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      let resume_url = ''

      // Upload resume first if provided
      if (resumeFile) {
        setUploadingResume(true)
        const API_BASE = import.meta.env.VITE_API_URL || 'https://shagun-backend-kbbh.onrender.com';
        const fd = new FormData()
        fd.append('resume', resumeFile)
        const upRes = await fetch(`${API_BASE}/api/careers/upload-resume`, { method: 'POST', body: fd })
        const upJson = await upRes.json()
        if (!upJson.success) throw new Error(upJson.message || 'Resume upload failed')
        resume_url = upJson.data.url
        setUploadingResume(false)
      }

      // Submit application
      await fetchJSON('/api/careers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, ...form, resume_url }),
      })

      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setUploadingResume(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
        className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl max-h-[95vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-indigo-700 text-white px-6 py-4 flex items-start justify-between z-10 sm:rounded-t-2xl">
          <div>
            <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-0.5">Apply Now</p>
            <h2 className="font-serif text-xl font-bold">{job.title}</h2>
            <p className="text-indigo-200 text-xs mt-0.5">{job.department} · {job.location}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 transition-colors mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center text-center py-16 px-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-neutral-900 mb-2">Application Submitted!</h3>
            <p className="text-neutral-500 text-sm max-w-sm">
              Thank you for applying for <strong>{job.title}</strong>. We'll review your application and get back to you soon.
            </p>
            <button onClick={onClose} className="mt-8 px-6 py-2.5 bg-indigo-700 text-white rounded-xl text-sm font-bold hover:bg-indigo-800 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Required */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name *" required value={form.full_name} onChange={v => set('full_name', v)} placeholder="Your full name" />
              <Field label="Email Address *" type="email" required value={form.email} onChange={v => set('email', v)} placeholder="you@email.com" />
              <Field label="Phone Number" type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="+91 98765 43210" />
              <Field label="Current Company" value={form.current_company} onChange={v => set('current_company', v)} placeholder="Where do you work now?" />
              <Field label="Years of Experience" type="number" value={form.years_of_experience} onChange={v => set('years_of_experience', v)} placeholder="e.g. 3" />
              <Field label="Notice Period" value={form.notice_period} onChange={v => set('notice_period', v)} placeholder="e.g. 30 days" />
              <Field label="Expected Salary (₹/yr)" value={form.expected_salary} onChange={v => set('expected_salary', v)} placeholder="e.g. 6,00,000" />
              <Field label="LinkedIn Profile" type="url" value={form.linkedin_url} onChange={v => set('linkedin_url', v)} placeholder="https://linkedin.com/in/..." />
            </div>
            <Field label="Portfolio / Website" type="url" value={form.portfolio_url} onChange={v => set('portfolio_url', v)} placeholder="https://yourportfolio.com" />

            {/* Cover Letter */}
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-widest mb-1.5">Cover Letter</label>
              <textarea
                value={form.cover_letter}
                onChange={e => set('cover_letter', e.target.value)}
                rows={4}
                placeholder="Tell us why you'd be a great fit..."
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition-all"
              />
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-widest mb-1.5">Resume / CV</label>
              <label className="flex items-center gap-3 border-2 border-dashed border-neutral-200 hover:border-indigo-400 rounded-xl px-4 py-4 cursor-pointer transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-colors">
                  <Upload className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-700">
                    {resumeFile ? resumeFile.name : 'Upload PDF or Word document'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">Max 10MB · PDF, DOC, DOCX</p>
                </div>
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeChange} />
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 text-white font-bold text-sm uppercase tracking-widest px-6 py-3.5 rounded-xl transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadingResume ? 'Uploading Resume…' : 'Submitting…'}
                </>
              ) : (
                <><Send className="w-4 h-4" /> Submit Application</>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

// ─── Job Detail Modal ─────────────────────────────────────────────────────────
function JobDetailModal({ job, onClose, onApply }) {
  const formatSalary = (min, max) => {
    if (!min && !max) return null
    const fmt = n => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${n.toLocaleString()}`
    if (min && max) return `${fmt(min)} – ${fmt(max)} / yr`
    if (min) return `From ${fmt(min)} / yr`
    return `Upto ${fmt(max)} / yr`
  }

  const renderList = (text) => {
    if (!text) return null
    const items = text.split('\n').filter(Boolean)
    if (items.length === 0) return null
    return (
      <ul className="space-y-1.5 mt-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
            {item.replace(/^[-•*]\s*/, '')}
          </li>
        ))}
      </ul>
    )
  }

  const salary = formatSalary(job.salary_min, job.salary_max)
  const deadline = job.application_deadline ? new Date(job.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
        className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl max-h-[95vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-indigo-900 to-indigo-700 text-white px-6 py-5 sm:rounded-t-2xl z-10">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
          {job.is_featured && (
            <span className="inline-block mb-2 text-[9px] font-black uppercase tracking-widest bg-amber-400 text-amber-900 px-2.5 py-0.5 rounded-full">
              ⭐ Featured
            </span>
          )}
          <h2 className="font-serif text-2xl font-bold mb-1">{job.title}</h2>
          <div className="flex flex-wrap gap-3 text-indigo-200 text-xs mt-2">
            {job.department && <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{job.department}</span>}
            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
            {job.employment_type && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.employment_type}</span>}
            {job.experience_level && <span className="flex items-center gap-1"><Star className="w-3 h-3" />{job.experience_level}</span>}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {salary && <span className="flex items-center gap-1 text-xs bg-white/10 px-3 py-1 rounded-full"><IndianRupee className="w-3 h-3" />{salary}</span>}
            {deadline && <span className="flex items-center gap-1 text-xs bg-white/10 px-3 py-1 rounded-full"><Calendar className="w-3 h-3" />Apply by {deadline}</span>}
            {job.positions_available > 1 && <span className="flex items-center gap-1 text-xs bg-white/10 px-3 py-1 rounded-full"><Users className="w-3 h-3" />{job.positions_available} openings</span>}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          {job.description && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">About the Role</h3>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Requirements</h3>
              {renderList(job.requirements)}
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Responsibilities</h3>
              {renderList(job.responsibilities)}
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">What We Offer</h3>
              {renderList(job.benefits)}
            </div>
          )}

          <button
            onClick={() => { onClose(); onApply(job) }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm uppercase tracking-widest px-6 py-3.5 rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" /> Apply for This Role
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Form Field Helper ────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-xs font-bold text-neutral-600 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type} value={value} required={required}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
      />
    </div>
  )
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, onViewDetails, onApply, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: index * 0.07 }}
      className="bg-white border border-neutral-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {job.is_featured && (
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">⭐ Featured</span>
            )}
            {job.department && (
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{job.department}</span>
            )}
            {job.employment_type && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-neutral-500">
                <Clock className="w-3 h-3" /> {job.employment_type}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-neutral-500">
                <MapPin className="w-3 h-3" /> {job.location}
              </span>
            )}
          </div>
          <h3 className="font-serif text-xl font-bold text-neutral-900 mb-2 group-hover:text-indigo-700 transition-colors">{job.title}</h3>
          <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2">{job.description}</p>
          {(job.salary_min || job.salary_max) && (
            <p className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <IndianRupee className="w-3 h-3" />
              {job.salary_min && job.salary_max
                ? `${(job.salary_min/100000).toFixed(1)}L – ${(job.salary_max/100000).toFixed(1)}L / yr`
                : job.salary_min ? `From ₹${(job.salary_min/100000).toFixed(1)}L` : `Upto ₹${(job.salary_max/100000).toFixed(1)}L`}
            </p>
          )}
        </div>
        <div className="flex sm:flex-col gap-2 shrink-0">
          <button
            onClick={() => onViewDetails(job)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 border border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View Details
          </button>
          <button
            onClick={() => onApply(job)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5" /> Apply
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Careers() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(false)
  const [departments, setDepartments] = useState([])
  const [filterDept, setFilterDept] = useState('All')
  const [applyJob, setApplyJob] = useState(null)
  const [detailJob, setDetailJob] = useState(null)

  useEffect(() => {
    Promise.all([
      fetchJSON('/api/careers/jobs'),
      fetchJSON('/api/careers/departments'),
    ])
      .then(([jobsRes, deptsRes]) => {
        const jobList = Array.isArray(jobsRes?.data) ? jobsRes.data : []
        setJobs(jobList)
        setDepartments(['All', ...(Array.isArray(deptsRes?.data) ? deptsRes.data : [])])
      })
      .catch(() => {
        setApiError(true)
        setJobs([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = filterDept === 'All' ? jobs : jobs.filter(j => j.department === filterDept)

  return (
    <div className="min-h-screen bg-white flex flex-col font-outfit">
      <Header />

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-indigo-700 to-blue-500 text-white overflow-hidden">
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-20 left-10 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Careers</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-2xl">
            <p className="text-indigo-300 text-xs font-black uppercase tracking-[0.3em] mb-4">Join Our Team</p>
            <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6">
              Build Something<br /><span className="text-indigo-300">Beautiful</span>
            </h1>
            <p className="text-indigo-100 text-xl leading-relaxed">
              Work at the intersection of fashion, technology, and Indian heritage. Help us bring the world's finest ethnic wear to millions of women.
            </p>
            {!loading && (
              <div className="flex gap-6 mt-8">
                <div className="text-center">
                  <p className="text-3xl font-black">{jobs.length}</p>
                  <p className="text-indigo-300 text-xs uppercase tracking-widest font-bold">Open Roles</p>
                </div>
                <div className="w-px bg-white/20" />
                <div className="text-center">
                  <p className="text-3xl font-black">40+</p>
                  <p className="text-indigo-300 text-xs uppercase tracking-widest font-bold">Team Members</p>
                </div>
                <div className="w-px bg-white/20" />
                <div className="text-center">
                  <p className="text-3xl font-black">5★</p>
                  <p className="text-indigo-300 text-xs uppercase tracking-widest font-bold">Glassdoor</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-neutral-50" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      <main className="flex-1 pb-20 bg-neutral-50">
        <div className="container mx-auto px-4 max-w-5xl pt-4">

          {/* Culture bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-indigo-600 rounded-2xl p-6 md:p-8 text-white text-center mb-12">
            <Users className="w-8 h-8 mx-auto mb-3 text-indigo-300" />
            <h2 className="font-serif text-2xl font-bold mb-2">A Team That Cares</h2>
            <p className="text-indigo-200 text-sm max-w-xl mx-auto">
              We're a passionate team of 40+ people who love fashion, technology, and Indian culture. We believe in work that matters, people who thrive, and a brand that inspires.
            </p>
          </motion.div>

          {/* ── OPEN POSITIONS ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-serif text-3xl font-bold text-neutral-900">
              Open Positions
              {!loading && jobs.length > 0 && (
                <span className="ml-3 text-sm font-sans font-semibold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full align-middle">{jobs.length}</span>
              )}
            </h2>
            {/* dept filter */}
            {departments.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {departments.map(d => (
                  <button key={d} onClick={() => setFilterDept(d)}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors ${filterDept === d ? 'bg-indigo-700 text-white' : 'bg-white text-neutral-500 border border-neutral-200 hover:border-indigo-300'}`}>
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 mb-16">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-6 animate-pulse">
                  <div className="h-3 bg-neutral-100 rounded w-1/4 mb-3" />
                  <div className="h-6 bg-neutral-100 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-neutral-100 rounded w-3/4" />
                </div>
              ))
            ) : apiError ? (
              <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center">
                <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                <h3 className="font-serif text-xl font-bold text-neutral-700 mb-2">Could not load positions</h3>
                <p className="text-sm text-neutral-500">Please check back later or email us at <a href="mailto:careers@shagungallery.com" className="text-indigo-600 underline">careers@shagungallery.com</a></p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center">
                <Briefcase className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <h3 className="font-serif text-xl font-bold text-neutral-600 mb-2">No openings in this department</h3>
                <p className="text-sm text-neutral-400">Try another department filter or check back soon.</p>
              </div>
            ) : (
              filtered.map((job, i) => (
                <JobCard
                  key={job.id} job={job} index={i}
                  onViewDetails={setDetailJob}
                  onApply={setApplyJob}
                />
              ))
            )}
          </div>

          {/* ── BENEFITS ── */}
          <h2 className="font-serif text-3xl font-bold text-neutral-900 mb-8">Why Join Us?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon
              return (
                <motion.div key={b.label}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${b.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-neutral-900 mb-1.5">{b.label}</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{b.desc}</p>
                </motion.div>
              )
            })}
          </div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="font-serif text-2xl font-bold mb-2">Don't see your role?</h3>
              <p className="text-indigo-200 text-sm">Send us your resume and we'll keep you in mind for future openings.</p>
            </div>
            <a href="mailto:careers@shagungallery.com"
              className="shrink-0 inline-flex items-center gap-2 bg-white text-indigo-900 font-bold text-xs uppercase tracking-widest px-7 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors">
              <Mail className="w-4 h-4" /> careers@shagungallery.com
            </a>
          </motion.div>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <AnimatePresence>
        {detailJob && (
          <JobDetailModal
            key="detail"
            job={detailJob}
            onClose={() => setDetailJob(null)}
            onApply={(job) => { setDetailJob(null); setApplyJob(job) }}
          />
        )}
        {applyJob && (
          <ApplyModal
            key="apply"
            job={applyJob}
            onClose={() => setApplyJob(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
