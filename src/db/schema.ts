import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const aiConfigurations = sqliteTable('ai_configurations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),
  name: text('name').notNull(),
  businessName: text('business_name').notNull(),
  businessType: text('business_type').notNull(),
  location: text('location').notNull(),
  expertise: text('expertise').notNull(),
  targetAudience: text('target_audience').notNull(),
  mainService: text('main_service').notNull(),
  brandPersonality: text('brand_personality').notNull(),
  uniqueValue: text('unique_value').notNull(),
  tone: text('tone').notNull(),
  desiredAction: text('desired_action').notNull(),
  wordCount: integer('word_count').notNull().default(3000),
  localKnowledge: text('local_knowledge'),
  language: text('language').notNull().default('es'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),
  configId: integer('config_id').references(() => aiConfigurations.id),
  title: text('title').notNull(),
  keyword: text('keyword').notNull(),
  secondaryKeywords: text('secondary_keywords').notNull(),
  content: text('content').notNull(),
  metaDescription: text('meta_description').notNull(),
  seoTitle: text('seo_title').notNull(),
  wordCount: integer('word_count').notNull(),
  status: text('status').notNull().default('generating'),
  errorMessage: text('error_message'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const contentIdeas = sqliteTable('content_ideas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),
  configId: integer('config_id').references(() => aiConfigurations.id),
  topic: text('topic').notNull(),
  websiteUrl: text('website_url'),
  language: text('language').notNull().default('es'),
  ideas: text('ideas').notNull(),
  status: text('status').notNull().default('generating'),
  errorMessage: text('error_message'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const seoStructures = sqliteTable('seo_structures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),
  configId: integer('config_id').references(() => aiConfigurations.id),
  keyword: text('keyword').notNull(),
  websiteUrl: text('website_url').default(''),
  language: text('language').notNull().default('es'),
  structure: text('structure').notNull(),
  htmlContent: text('html_content').notNull().default(''),
  status: text('status', { enum: ['generating', 'completed', 'error'] }).notNull().default('generating'),
  errorMessage: text('error_message'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),
  configId: integer('config_id').references(() => aiConfigurations.id),
  platformName: text('platform_name').notNull(),
  platformType: text('platform_type').notNull(),
  market: text('market').notNull(),
  content: text('content').notNull().default(''),
  seoTitle: text('seo_title').notNull().default(''),
  metaDescription: text('meta_description').notNull().default(''),
  wordCount: integer('word_count').notNull().default(0),
  status: text('status').notNull().default('generating'),
  errorMessage: text('error_message'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  token: text('token').notNull(),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
});

export const emailVerifications = sqliteTable('email_verifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  code: text('code').notNull(),
  name: text('name'),
  passwordHash: text('password_hash'),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  verified: integer('verified', { mode: 'boolean' }).default(false),
});
