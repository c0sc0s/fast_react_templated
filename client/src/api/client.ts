// src/api/request.ts
import clientLocalStorage from '@/util/localStorage';
import axios from 'axios';

export const apiBaseURL = 'http://127.0.0.1:3001/api/v1';

const Request = axios.create({
    baseURL: apiBaseURL,
    timeout: 10000,
});

Request.interceptors.request.use(
    (config) => {
        const token = clientLocalStorage.getAuthToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 响应拦截器
Request.interceptors.response.use(
    (response) => {
        const { data } = response;
        if (data.success) {
            // 只返回业务 data
            return data.data;
        } else {
            // 业务错误，抛出 message 或 error
            return Promise.reject(data.error || data.message || '未知错误');
        }
    },
    (error) => {
        // 网络或服务器错误
        return Promise.reject(error.response.data.error || error.response.data.message || '未知错误');
    }
);

export default Request;