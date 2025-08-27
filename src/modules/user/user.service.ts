import { UserRepository } from "./user.repository";

interface FindUsersOptions {
  filters?: Record<string, any>;
  selectFields?: string[];
  page?: number;
  limit?: number;
}

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Obtener usuarios con filtros, columnas seleccionadas y paginado
   */
  async getUsers(options: FindUsersOptions) {
    const { filters = {}, selectFields, page = 0, limit = 10 } = options;

    // Usamos directamente findFiltered del repository
    const result = await this.userRepository.findFiltered({
      filters,
      selectFields,
      page,
      limit,
    });

    return result; // { data: T[], total: number }
  }

  /**
   * Obtener un usuario por ID
   */
  async getUserById(id: string) {
    return this.userRepository.findById(id);
  }

  /**
   * Crear un nuevo usuario
   */
  async createUser(data: Record<string, any>) {
    return this.userRepository.create(data);
  }
}
