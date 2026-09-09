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

export const adminAccess = sqliteTable('admin_access', {
  email: text('email').primaryKey(),
  enabled: integer('enabled').notNull(),
  updatedAt: text('updated_at').notNull(),
  updatedBy: text('updated_by').notNull(),
});
