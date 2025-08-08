import jwt from 'jsonwebtoken';

export const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

export const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT);
};
