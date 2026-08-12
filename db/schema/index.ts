import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations, InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('user_role', ['user', 'admin']);
export const assetStatusEnum = pgEnum('asset_status', ['available', 'borrowed', 'maintenance', 'retired']);
export const borrowStatusEnum = pgEnum('borrow_status', [
  'pending',
  'approved',
  'rejected',
  'borrowed',
  'returned',
  'overdue',
  'cancelled',
]);
export const announcementCategoryEnum = pgEnum('announcement_category', [
  'important',
  'update',
  'security',
  'maintenance',
]);

// 1. Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  department: varchar('department', { length: 255 }),
  role: roleEnum('role').notNull().default('user'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// 2. Categories Table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 100 }).notNull().default('box'),
  description: text('description'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// 3. Assets Table
export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  asset_tag: varchar('asset_tag', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  category_id: integer('category_id').notNull(),
  model: varchar('model', { length: 255 }),
  serial_number: varchar('serial_number', { length: 255 }),
  status: assetStatusEnum('status').notNull().default('available'),
  location: varchar('location', { length: 255 }),
  borrow_duration_days: integer('borrow_duration_days').notNull().default(7),
  description: text('description'),
  image_url: text('image_url'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// 4. Borrow Requests Table
export const borrow_requests = pgTable('borrow_requests', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  asset_id: integer('asset_id').notNull(),
  request_date: timestamp('request_date').notNull().defaultNow(),
  expected_return_date: timestamp('expected_return_date').notNull(),
  actual_return_date: timestamp('actual_return_date'),
  duration_days: integer('duration_days').notNull().default(7),
  status: borrowStatusEnum('status').notNull().default('pending'),
  purpose: text('purpose').notNull(),
  admin_note: text('admin_note'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// 5. Activity Logs Table
export const activity_logs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  request_id: integer('request_id'),
  user_id: integer('user_id').notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  details: text('details'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// 6. Sessions Table for Database Authentication
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  user_id: integer('user_id').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// 7. Announcements Table
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  category: announcementCategoryEnum('category').notNull().default('important'),
  is_pinned: boolean('is_pinned').notNull().default(false),
  image_urls: text('image_urls'),
  published_at: timestamp('published_at').notNull().defaultNow(),
  created_by: integer('created_by').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// RELATIONS
export const usersRelations = relations(users, ({ many }) => ({
  borrowRequests: many(borrow_requests),
  activityLogs: many(activity_logs),
  sessions: many(sessions),
  announcements: many(announcements),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.user_id],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  assets: many(assets),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  category: one(categories, {
    fields: [assets.category_id],
    references: [categories.id],
  }),
  borrowRequests: many(borrow_requests),
}));

export const borrowRequestsRelations = relations(borrow_requests, ({ one, many }) => ({
  user: one(users, {
    fields: [borrow_requests.user_id],
    references: [users.id],
  }),
  asset: one(assets, {
    fields: [borrow_requests.asset_id],
    references: [assets.id],
  }),
  activityLogs: many(activity_logs),
}));

export const activityLogsRelations = relations(activity_logs, ({ one }) => ({
  user: one(users, {
    fields: [activity_logs.user_id],
    references: [users.id],
  }),
  borrowRequest: one(borrow_requests, {
    fields: [activity_logs.request_id],
    references: [borrow_requests.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, {
    fields: [announcements.created_by],
    references: [users.id],
  }),
}));

// INFERRED TYPES
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type Asset = InferSelectModel<typeof assets>;
export type NewAsset = InferInsertModel<typeof assets>;

export type BorrowRequest = InferSelectModel<typeof borrow_requests>;
export type NewBorrowRequest = InferInsertModel<typeof borrow_requests>;

export type ActivityLog = InferSelectModel<typeof activity_logs>;
export type NewActivityLog = InferInsertModel<typeof activity_logs>;

export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

export type Announcement = InferSelectModel<typeof announcements>;
export type NewAnnouncement = InferInsertModel<typeof announcements>;
