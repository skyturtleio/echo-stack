# Echo Stack Frontend Patterns

Common patterns for building React components and frontend functionality in Echo Stack applications.

## TanStack Router Patterns

### 1. Basic Route Component

```typescript
// src/routes/users.tsx
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { getUsers } from "./api/users"

export const Route = createFileRoute("/users")({
  component: UsersPage
})

function UsersPage() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  })

  if (isLoading) return <div className="loading">Loading users...</div>
  if (error) return <div className="error">Error: {error.message}</div>
  if (!users) return <div>No users found</div>

  return (
    <div className="users-page">
      <h1>Users</h1>
      <UserList users={users} />
    </div>
  )
}
```

### 2. Route with Parameters

```typescript
// src/routes/users/$userId.tsx
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { getUserById } from "../api/users"

export const Route = createFileRoute("/users/$userId")({
  component: UserDetailPage
})

function UserDetailPage() {
  const { userId } = Route.useParams()

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId),
  })

  if (isLoading) return <UserSkeleton />
  if (error) return <ErrorDisplay error={error} />
  if (!user) return <NotFound resource="User" />

  return (
    <div className="user-detail">
      <UserProfile user={user} />
      <UserActions userId={userId} />
    </div>
  )
}
```

### 3. Protected Route

```typescript
// src/routes/dashboard.tsx
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useAuth } from "~/lib/auth-context"

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ context }) => {
    const { user } = context.auth
    if (!user) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: "/dashboard" }
      })
    }
  },
  component: Dashboard
})

function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.name}!</h1>
      <DashboardContent />
    </div>
  )
}
```

## Component Patterns

### 1. Data Fetching Component

```typescript
// src/components/UserProfile.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserProfile, updateUserProfile } from "~/routes/api/profile"
import { toast } from "~/lib/toast"

interface UserProfileProps {
  userId: string
}

export function UserProfile({ userId }: UserProfileProps) {
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getUserProfile(userId),
  })

  const updateMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] })
      toast.success("Profile updated successfully!")
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`)
    }
  })

  const handleUpdateProfile = (data: UpdateProfileData) => {
    updateMutation.mutate({ userId, ...data })
  }

  if (isLoading) return <ProfileSkeleton />

  return (
    <div className="user-profile">
      <ProfileHeader profile={profile} />
      <ProfileForm
        profile={profile}
        onSubmit={handleUpdateProfile}
        isLoading={updateMutation.isPending}
      />
    </div>
  )
}
```

### 2. Form Component with Validation

```typescript
// src/components/CreateUserForm.tsx
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { createUser } from "~/routes/api/users"
import { Button } from "~/components/ui/Button"
import { Input } from "~/components/ui/Input"
import { toast } from "~/lib/toast"

const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
})

type CreateUserData = z.infer<typeof CreateUserSchema>

