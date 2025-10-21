import * as publicSchema from './public';
import * as coreSchema from './core';
import * as programSchema from './programs';
import * as consumerSchema from './consumer';
import * as partnerSchema from './partners';

/**
 * Combine all schema files into a single export.
 * This is the object you will pass to Drizzle for migrations and queries.
 */
export const schema = {
  ...publicSchema,
  ...coreSchema,
  ...programSchema,
  ...consumerSchema,
  ...partnerSchema,
};

export default schema;

// Re-export individual schemas for convenience
export { publicSchema, coreSchema, programSchema, consumerSchema, partnerSchema };
