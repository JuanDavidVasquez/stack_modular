import { BaseRepository } from "@/core/repositories/base.repository";

const tableName = process.env.AUTH_TABLE_NAME || "user";
const Entity = require("@/shared/models")[tableName];

export class UserRepository extends BaseRepository<typeof Entity> {
    constructor() {
        super(Entity);
    }

    async findFiltered(filters: Record<string, any>) {
        return this.findWithFilters(filters, tableName);
    }
}
