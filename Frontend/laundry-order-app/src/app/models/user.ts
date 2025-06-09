export interface User {
    id: string;
    userName: string;
    email: string;
    firstName?: string;
    lastName?: string;
    token?: string;
    tokenExpiration?: string;
    roles?: string[];
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
}

export interface AuthResponse {
    token: string;
    expiration: string;
    userId: string;
    userName: string;
    roles: string[];
}
