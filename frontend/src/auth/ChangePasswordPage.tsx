import { useState } from 'react';
import { Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/primitives/Card';
import api from '@/api/axios';

export default function ChangePasswordPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword });
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ 
                type: 'error', 
                text: err.response?.data?.error || 'Failed to update password. Please check your current password.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-10">
            <Card className="shadow-smooth border-surface-100">
                <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6 text-primary-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-surface-900">Change Password</CardTitle>
                    <p className="text-sm text-surface-500 mt-1">Update your account security credentials</p>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Current Password"
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <div className="pt-2 border-t border-surface-50"></div>
                        <Input
                            label="New Password"
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />

                        {message && (
                            <div className={`p-3 rounded-lg flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
                                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                                {message.type === 'success' ? (
                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                )}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11"
                            loading={loading}
                        >
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
