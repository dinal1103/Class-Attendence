import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Loader2, Trash2, Mail, Shield, Building2, X, FileUp, Download } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Card, CardContent } from '@/components/primitives/Card';
import { Input } from '@/components/primitives/Input';
import { Badge } from '@/components/primitives/Badge';
import { EmptyState } from '@/components/composite/EmptyState';
import api from '@/api/axios';
import { AlertCircle } from 'lucide-react';

interface StaffUser {
    _id: string;
    name: string;
    email: string;
    role: 'faculty' | 'hod' | 'admin';
    department_id?: { _id: string; name: string; code: string };
    isActive: boolean;
}

interface Department {
    _id: string;
    name: string;
    code: string;
}

export default function AdminStaffManagement() {
    const [users, setUsers] = useState<StaffUser[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBulkUploading, setIsBulkUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'faculty' as 'faculty' | 'hod',
        department_id: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, deptsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/departments')
            ]);
            setUsers(usersRes.data);
            setDepartments(deptsRes.data);
        } catch (err) {
            console.error('Failed to fetch staff data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/admin/users', formData);
            setShowModal(false);
            setFormData({ name: '', email: '', password: '', role: 'faculty', department_id: '' });
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to create user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this user?')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            fetchData();
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsBulkUploading(true);
        try {
            const res = await api.post('/admin/users/bulk', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(res.data.message);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Bulk upload failed');
        } finally {
            setIsBulkUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const downloadTemplate = () => {
        const headers = ["Name", "Email", "Password", "Role", "DepartmentCode"];
        const data = ["John Doe", "john@example.com", "pass123", "faculty", "CS"];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + data.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "staff_template.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-surface-900">Staff Management</h1>
                        <p className="text-surface-500 text-sm mt-1">Manage Faculty and HOD accounts</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="file"
                            id="bulk-upload"
                            className="hidden"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleBulkUpload}
                        />
                        <Button 
                            variant="secondary" 
                            leftIcon={<Download className="w-4 h-4" />} 
                            onClick={downloadTemplate}
                            className="hidden sm:flex"
                        >
                            Template
                        </Button>
                        <Button 
                            variant="secondary" 
                            leftIcon={isBulkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />} 
                            onClick={() => document.getElementById('bulk-upload')?.click()}
                            disabled={isBulkUploading}
                        >
                            Bulk Import
                        </Button>
                        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
                            Add Staff
                        </Button>
                    </div>
                </div>

                {/* Instructions Alert */}
                <Card className="bg-primary-50/50 border-primary-100">
                    <CardContent className="p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-primary-900">How to add Staff Members</p>
                            <p className="text-xs text-primary-700 leading-relaxed">
                                You can add staff members individually using the <strong>Add Staff</strong> button, or in bulk by uploading an Excel file. 
                                For bulk uploads, download the <strong>Template</strong> first to ensure your file has the correct columns: 
                                <code className="mx-1 bg-white/50 px-1 rounded">Name</code>, 
                                <code className="mx-1 bg-white/50 px-1 rounded">Email</code>, 
                                <code className="mx-1 bg-white/50 px-1 rounded">Password</code>, 
                                <code className="mx-1 bg-white/50 px-1 rounded">Role</code> (faculty/hod), and 
                                <code className="mx-1 bg-white/50 px-1 rounded">DepartmentCode</code>.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : users.length === 0 ? (
                    <EmptyState icon="search" title="No staff members" description="Add Faculty or HOD accounts to get started." />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.map(user => (
                            <Card key={user._id} className={!user.isActive ? 'opacity-60' : ''}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-bold text-surface-900 truncate">{user.name}</p>
                                                <Badge variant={user.role === 'hod' ? 'warning' : 'primary'} size="sm">
                                                    {user.role.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-surface-500 mb-2">
                                                <Mail className="w-3 h-3" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-surface-500">
                                                <Building2 className="w-3 h-3" />
                                                <span>{user.department_id?.name || 'No Department'}</span>
                                            </div>
                                        </div>
                                        {user.isActive && (
                                            <button 
                                                onClick={() => handleDeleteUser(user._id)}
                                                className="text-surface-400 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Simple Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative z-10"
                        >
                            <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
                                <h3 className="font-bold text-surface-900">Add New Staff Member</h3>
                                <button onClick={() => setShowModal(false)} className="text-surface-400 hover:text-surface-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                                <Input label="Full Name" required value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                <Input label="Email Address" type="email" required value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                <Input label="Initial Password" type="password" required value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                
                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 mb-1.5 uppercase">Role</label>
                                    <select 
                                        className="w-full h-10 px-3 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                    >
                                        <option value="faculty">Faculty</option>
                                        <option value="hod">HOD</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-surface-500 mb-1.5 uppercase">Department</label>
                                    <select 
                                        className="w-full h-10 px-3 rounded-lg border border-surface-200 bg-surface-50 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={formData.department_id}
                                        required
                                        onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => (
                                            <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                                    <Button variant="primary" className="flex-1" type="submit" loading={isSubmitting}>Create Account</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