interface CreateUserFormProps {
  onSuccess?: (user: User) => void
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const [formData, setFormData] = useState<CreateUserData>({
    name: "",
    email: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("User created successfully!")
      setFormData({ name: "", email: "" })
      setErrors({})
      onSuccess?.(user)
    },
    onError: (error) => {
      toast.error(`Failed to create user: ${error.message}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data
    const result = CreateUserSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as string] = error.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    createMutation.mutate(result.data)
  }

  const handleInputChange = (field: keyof CreateUserData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="create-user-form">
      <div className="form-group">
        <Input
          label="Name"
          type="text"
          value={formData.name}
          onChange={handleInputChange("name")}
          error={errors.name}
          required
        />
      </div>

      <div className="form-group">
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleInputChange("email")}
          error={errors.email}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={createMutation.isPending}
        loading={createMutation.isPending}
      >
        Create User
      </Button>
    </form>
  )
}
```

### 3. Error Boundary Component

```typescript
// src/components/ui/ErrorBoundary.tsx
import React from "react"
import { Button } from "./Button"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)

    // Log to error tracking service in production
    if (process.env.NODE_ENV === "production") {
      // logErrorToService(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} reset={this.handleReset} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="error-boundary">
      <h2>Something went wrong</h2>
      <details>
        <summary>Error details</summary>
        <pre>{error.message}</pre>
      </details>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

## Authentication Patterns

### 1. Auth Context Provider

```typescript
// src/lib/auth-context.tsx
import React, { createContext, useContext, useEffect, useState } from "react"
import { authClient } from "./auth.client"

interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession()
        if (session?.user) {
          setUser(session.user as User)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth state changes
    const unsubscribe = authClient.onAuthStateChange((user) => {
      setUser(user as User | null)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    const { user } = await authClient.signIn.email({ email, password })
    setUser(user as User)
  }

  const signOut = async () => {
    await authClient.signOut()
    setUser(null)
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { user } = await authClient.signUp.email({ email, password, name })
    setUser(user as User)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signOut,
    signUp,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

### 2. Protected Component

```typescript
// src/components/ProtectedRoute.tsx
import { useAuth } from "~/lib/auth-context"
import { Navigate, useLocation } from "@tanstack/react-router"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireEmailVerified?: boolean
}

export function ProtectedRoute({
  children,
  requireEmailVerified = false
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="loading">Checking authentication...</div>
  }

  if (!user) {
    return (
      <Navigate
        to="/sign-in"
        search={{ redirect: location.pathname }}
        replace
      />
    )
  }

  if (requireEmailVerified && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  return <>{children}</>
}
```

## State Management Patterns

### 1. URL State Management

```typescript
// src/routes/users.tsx
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

const UsersSearchSchema = z.object({
  page: z.number().optional().default(1),
  search: z.string().optional().default(""),
  sortBy: z.enum(["name", "email", "createdAt"]).optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
})

export const Route = createFileRoute("/users")({
  validateSearch: UsersSearchSchema,
  component: UsersPage
})

function UsersPage() {
  const { page, search, sortBy, sortOrder } = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", { page, search, sortBy, sortOrder }],
    queryFn: () => getUsers({ page, search, sortBy, sortOrder }),
  })

  const updateSearch = (newSearch: Partial<typeof UsersSearchSchema._type>) => {
    navigate({
      search: { page, search, sortBy, sortOrder, ...newSearch },
      replace: true
    })
  }

  return (
    <div className="users-page">
      <UserFilters
        search={search}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSearchChange={(search) => updateSearch({ search, page: 1 })}
        onSortChange={(sortBy, sortOrder) => updateSearch({ sortBy, sortOrder })}
      />

      <UserList users={users} />

      <Pagination
        currentPage={page}
        onPageChange={(page) => updateSearch({ page })}
      />
    </div>
  )
}
```

### 2. Form State with React Hook Form

```typescript
// src/components/UserForm.tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"

const UserFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["user", "admin"]),
  bio: z.string().optional(),
})

type UserFormData = z.infer<typeof UserFormSchema>

interface UserFormProps {
  initialData?: Partial<UserFormData>
  onSubmit: (data: UserFormData) => Promise<void>
}

export function UserForm({ initialData, onSubmit }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<UserFormData>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: initialData
  })

  const submitMutation = useMutation({
    mutationFn: onSubmit,
    onSuccess: () => {
      reset()
      toast.success("User saved successfully!")
    },
    onError: (error) => {
      toast.error(`Failed to save user: ${error.message}`)
    }
  })

  return (
    <form onSubmit={handleSubmit(data => submitMutation.mutate(data))}>
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          {...register("name")}
          id="name"
          type="text"
          className={errors.name ? "error" : ""}
        />
        {errors.name && <span className="error-text">{errors.name.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          {...register("email")}
          id="email"
          type="email"
          className={errors.email ? "error" : ""}
        />
        {errors.email && <span className="error-text">{errors.email.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="role">Role</label>
        <select {...register("role")} id="role">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && <span className="error-text">{errors.role.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="bio">Bio</label>
        <textarea {...register("bio")} id="bio" rows={4} />
        {errors.bio && <span className="error-text">{errors.bio.message}</span>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || submitMutation.isPending}
      >
        {isSubmitting || submitMutation.isPending ? "Saving..." : "Save User"}
      </button>
    </form>
  )
}
```

## UI Component Patterns

### 1. Reusable Button Component

```typescript
// src/components/ui/Button.tsx
import React from "react"
import { cn } from "~/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-500",
  }

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm rounded",
    md: "px-4 py-2 text-base rounded-md",
    lg: "px-6 py-3 text-lg rounded-lg",
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
```

### 2. Data Table Component

```typescript
// src/components/ui/DataTable.tsx
interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], item: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  onSort?: (key: keyof T, direction: "asc" | "desc") => void
  sortKey?: keyof T
  sortDirection?: "asc" | "desc"
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  onSort,
  sortKey,
  sortDirection
}: DataTableProps<T>) {
  const handleSort = (key: keyof T) => {
    if (!onSort) return

    const newDirection = sortKey === key && sortDirection === "asc" ? "desc" : "asc"
    onSort(key, newDirection)
  }

  if (loading) {
    return <TableSkeleton columns={columns.length} rows={5} />
  }

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <p>No data available</p>
      </div>
    )
  }

  return (
    <div className="data-table">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key as string}
                className={column.sortable ? "sortable" : ""}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                {column.label}
                {column.sortable && sortKey === column.key && (
                  <span className="sort-indicator">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key as string}>
                  {column.render
                    ? column.render(item[column.key], item)
                    : String(item[column.key] ?? "")
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

## Performance Patterns

### 1. Optimistic Updates

```typescript
// src/hooks/useOptimisticMutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface OptimisticMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  queryKey: string[]
  updateFn: (oldData: TData[], variables: TVariables) => TData[]
  onError?: (error: Error, variables: TVariables, context: unknown) => void
}

export function useOptimisticMutation<TData, TVariables>({
  mutationFn,
  queryKey,
  updateFn,
  onError,
}: OptimisticMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData[]>(queryKey)

      // Optimistically update
      if (previousData) {
        const optimisticData = updateFn(previousData, variables)
        queryClient.setQueryData(queryKey, optimisticData)
      }

      return { previousData }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      onError?.(error, variables, context)
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
```

### 2. Virtual Scrolling for Large Lists

```typescript
// src/components/VirtualList.tsx
import { useVirtualizer } from "@tanstack/react-virtual"
import { useRef } from "react"

interface VirtualListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  estimatedItemHeight?: number
  overscan?: number
}

export function VirtualList<T>({
  items,
  renderItem,
  estimatedItemHeight = 50,
  overscan = 5
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan
  })

  return (
    <div
      ref={parentRef}
      className="virtual-list-container"
      style={{ height: "400px", overflow: "auto" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative"
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            {renderItem(items[virtualItem.index]!, virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  )
}
```

These patterns provide a solid foundation for building maintainable, performant React applications with Echo Stack. Each pattern follows TypeScript best practices and integrates seamlessly with the Effect.ts backend services.
