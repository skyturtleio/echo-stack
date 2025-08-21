# Echo Stack Database Patterns

Common patterns for database operations, schema design, and data management using Drizzle ORM with Effect.ts in Echo Stack applications.

## Schema Design Patterns

### 1. Basic Table Definition

```typescript
// src/server/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  json,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").unique().notNull(),
    name: text("name").notNull(),
    emailVerified: boolean("email_verified").default(false),
    avatar: text("avatar"),
    bio: text("bio"),
    preferences: json("preferences").$type<UserPreferences>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIndex: uniqueIndex("users_email_idx").on(table.email),
    createdAtIndex: index("users_created_at_idx").on(table.createdAt),
  }),
)

interface UserPreferences {
  theme: "light" | "dark"
  notifications: {
    email: boolean
    push: boolean
  }
}

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

### 2. Relationships and Foreign Keys

```typescript
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    published: boolean("published").default(false),
    authorId: uuid("author_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    categoryId: uuid("category_id").references(() => categories.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    authorIndex: index("posts_author_idx").on(table.authorId),
    publishedIndex: index("posts_published_idx").on(table.published),
    titleIndex: index("posts_title_idx").on(table.title),
  }),
)

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}))
```

### 3. Enum Types and Constraints

```typescript
import { pgEnum } from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "moderator"])
export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "published",
  "archived",
])

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  // ... other fields
})

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: postStatusEnum("status").default("draft").notNull(),
  // ... other fields
})
```

## Database Service Patterns

### 1. Repository Pattern with Effect.ts

```typescript
// src/lib/repositories/user-repository.ts
import { Context, Effect, Layer } from "effect"
import { eq, and, desc, count, like, sql } from "drizzle-orm"
import { DatabaseService } from "~/server/db/database-service"
import { users, type User, type NewUser } from "~/server/db/schema"
import { Logger } from "~/lib/logger-service"

export interface UserFilters {
  email?: string
  role?: string
  emailVerified?: boolean
  search?: string
}

export interface PaginationOptions {
  page: number
  limit: number
}

export class UserRepository extends Context.Tag("UserRepository")<
  UserRepository,
  {
    readonly create: (data: NewUser) => Effect.Effect<User, DatabaseError>
    readonly findById: (id: string) => Effect.Effect<User | null, DatabaseError>
    readonly findByEmail: (
      email: string,
    ) => Effect.Effect<User | null, DatabaseError>
    readonly findMany: (
      filters?: UserFilters,
      pagination?: PaginationOptions,
    ) => Effect.Effect<{ users: User[]; total: number }, DatabaseError>
    readonly update: (
      id: string,
      data: Partial<NewUser>,
    ) => Effect.Effect<User, DatabaseError>
    readonly delete: (id: string) => Effect.Effect<void, DatabaseError>
  }
>() {}

