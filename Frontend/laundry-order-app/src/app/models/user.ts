export interface User {
    id: string;
    userName: string;
    email: string;
    firstName?: string;
    lastName?: string;
    token?: string;
    roles?: string[];
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    userName: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export interface AuthResponse {
    token: string;
    expiration: string;
    userId: string;
    userName: string;
    roles: string[];
}
