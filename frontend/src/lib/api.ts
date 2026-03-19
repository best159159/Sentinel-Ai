// Thin axios wrapper now points to Next.js API Routes (same origin)
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export default api;