export type DatabaseError =
  | { readonly _tag: "DatabaseError"; readonly error: unknown }
  | { readonly _tag: "NotFound"; readonly id: string }
  | { readonly _tag: "UniqueConstraintViolation"; readonly field: string }

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService
    const logger = yield* Logger

    return {
      create: (data: NewUser) =>
        Effect.gen(function* () {
          yield* logger.debug("Creating user", { email: data.email })

          const result = yield* Effect.tryPromise({
            try: () => db.insert(users).values(data).returning(),
            catch: (error) => {
              if (error instanceof Error && error.message.includes("unique")) {
                return {
                  _tag: "UniqueConstraintViolation" as const,
                  field: "email",
                }
              }
              return { _tag: "DatabaseError" as const, error }
            },
          })

          yield* logger.success("User created successfully", {
            userId: result[0]?.id,
          })

          return result[0]!
        }),

      findById: (id: string) =>
        Effect.gen(function* () {
          const result = yield* Effect.tryPromise({
            try: () => db.select().from(users).where(eq(users.id, id)),
            catch: (error) => ({ _tag: "DatabaseError" as const, error }),
          })

          return result[0] || null
        }),

      findByEmail: (email: string) =>
        Effect.gen(function* () {
          const result = yield* Effect.tryPromise({
            try: () => db.select().from(users).where(eq(users.email, email)),
            catch: (error) => ({ _tag: "DatabaseError" as const, error }),
          })

          return result[0] || null
        }),

      findMany: (filters?: UserFilters, pagination?: PaginationOptions) =>
        Effect.gen(function* () {
          const page = pagination?.page ?? 1
          const limit = pagination?.limit ?? 10
          const offset = (page - 1) * limit

          // Build where conditions
          const conditions = []

          if (filters?.email) {
            conditions.push(eq(users.email, filters.email))
          }

          if (filters?.role) {
            conditions.push(eq(users.role, filters.role))
          }

          if (filters?.emailVerified !== undefined) {
            conditions.push(eq(users.emailVerified, filters.emailVerified))
          }

          if (filters?.search) {
            conditions.push(like(users.name, `%${filters.search}%`))
          }

          const whereClause =
            conditions.length > 0 ? and(...conditions) : undefined

          // Get total count
          const [totalResult, usersResult] = yield* Effect.all([
            Effect.tryPromise({
              try: () =>
                db.select({ count: count() }).from(users).where(whereClause),
              catch: (error) => ({ _tag: "DatabaseError" as const, error }),
            }),
            Effect.tryPromise({
              try: () =>
                db
                  .select()
                  .from(users)
                  .where(whereClause)
                  .orderBy(desc(users.createdAt))
                  .limit(limit)
                  .offset(offset),
              catch: (error) => ({ _tag: "DatabaseError" as const, error }),
            }),
          ])

          return {
            users: usersResult,
            total: totalResult[0]?.count ?? 0,
          }
        }),

      update: (id: string, data: Partial<NewUser>) =>
        Effect.gen(function* () {
          yield* logger.debug("Updating user", { userId: id })

          const result = yield* Effect.tryPromise({
            try: () =>
              db
                .update(users)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(users.id, id))
                .returning(),
            catch: (error) => ({ _tag: "DatabaseError" as const, error }),
          })

          if (result.length === 0) {
            return yield* Effect.fail({ _tag: "NotFound" as const, id })
          }

          yield* logger.success("User updated successfully", { userId: id })

          return result[0]!
        }),

      delete: (id: string) =>
        Effect.gen(function* () {
          yield* logger.debug("Deleting user", { userId: id })

          const result = yield* Effect.tryPromise({
            try: () => db.delete(users).where(eq(users.id, id)).returning(),
            catch: (error) => ({ _tag: "DatabaseError" as const, error }),
          })

          if (result.length === 0) {
            return yield* Effect.fail({ _tag: "NotFound" as const, id })
          }

          yield* logger.success("User deleted successfully", { userId: id })
        }),
    }
  }),
)
```

### 2. Transaction Patterns

```typescript
// src/lib/services/post-service.ts
import { Context, Effect, Layer } from "effect"
import { DatabaseService } from "~/server/db/database-service"
import { UserRepository } from "~/lib/repositories/user-repository"
import { PostRepository } from "~/lib/repositories/post-repository"

export class PostService extends Context.Tag("PostService")<
  PostService,
  {
    readonly createPostWithAuthor: (
      authorData: NewUser,
      postData: NewPost,
    ) => Effect.Effect<{ user: User; post: Post }, PostServiceError>
  }
>() {}

export const PostServiceLive = Layer.effect(
  PostService,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService
    const userRepo = yield* UserRepository
    const postRepo = yield* PostRepository
    const logger = yield* Logger

    return {
      createPostWithAuthor: (authorData: NewUser, postData: NewPost) =>
        Effect.gen(function* () {
          yield* logger.info("🛫 Taking off: creating post with new author")

          // Use database transaction
          const result = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                // Create user first
                const userResult = await tx
                  .insert(users)
                  .values(authorData)
                  .returning()
                const user = userResult[0]!

                // Create post with the new user's ID
                const postResult = await tx
                  .insert(posts)
                  .values({
                    ...postData,
                    authorId: user.id,
                  })
                  .returning()
                const post = postResult[0]!

                return { user, post }
              }),
            catch: (error) => ({ _tag: "DatabaseError" as const, error }),
          })

          yield* logger.success(
            "🛬 Landing: post and author created successfully",
            {
              userId: result.user.id,
              postId: result.post.id,
            },
          )

          return result
        }),
    }
  }),
)
```

### 3. Advanced Query Patterns

```typescript
// src/lib/repositories/analytics-repository.ts
export class AnalyticsRepository extends Context.Tag("AnalyticsRepository")<
  AnalyticsRepository,
  {
    readonly getUserStats: (
      userId: string,
    ) => Effect.Effect<UserStats, DatabaseError>
    readonly getPostAnalytics: (
      dateRange: DateRange,
    ) => Effect.Effect<PostAnalytics[], DatabaseError>
  }
