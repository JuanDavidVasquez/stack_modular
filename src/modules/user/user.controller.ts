import { Request, Response } from "express";
import { UserService } from "./user.service";
import { t, SupportedLocale } from "../../locales/i18n.config";
import { getLocale } from "@/shared/utils/getLocale.util";

export class UserController {

    constructor(private userService: UserService) {}

    /**
     * POST /users/list
     * Consulta usuarios con filtros y paginado
     */
    listUsers = async (req: Request, res: Response): Promise<void> => {
        const locale: SupportedLocale = getLocale(req);
        
        try {
            const { filters = {}, page = 0, limit = 10 } = req.body;

            const result = await this.userService.getUsers({ filters, page, limit }, locale);

            res.json({
                message: t('user.messages.listSuccess', locale),
                data: result
            });
        } catch (error) {
            console.error('Error listing users:', error);
            res.status(500).json({ 
                message: t('common.errors.serverError', locale),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * POST /users/get
     * Obtener un usuario por ID
     */
    getUserById = async (req: Request, res: Response) => {
        const locale: SupportedLocale = getLocale(req);
        
        try {
            const { id } = req.body;
            
            if (!id) {
                return res.status(400).json({ 
                    message: t('common.errors.badRequest', locale),
                    details: "ID is required"
                });
            }

            const user = await this.userService.getUserById(id, locale);

            if (!user) {
                return res.status(404).json({ 
                    message: t('user.messages.notFound', locale)
                });
            }

            return res.json({
                message: t('user.messages.getSuccess', locale),
                data: user
            });
        } catch (error) {
            console.error('Error getting user by ID:', error);
            return res.status(500).json({ 
                message: t('common.errors.serverError', locale),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * POST /users/create
     * Crear un nuevo usuario
     */
    createUser = async (req: Request, res: Response) => { 
        const locale: SupportedLocale = getLocale(req);

        try {
            const data = req.body;
            
            if (!data || Object.keys(data).length === 0) {
                return res.status(400).json({ 
                    message: t('common.errors.badRequest', locale),
                    details: "User data is required"
                });
            }

            // Validaciones básicas usando i18n
            if (!data.email) {
                return res.status(400).json({ message: t('user.validation.email.required', locale) });
            }
            if (!data.firstName) {
                return res.status(400).json({ message: t('user.validation.firstName.required', locale) });
            }
            if (!data.lastName) {
                return res.status(400).json({ message: t('user.validation.lastName.required', locale) });
            }
            if (!data.password) {
                return res.status(400).json({ message: t('user.validation.password.required', locale) });
            }

            const user = await this.userService.createUser(data, locale);

            return res.status(201).json({
                message: t('user.messages.created', locale),
                data: user
            });
        } catch (error) {
            console.error('Error creating user:', error);
            
            // Si es un error específico (ej: email ya existe)
            if (error instanceof Error && error.message.includes('already exists')) {
                return res.status(409).json({ message: t('user.messages.alreadyExists', locale) });
            }
            
            return res.status(500).json({ 
                message: t('common.errors.serverError', locale),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
