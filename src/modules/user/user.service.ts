import { UserRepository } from "./user.repository";
import { t, SupportedLocale } from "../../locales/i18n.config";

// Interfaz para opciones de búsqueda
interface FindUsersOptions {
    filters?: Record<string, any>;
    selectFields?: string[];
    page?: number;
    limit?: number;
}

export class UserService {
    constructor(private userRepository: UserRepository) {}

    /**
     * Obtener usuarios con filtros
     */
    async getUsers(options: FindUsersOptions, locale: SupportedLocale = 'es') {
        try {
            const { filters = {}, page = 0, limit = 10 } = options;
            const selectFields = ["id", "username", "email", "firstName", "lastName", "createdAt", "updatedAt"];
            
            const result = await this.userRepository.findFiltered({
                filters,
                selectFields,
                page,
                limit,
            });

            // Calcular totalPages

            return {
                data: result.items || [],
                page,
                limit,
                total: result.rows || 0
            };
        } catch (error) {
            console.error('Service error getting users:', error);
            throw new Error(`Failed to retrieve users: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Obtener usuario por ID
     */
    async getUserById(id: string, locale: SupportedLocale = 'es') {
        try {
            if (!id || id.trim() === '') {
                throw new Error('User ID is required');
            }

            // Tu BaseRepository tiene findById
            const user = await this.userRepository.findById(id);
            
            if (!user) {
                return null;
            }

            // Remover campos sensibles si existen
            const safeUser = this.removeSensitiveFields(user);
            
            return safeUser;
        } catch (error) {
            console.error('Service error getting user by ID:', error);
            throw new Error(`Failed to retrieve user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Crear nuevo usuario
     */
    async createUser(data: Record<string, any>, locale: SupportedLocale = 'es') {
        try {
            // Validaciones adicionales de negocio
            await this.validateUserCreation(data, locale);

            // Normalizar datos
            const normalizedData = this.normalizeUserData(data);

            // Agregar valores por defecto
            const userWithDefaults = {
                ...normalizedData,
                status: data.status || 'active',
                provider: data.provider || 'local',
                isEmailVerified: data.isEmailVerified || false,
                loginCount: data.loginCount || 0,
                loginAttempts: data.loginAttempts || 0,
                locale: data.locale || locale,
                timezone: data.timezone || 'UTC',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Tu BaseRepository tiene create
            const user = await this.userRepository.create(userWithDefaults);

            // Remover campos sensibles antes de retornar
            const safeUser = this.removeSensitiveFields(user);
            
            return safeUser;
        } catch (error) {
            console.error('Service error creating user:', error);
            throw error; 
        }
    }

    /**
     * Validaciones de negocio para creación de usuario
     */
    private async validateUserCreation(data: Record<string, any>, locale: SupportedLocale) {
        // Verificar si el email ya existe usando tu sistema de filtros
        if (data.email) {
            const existingEmailResult = await this.userRepository.findFiltered({
                filters: { email: data.email.toLowerCase().trim() },
                selectFields: ['id'],
                page: 0,
                limit: 1
            });
            
            if (existingEmailResult.items.length > 0) {
                throw new Error('User with this email already exists');
            }
        }

        // Verificar si el username ya existe
        if (data.username) {
            const existingUsernameResult = await this.userRepository.findFiltered({
                filters: { username: data.username.toLowerCase().trim() },
                selectFields: ['id'],
                page: 0,
                limit: 1
            });
            
            if (existingUsernameResult.items.length > 0) {
                throw new Error('Username already taken');
            }
        }

        // Validar formato de email
        if (data.email && !this.isValidEmail(data.email)) {
            throw new Error('Invalid email format');
        }

        // Validar longitud de password
        if (data.password && data.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
    }

    /**
     * Normalizar datos del usuario
     */
    private normalizeUserData(data: Record<string, any>) {
        const normalized = { ...data };
        
        if (normalized.email) {
            normalized.email = normalized.email.toLowerCase().trim();
        }
        
        if (normalized.username) {
            normalized.username = normalized.username.toLowerCase().trim();
        }
        
        if (normalized.firstName) {
            normalized.firstName = normalized.firstName.trim();
        }
        
        if (normalized.lastName) {
            normalized.lastName = normalized.lastName.trim();
        }
        
        return normalized;
    }

    /**
     * Remover campos sensibles del usuario
     */
    private removeSensitiveFields(user: any) {
        const sensitiveFields = [
            'password',
            'resetPasswordToken', 
            'resetPasswordExpires',
            'verificationCode',
            'verificationCodeExpires',
            'loginAttempts',
            'lockedUntil',
            'lastLoginIp',
            'lastUserAgent'
        ];

        const safeUser = { ...user };
        
        sensitiveFields.forEach(field => {
            if (safeUser.hasOwnProperty(field)) {
                delete safeUser[field];
            }
        });
        
        return safeUser;
    }

    /**
     * Validar formato de email
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * buscar por email
     */
    async findByEmail(email: string) {
        const result = await this.userRepository.findFiltered({
            filters: { email: email.toLowerCase().trim() },
            page: 0,
            limit: 1
        });
        
        return result.items.length > 0 ? result.items[0] : null;
    }

    /**
     * buscar por username
     */
    async findByUsername(username: string) {
        const result = await this.userRepository.findFiltered({
            filters: { username: username.toLowerCase().trim() },
            page: 0,
            limit: 1
        });
        
        return result.items.length > 0 ? result.items[0] : null;
    }
}