>() {}

export const AnalyticsRepositoryLive = Layer.effect(
  AnalyticsRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService

    return {
      getUserStats: (userId: string) =>
        Effect.gen(function* () {
          // Complex query with subqueries and aggregations
          const result = yield* Effect.tryPromise({
            try: () =>
              db
                .select({
                  userId: users.id,
                  userName: users.name,
                  totalPosts: sql<number>`count(${posts.id})`,
                  publishedPosts: sql<number>`count(case when ${posts.published} then 1 end)`,
                  draftPosts: sql<number>`count(case when not ${posts.published} then 1 end)`,
                  firstPost: sql<Date>`min(${posts.createdAt})`,
                  lastPost: sql<Date>`max(${posts.createdAt})`,
                })
                .from(users)
                .leftJoin(posts, eq(posts.authorId, users.id))
                .where(eq(users.id, userId))
                .groupBy(users.id, users.name),
            catch: (error) => ({ _tag: "DatabaseError" as const, error }),
          })

          return result[0] || null
        }),

      getPostAnalytics: (dateRange: DateRange) =>
        Effect.gen(function* () {
          // Time-series query with date truncation
          const result = yield* Effect.tryPromise({
            try: () =>
              db
                .select({
                  date: sql<string>`date_trunc('day', ${posts.createdAt})`,
                  totalPosts: sql<number>`count(*)`,
                  publishedPosts: sql<number>`count(case when ${posts.published} then 1 end)`,
                  uniqueAuthors: sql<number>`count(distinct ${posts.authorId})`,
                })
                .from(posts)
                .where(
                  and(
                    sql`${posts.createdAt} >= ${dateRange.start}`,
                    sql`${posts.createdAt} <= ${dateRange.end}`,
                  ),
                )
                .groupBy(sql`date_trunc('day', ${posts.createdAt})`)
                .orderBy(sql`date_trunc('day', ${posts.createdAt})`),
            catch: (error) => ({ _tag: "DatabaseError" as const, error }),
          })

          return result
        }),
    }
  }),
)
```

## Migration Patterns

### 1. Creating Migrations

```bash
# Generate a new migration
bun run db:generate

# The generated file will be in src/server/db/migrations/
# Rename it to be descriptive:
# From: 20240101123456_random_name.sql
# To:   20240101123456_add_user_preferences.sql
```

### 2. Complex Migration Example

```sql
-- 20240101123456_add_user_preferences.sql

-- Add new columns
ALTER TABLE "users" ADD COLUMN "preferences" json;
ALTER TABLE "users" ADD COLUMN "avatar" text;

-- Create new enum type
CREATE TYPE "user_role" AS ENUM('user', 'admin', 'moderator');

-- Add role column with default
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;

-- Create new table
CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text UNIQUE NOT NULL,
  "slug" text UNIQUE NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key to existing table
ALTER TABLE "posts" ADD COLUMN "category_id" uuid;
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id");

-- Create indexes
CREATE INDEX "users_role_idx" ON "users" ("role");
CREATE INDEX "posts_category_idx" ON "posts" ("category_id");
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" ("slug");

-- Insert default data
INSERT INTO "categories" ("name", "slug", "description") VALUES
  ('General', 'general', 'General discussion topics'),
  ('Tech', 'tech', 'Technology related posts'),
  ('News', 'news', 'News and announcements');
