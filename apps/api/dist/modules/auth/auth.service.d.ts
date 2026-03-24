import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly jwtService;
    constructor(jwtService: JwtService);
    login(email: string, _password: string): Promise<{
        access_token: string;
        user: {
            email: string;
            name: string;
        };
    }>;
    createApiKey(userId: string, name: string): Promise<{
        apiKey: string;
        name: string;
    }>;
}
