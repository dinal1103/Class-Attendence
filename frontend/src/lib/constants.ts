export const ROUTES = {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',

    STUDENT: {
        DASHBOARD: '/student',
        CLASSES: '/student/classes',
        ATTENDANCE: '/student/attendance',
        FACE_ENROLL: '/student/face-enroll',
        DISPUTES: '/student/disputes',
    },

    FACULTY: {
        DASHBOARD: '/faculty',
        CLASSES: '/faculty/classes',
        ATTENDANCE: '/faculty/attendance',
        DISPUTES: '/faculty/disputes',
    },

    ADMIN: {
        DASHBOARD: '/admin',
        ENROLLMENTS: '/admin/enrollments',
        OVERRIDES: '/admin/overrides',
        REPORTS: '/admin/reports',
    },

    HOD: {
        DASHBOARD: '/hod',
        APPROVALS: '/hod/approvals',
        AUDIT: '/hod/audit',
        OVERRIDES: '/hod/overrides',
    },
} as const;