```

### 3. Data Migration with Script

```typescript
// src/scripts/migrate-user-preferences.ts
import { Effect } from "effect"
import { AppLive } from "~/lib/app-services"
import { DatabaseService } from "~/server/db/database-service"
import { Logger } from "~/lib/logger-service"
import { users } from "~/server/db/schema"

const migrateUserPreferences = Effect.gen(function* () {
  const { db } = yield* DatabaseService
  const logger = yield* Logger

  yield* logger.info("🛫 Taking off: migrating user preferences")

  // Get all users without preferences
  const usersToMigrate = yield* Effect.tryPromise(() =>
    db.select().from(users).where(isNull(users.preferences)),
  )

  yield* logger.info(`Found ${usersToMigrate.length} users to migrate`)

  // Migrate in batches
  const batchSize = 100
  for (let i = 0; i < usersToMigrate.length; i += batchSize) {
    const batch = usersToMigrate.slice(i, i + batchSize)

    yield* Effect.all(
      batch.map((user) =>
        Effect.tryPromise(() =>
          db
            .update(users)
            .set({
              preferences: {
                theme: "light",
                notifications: {
                  email: true,
                  push: false,
                },
              },
            })
            .where(eq(users.id, user.id)),
        ),
      ),
      { concurrency: 10 },
    )

    yield* logger.info(`Migrated batch ${Math.floor(i / batchSize) + 1}`)
  }

  yield* logger.success("🛬 Landing: user preferences migration completed")
})

// Run the migration
Effect.runPromise(migrateUserPreferences.pipe(Effect.provide(AppLive))).catch(
  console.error,
)
```

## Performance Optimization Patterns

### 1. Database Indexing Strategy

```typescript
// src/server/db/schema.ts

// 1. Primary key indexes (automatic)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(), // Automatic index
  // ...
})

// 2. Unique constraint indexes
export const users = pgTable("users", {
  // ...
  email: text("email").unique().notNull(), // Automatic unique index
})

// 3. Foreign key indexes (recommended)
export const posts = pgTable(
  "posts",
  {
    // ...
    authorId: uuid("author_id")
      .references(() => users.id)
      .notNull(),
  },
  (table) => ({
    // Index on foreign key for JOIN performance
    authorIndex: index("posts_author_idx").on(table.authorId),
  }),
)

// 4. Query-specific indexes
export const posts = pgTable(
  "posts",
  {
    // ...
  },
  (table) => ({
    // Composite index for common query patterns
    statusAuthorIndex: index("posts_status_author_idx").on(
      table.published,
      table.authorId,
    ),

    // Partial index for published posts only
    publishedCreatedIndex: index("posts_published_created_idx")
      .on(table.createdAt)
      .where(eq(table.published, true)),
  }),
)
```

### 2. Query Optimization Patterns

```typescript
// src/lib/repositories/optimized-queries.ts

export class OptimizedQueriesRepository extends Context.Tag(
  "OptimizedQueriesRepository",
)<
  OptimizedQueriesRepository,
  {
    readonly getPostsWithAuthors: (
      limit: number,
    ) => Effect.Effect<PostWithAuthor[]>
    readonly searchPosts: (query: string) => Effect.Effect<Post[]>
  }
>() {}

export const OptimizedQueriesRepositoryLive = Layer.effect(
  OptimizedQueriesRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService

    return {
      // Efficient JOIN query
      getPostsWithAuthors: (limit: number) =>
        Effect.tryPromise(() =>
          db
            .select({
              id: posts.id,
              title: posts.title,
              content: posts.content,
              createdAt: posts.createdAt,
              author: {
                id: users.id,
                name: users.name,
                email: users.email,
              },
            })
            .from(posts)
            .innerJoin(users, eq(posts.authorId, users.id))
            .where(eq(posts.published, true))
            .orderBy(desc(posts.createdAt))
            .limit(limit),
        ),

      // Full-text search with proper indexing
      searchPosts: (query: string) =>
        Effect.tryPromise(() =>
          db
            .select()
            .from(posts)
            .where(
              and(
                eq(posts.published, true),
                sql`to_tsvector('english', ${posts.title} || ' ' || ${posts.content}) 
                    @@ plainto_tsquery('english', ${query})`,
              ),
            )
            .orderBy(
              sql`ts_rank(
                to_tsvector('english', ${posts.title} || ' ' || ${posts.content}),
                plainto_tsquery('english', ${query})
              ) DESC`,
            ),
        ),
    }
  }),
)
```

### 3. Connection Pool Optimization

```typescript
// src/server/db/database-service.ts
import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"

