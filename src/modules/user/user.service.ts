import { UserRepository } from "./user.repository";
import { t, SupportedLocale } from "../../locales/i18n.config";
import { FindUsersOptions } from "@/shared/interfaces/findUserOptions.interface";

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

            return {
                data: result.items || [],
                page,
                limit,
                rows: result.rows || 0
            };
        } catch (error) {
            console.error('Service error getting users:', error);
            throw new Error(t('common.errors.serverError', locale));
        }
    }

    /**
     * Obtener usuario por ID
     */
    async getUserById(id: string, locale: SupportedLocale = 'es') {
        try {
            if (!id || id.trim() === '') {
                throw new Error(t('common.errors.badRequest', locale));
            }

            const user = await this.userRepository.findById(id);
            
            if (!user) {
                return null;
            }

            return this.removeSensitiveFields(user);
        } catch (error) {
            console.error('Service error getting user by ID:', error);
            throw new Error(t('common.errors.serverError', locale));
        }
    }

    /**
     * Crear nuevo usuario
     */
    async createUser(data: Record<string, any>, locale: SupportedLocale = 'es') {
        try {
            await this.validateUserCreation(data, locale);

            const normalizedData = this.normalizeUserData(data);

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

            const user = await this.userRepository.create(userWithDefaults);

            return this.removeSensitiveFields(user);
        } catch (error) {
            console.error('Service error creating user:', error);
            throw error;
        }
    }

    /**
     * Actualizar usuario
    */
    async updateUser(id: string, data: Record<string, any>, locale: SupportedLocale = 'es') {
        try {
            if (!id || id.trim() === '') {
                throw new Error(t('common.errors.badRequest', locale));
            }

            const existingUser = await this.userRepository.findById(id);
            if (!existingUser) {
                throw new Error(t('user.messages.notFound', locale));
            }

            const normalizedData = this.normalizeUserData(data);
            normalizedData.updatedAt = new Date();

            await this.userRepository.update(id, normalizedData);

            const updatedUser = await this.userRepository.findById(id);
            return this.removeSensitiveFields(updatedUser);
        } catch (error) {
            console.error('Service error updating user:', error);
            throw error;
        }
    }

    /**
     * Eliminar usuario (soft delete)
    */
    async deleteUser(id: string, locale: SupportedLocale = 'es') {
        try {
            if (!id || id.trim() === '') {
                throw new Error(t('common.errors.badRequest', locale));
            }

            const existingUser = await this.userRepository.findById(id);
            if (!existingUser) {
                throw new Error(t('user.messages.notFound', locale));
            }

            const success = await this.userRepository.softDelete(id);
            if (!success) {
                throw new Error(t('common.errors.serverError', locale));
            }

            return true;
        } catch (error) {
            console.error('Service error deleting user:', error);
            throw error;
        }
    }

    /**
     * Validaciones de negocio para creación de usuario
     */
    private async validateUserCreation(data: Record<string, any>, locale: SupportedLocale) {
        if (!data.firstName) throw new Error(t('user.validation.firstName.required', locale));
        if (!data.lastName) throw new Error(t('user.validation.lastName.required', locale));
        if (!data.email) throw new Error(t('user.validation.email.required', locale));
        if (!data.password) throw new Error(t('user.validation.password.required', locale));

        // Validar formato de email
        if (data.email && !this.isValidEmail(data.email)) {
            throw new Error(t('user.validation.email.invalid', locale));
        }

        // Validar longitud de password
        if (data.password && data.password.length < 8) {
            throw new Error(
                t('user.validation.password.minLength', locale).replace('{{min}}', '8')
            );
        }

        // Verificar si el email ya existe
        if (data.email) {
            const existingEmail = await this.userRepository.findFiltered({
                filters: { email: data.email.toLowerCase().trim() },
                selectFields: ['id'],
                page: 0,
                limit: 1
            });
            if (existingEmail.items.length > 0) {
                throw new Error(t('user.messages.alreadyExists', locale));
            }
        }

        // Verificar si el username ya existe
        if (data.username) {
            const existingUsername = await this.userRepository.findFiltered({
                filters: { username: data.username.toLowerCase().trim() },
                selectFields: ['id'],
                page: 0,
                limit: 1
            });
            if (existingUsername.items.length > 0) {
                throw new Error(t('user.validation.username.text', locale));
            }
        }
    }

    /**
     * Normalizar datos del usuario
     */
    private normalizeUserData(data: Record<string, any>) {
        const normalized = { ...data };
        if (normalized.email) normalized.email = normalized.email.toLowerCase().trim();
        if (normalized.username) normalized.username = normalized.username.toLowerCase().trim();
        if (normalized.firstName) normalized.firstName = normalized.firstName.trim();
        if (normalized.lastName) normalized.lastName = normalized.lastName.trim();
        return normalized;
    }

    /**
     * Remover campos sensibles del usuario
     */
    private removeSensitiveFields(user: any) {
        const sensitiveFields = [
            'password', 'resetPasswordToken', 'resetPasswordExpires',
            'verificationCode', 'verificationCodeExpires', 'loginAttempts',
            'lockedUntil', 'lastLoginIp', 'lastUserAgent'
        ];
        const safeUser = { ...user };
        sensitiveFields.forEach(field => delete safeUser[field]);
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
     * Buscar por email
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
     * Buscar por username
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
