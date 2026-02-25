/**
 * LoginPage — Tenant-aware login with modern aesthetics.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, Lock, Building2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/primitives/Input';
import { Button } from '@/components/primitives/Button';
import useAuthStore from '@/store/authStore';
import { ROUTES } from '@/lib/constants';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [form, setForm] = useState({ email: '', password: '', tenantCode: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form.email, form.password, form.tenantCode);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const roleRoutes: Record<string, string> = {
                student: ROUTES.STUDENT.DASHBOARD,
                faculty: ROUTES.FACULTY.DASHBOARD,
                admin: ROUTES.ADMIN.DASHBOARD,
                hod: ROUTES.HOD.DASHBOARD,
            };
            navigate(roleRoutes[user.role] || '/login');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-surface-50 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
                        <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-surface-900">Welcome back</h1>
                    <p className="text-surface-500 mt-1">Sign in to your attendance portal</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-surface-200/50 border border-surface-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Institution Code"
                            placeholder="Enter your institution code"
                            value={form.tenantCode}
                            onChange={(e) => setForm({ ...form, tenantCode: e.target.value })}
                            leftIcon={<Building2 className="w-4 h-4" />}
                            required
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@institution.edu"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            leftIcon={<Mail className="w-4 h-4" />}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            leftIcon={<Lock className="w-4 h-4" />}
                            required
                        />

                        {error && (
                            <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-surface-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                            Register
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