export const DatabaseServiceLive = Layer.effect(
  DatabaseService,
  Effect.gen(function* () {
    const { config } = yield* ConfigService

    // Optimized connection pool configuration
    const pool = new Pool({
      connectionString: config.database.url,
      // Connection pool settings
      min: 2, // Minimum connections
      max: 20, // Maximum connections
      acquireTimeoutMillis: 30000, // 30 second timeout
      idleTimeoutMillis: 600000, // 10 minute idle timeout

      // Performance optimizations
      allowExitOnIdle: true,
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,

      // SSL configuration for production
      ssl:
        config.nodeEnv === "production" ? { rejectUnauthorized: false } : false,
    })

    const db = drizzle(pool, { schema })

    return {
      db,
      healthCheck: () =>
        Effect.gen(function* () {
          const result = yield* Effect.tryPromise(() =>
            db.execute(sql`SELECT 1 as health`),
          )
          return { status: "healthy", connections: pool.totalCount }
        }),
    }
  }),
)
```

## Testing Patterns

### 1. Database Test Setup

```typescript
// test/helpers/db-test-setup.ts
import { Effect, Layer } from "effect"
import { createPool } from "@vercel/postgres"
import { migrate } from "drizzle-orm/vercel-postgres/migrator"
import { DatabaseService } from "~/server/db/database-service"

export const TestDatabaseServiceLive = Layer.effect(
  DatabaseService,
  Effect.gen(function* () {
    // Use test database
    const testDbUrl =
      process.env.TEST_DATABASE_URL ||
      "postgresql://test:test@localhost:5432/echo_stack_test"

    const pool = createPool({ connectionString: testDbUrl })
    const db = drizzle(pool, { schema })

    // Run migrations for test database
    yield* Effect.tryPromise(() =>
      migrate(db, { migrationsFolder: "./src/server/db/migrations" }),
    )

    return {
      db,
      cleanup: () => Effect.tryPromise(() => pool.end()),
      healthCheck: () => Effect.succeed({ status: "healthy" as const }),
    }
  }),
)
```

### 2. Repository Testing

```typescript
// test/integration/user-repository.test.ts
import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { Effect } from "effect"
import { UserRepository } from "~/lib/repositories/user-repository"
import { TestAppLive, cleanupDatabase } from "../helpers/test-setup"

describe("UserRepository", () => {
  beforeEach(async () => {
    await Effect.runPromise(cleanupDatabase().pipe(Effect.provide(TestAppLive)))
  })

  test("should create and find user by email", async () => {
    const userData = {
      email: "test@example.com",
      name: "Test User",
      emailVerified: true,
    }

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const userRepo = yield* UserRepository

        // Create user
        const createdUser = yield* userRepo.create(userData)
        expect(createdUser.email).toBe(userData.email)

        // Find by email
        const foundUser = yield* userRepo.findByEmail(userData.email)
        expect(foundUser?.id).toBe(createdUser.id)

        return { createdUser, foundUser }
      }).pipe(Effect.provide(TestAppLive)),
    )

    expect(result.foundUser?.name).toBe(userData.name)
  })

  test("should handle unique constraint violations", async () => {
    const userData = {
      email: "duplicate@example.com",
      name: "Test User",
    }

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const userRepo = yield* UserRepository

        // Create first user
        yield* userRepo.create(userData)

        // Try to create duplicate
        const duplicateResult = yield* Effect.either(userRepo.create(userData))

        return duplicateResult
      }).pipe(Effect.provide(TestAppLive)),
    )

    expect(result._tag).toBe("Left")
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UniqueConstraintViolation")
    }
  })
})
```

These database patterns provide a comprehensive foundation for building robust, performant database operations in Echo Stack applications. Each pattern follows Effect.ts best practices and integrates seamlessly with Drizzle ORM for type-safe database operations.
