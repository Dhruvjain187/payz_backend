import "express"

export interface SignupRequest {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
}

export interface UserResponse {
    token: string;
    message: string;
}

export interface SigninRequest {
    username: string;
    password: string;
}



declare module "express-serve-static-core" {
    interface Request {
        userId?: string
    }
}