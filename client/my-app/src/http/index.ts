import axios from 'axios';
import {AuthResponse} from "../models/response/AuthResponse.js";
import {store} from "../index";
import {IUser} from "../models/IUser";

export const API_URL = `http://localhost:5000/api`

const $api = axios.create({
    withCredentials: true,
    baseURL: API_URL
})

$api.interceptors.request.use((config) => {
    if (!config) {
        config = {};
    }
    if (!config.headers) {
        config.headers = {};
    }

    /* if (!config?.headers) {
        throw new Error(`Expected 'config' and 'config.headers' not to be undefined`);
    } */

    config.headers.Authorization= `Bearer ${localStorage.getItem('token')}`;
    return config;
});

export default $api;