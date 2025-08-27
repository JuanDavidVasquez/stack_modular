import { Repository, DeepPartial, SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "@/core/database/data-source";

export class BaseRepository<T extends Record<string, any>> {
    protected repository: Repository<T>;

    constructor(entity: new () => T) {
        this.repository = AppDataSource.getRepository(entity);
    }

    async findById(id: string): Promise<T | null> {
        return this.repository.findOne({ where: { id } as any });
    }

    async create(data: DeepPartial<T>): Promise<T> {
        console.log('Creating entity with data:', data);
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    async findAll(): Promise<T[]> {
        return this.repository.find();
    }

    /**
     * Filtros dinámicos con selección de columnas
     * @param filters Objeto con filtros { key: value }
     * @param alias Alias de la entidad en la query
     * @param selectFields Array de campos a seleccionar
     */
    async findWithFilters(
        filters: Record<string, any>,
        alias = "entity",
        selectFields?: string[],
        page = 0,
        limit = 10
    ): Promise<{ items: T[]; rows: number }> {
        let queryBuilder: SelectQueryBuilder<T> = this.repository.createQueryBuilder(alias);

        // Selección dinámica de columnas
        if (selectFields && selectFields.length > 0) {
            const selectColumns = selectFields.map((field) => `${alias}.${field}`);
            queryBuilder = queryBuilder.select(selectColumns);
        }

        // Aplicar filtros
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryBuilder = queryBuilder.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
            }
        });

        // Contar total antes de paginar
        const rows = await queryBuilder.getCount();

        // Calcular "skip" según la página
        const skip = (page-1) * limit;

        // Aplicar paginado
        const items = await queryBuilder.skip(skip).take(limit).getMany();

        return { items, rows };
    }

}
