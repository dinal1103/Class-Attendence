import { create } from 'zustand';
import api from '@/api/axios';

export type UserRole = 'student' | 'faculty' | 'admin' | 'hod';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    tenant_id: string;
    department_id: string;
    isEnrolled: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string, tenantCode: string) => Promise<void>;
    register: (data: {
        name: string;
        email: string;
        password: string;
        role: string;
        tenantCode: string;
        departmentId: string;
        enrollmentId?: string;
    }) => Promise<void>;
    logout: () => void;
    initialize: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,

    initialize: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                set({ user, token, isAuthenticated: true, isLoading: false });
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({ isLoading: false });
            }
        } else {
            set({ isLoading: false });
        }
    },

    login: async (email, password, tenantCode) => {
        const res = await api.post('/auth/login', { email, password, tenantCode });
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },

    register: async (data) => {
        const res = await api.post('/auth/register', data);
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    },
}));

export default useAuthStore;
