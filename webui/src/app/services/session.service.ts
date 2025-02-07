import { Injectable } from '@angular/core';
import axios from 'axios';
import { User } from '../../../../server/src/types/user.js';

@Injectable({
    providedIn: 'root'
})
export class SessionService {
    connected = false;
    userInfo = {
        email: '',
        level: 0,
        fullname: '',
        uid: ''
    };

    constructor() {
        axios.interceptors.request.use(config => {
            const authToken = localStorage.getItem('authToken');
            if (authToken) {
                config.headers.Authorization = `Bearer ${authToken}`;
            }
            return config;
        });

        axios.interceptors.response.use(function (response) {
            return response.data;
        }, function (error) {
            return Promise.reject(error);
        });
    }

    getUserInfos(): Promise<User> {
        return axios.get('/api/session/user');
    }

    getAllUsers() {
        return axios.get('/api/user/list');
    }

    logout() {
        return axios.delete('/api/session');
    }

    loginUser(email: string, password: string) {
        return axios.post('/api/session/login', { email, password });
    }

    recover(email: string) {
        return axios.post('/api/reset', { email });
    }

    update(uid: number, level: number) {
        return axios.put(`/api/session/users/${uid}`, { level });
    }

    updatePhone(uid: number, phone: string) {
        return axios.put(`/api/session/users/phone/${uid}`, { phone });
    }

    changePasswordByToken(email: string, token: string, password: string) {
        return axios.post('/api/session/password', { email, token, password });
    }

    register(firstname: string, lastname: string, email: string, phone: string, password: string) {
        return axios.post('/api/session/register', { firstname, lastname, email, password, phone });
    }

    simpleToken() {
        return axios.get('/api/session/token');
    }
}
