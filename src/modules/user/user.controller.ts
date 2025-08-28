import { Request, Response } from "express";
import { UserService } from "./user.service";
import { ResponseUtil } from "@/shared/utils/response.util";

export class UserController {

    constructor(private userService: UserService) {}

    /**
     * POST /users/list
     * Consulta usuarios con filtros y paginado
     */
    listUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const { filters = {}, page = 0, limit = 10 } = req.body;

            const result = await this.userService.getUsers({ filters, page, limit });

            // Si el resultado incluye información de paginación
            if (result.rows !== undefined) {
                ResponseUtil.paginated(
                    req, 
                    res, 
                    'user.messages.listSuccess', 
                    result.data,
                    result.rows,
                    page,
                    limit
                );
            } else {
                ResponseUtil.success(req, res, 'user.messages.listSuccess', result);
            }
        } catch (error) {
            console.error('Error listing users:', error);
            ResponseUtil.error(
                req, 
                res, 
                'common.errors.serverError', 
                500,
                null,
                null,
                error instanceof Error ? [error.message] : ['Unknown error']
            );
        }
    }

    /**
     * GET /users/:id
     * Obtener un usuario por ID
     */
    getUserById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            
            if (!id) {
                return ResponseUtil.validationError(
                    req, 
                    res, 
                    'common.errors.badRequest', 
                    ['ID is required']
                );
            }

            const user = await this.userService.getUserById(id);

            if (!user) {
                return ResponseUtil.notFound(req, res, 'user.messages.notFound');
            }

            return ResponseUtil.success(req, res, 'user.messages.getSuccess', user);
        } catch (error) {
            console.error('Error getting user by ID:', error);
            return ResponseUtil.error(
                req, 
                res, 
                'common.errors.serverError', 
                500,
                null,
                null,
                error instanceof Error ? [error.message] : ['Unknown error']
            );
        }
    }

    /**
     * POST /users/create
     * Crear un nuevo usuario
     */
    createUser = async (req: Request, res: Response) => { 
        try {
            const data = req.body;
            
            if (!data || Object.keys(data).length === 0) {
                return ResponseUtil.validationError(
                    req, 
                    res, 
                    'common.errors.badRequest',
                    ['User data is required']
                );
            }

            // Validaciones básicas
            const validationErrors: string[] = [];
            if (!data.email) validationErrors.push('Email is required');
            if (!data.firstName) validationErrors.push('First name is required');
            if (!data.lastName) validationErrors.push('Last name is required');
            if (!data.password) validationErrors.push('Password is required');

            if (validationErrors.length > 0) {
                return ResponseUtil.validationError(
                    req, 
                    res, 
                    'common.errors.validation',
                    validationErrors
                );
            }

            const user = await this.userService.createUser(data);

            return ResponseUtil.success(
                req, 
                res, 
                'user.messages.created', 
                user, 
                201
            );
        } catch (error) {
            console.error('Error creating user:', error);
            
            // Si es un error específico (ej: email ya existe)
            if (error instanceof Error && error.message.includes('already exists')) {
                return ResponseUtil.conflict(req, res, 'user.messages.alreadyExists');
            }
            
            return ResponseUtil.error(
                req, 
                res, 
                'common.errors.serverError', 
                500,
                null,
                null,
                error instanceof Error ? [error.message] : ['Unknown error']
            );
        }
    }

    /**
     * PUT /users/update/:id
     * Actualizar un usuario existente
     */
    updateUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const data = req.body;

            if (!id) {
                return ResponseUtil.validationError(
                    req, 
                    res, 
                    'common.errors.badRequest',
                    ['ID is required']
                );
            }

            if (!data || Object.keys(data).length === 0) {
                return ResponseUtil.validationError(
                    req, 
                    res, 
                    'common.errors.badRequest',
                    ['Update data is required']
                );
            }

            const updatedUser = await this.userService.updateUser(id, data);

            return ResponseUtil.success(req, res, 'user.messages.updated', updatedUser);
        } catch (error) {
            console.error('Error updating user:', error);
            
            // Si es un error específico (ej: usuario no encontrado)
            if (error instanceof Error && error.message.includes('not found')) {
                return ResponseUtil.notFound(req, res, 'user.messages.notFound');
            }

            return ResponseUtil.error(
                req, 
                res, 
                'common.errors.serverError', 
                500,
                null,
                null,
                error instanceof Error ? [error.message] : ['Unknown error']
            );
        }
    }

    /**
     * DELETE /users/delete/:id
     * Eliminar (soft delete) un usuario por ID
     */
    deleteUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            if (!id) {
                return ResponseUtil.validationError(
                    req, 
                    res, 
                    'common.errors.badRequest',
                    ['ID is required']
                );
            }

            const success = await this.userService.deleteUser(id);

            if (!success) {
                return ResponseUtil.notFound(req, res, 'user.messages.notFound');
            }

            return ResponseUtil.success(req, res, 'user.messages.deleted');
        } catch (error) {
            console.error('Error deleting user:', error);
            return ResponseUtil.error(
                req, 
                res, 
                'common.errors.serverError', 
                500,
                null,
                null,
                error instanceof Error ? [error.message] : ['Unknown error']
            );
        }
    }
}