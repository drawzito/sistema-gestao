import axios from 'axios';

const api = axios.create({
    baseURL: '' // Base URL is empty because we use the Vite proxy in development or relative paths in production
});

export const getFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path; // Cloudinary URL
    return `/api/uploads/${path}`; // Local upload URL (Vercel won't persist this, but it's here for dev)
};

export default api;
