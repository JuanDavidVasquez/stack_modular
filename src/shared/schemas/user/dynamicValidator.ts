import { SchemasMap } from './user.schema';

export function validateEntity(entityName: string, data: any) {
  const schema = SchemasMap[entityName];
  if (!schema) {
    throw new Error(`No Zod schema found for entity "${entityName}"`);
  }

  return schema.parse(data);
}