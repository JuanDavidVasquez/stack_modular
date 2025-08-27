import { BaseRepository } from "@/core/repositories/base.repository";

const tableName = process.env.AUTH_TABLE_NAME || "user";
console.log(`Using auth table: ${tableName}`);
const Entity = require("@/shared/models")[tableName];

export class UserRepository extends BaseRepository<typeof Entity> {
  constructor() {
    super(Entity);
  }
  async findFiltered(options: {
    filters?: Record<string, any>;
    selectFields?: string[];
    page?: number;
    limit?: number;
  }) {
    const { filters = {}, selectFields, page = 0, limit = 10 } = options;
    return this.findWithFilters(filters, tableName, selectFields, page, limit);
  }
}
