import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const versions = sqliteTable('survey_versions', {
  id: text('id').primaryKey(),
  questions: text('questions').notNull(),
  createdAt: text('created_at').notNull(),
});
export const settings = sqliteTable('survey_settings', {
  id: integer('id').primaryKey(),
  version: text('version').notNull(),
  endpoint: text('endpoint').notNull(),
  ready: integer('ready').notNull().default(0),
});
