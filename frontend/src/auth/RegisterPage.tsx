/**
 * RegisterPage — Multi-tenant user registration.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, Lock, Building2, User, IdCard, ArrowRight } from 'lucide-react';
import { Input } from '@/components/primitives/Input';
import { Button } from '@/components/primitives/Button';
import useAuthStore from '@/store/authStore';
import { ROUTES } from '@/lib/constants';

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuthStore();
    const [form, setForm] = useState({
        name: '', email: '', password: '', role: 'student',
        tenantCode: '', departmentId: '', enrollmentId: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const roleRoutes: Record<string, string> = {
                student: ROUTES.STUDENT.DASHBOARD,
                faculty: ROUTES.FACULTY.DASHBOARD,
                admin: ROUTES.ADMIN.DASHBOARD,
                hod: ROUTES.HOD.DASHBOARD,
            };
            navigate(roleRoutes[user.role] || '/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-surface-50 px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
                        <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-surface-900">Create account</h1>
                    <p className="text-surface-500 mt-1">Join your institution's attendance portal</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-surface-200/50 border border-surface-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Full Name" placeholder="Your name" value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            leftIcon={<User className="w-4 h-4" />} required />

                        <Input label="Institution Code" placeholder="e.g. IITB" value={form.tenantCode}
                            onChange={(e) => setForm({ ...form, tenantCode: e.target.value })}
                            leftIcon={<Building2 className="w-4 h-4" />} required />

                        <Input label="Department ID" placeholder="Department ObjectId" value={form.departmentId}
                            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                            leftIcon={<IdCard className="w-4 h-4" />} required />

                        <Input label="Email" type="email" placeholder="you@institution.edu" value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            leftIcon={<Mail className="w-4 h-4" />} required />

                        <Input label="Password" type="password" placeholder="Min 8 characters" value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            leftIcon={<Lock className="w-4 h-4" />} required />

                        {/* Role Selector */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-surface-700">Role</label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                className="flex h-10 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                                <option value="hod">HOD</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {form.role === 'student' && (
                            <Input label="Enrollment ID" placeholder="e.g. 2024CS001" value={form.enrollmentId}
                                onChange={(e) => setForm({ ...form, enrollmentId: e.target.value })}
                                leftIcon={<IdCard className="w-4 h-4" />} />
                        )}

                        {error && (
                            <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm font-medium">{error}</div>
                        )}

                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Account'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-surface-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign In</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
