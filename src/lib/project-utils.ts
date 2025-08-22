/**
 * Project Utilities - Dynamic project name resolution
 *
 * This utility provides dynamic project naming based on package.json
 * to ensure each project has unique identifiers for JWT issuers,
 * service contexts, and other project-specific values.
 */

import { readFileSync } from "fs"
import { join } from "path"

/**
 * Get the project name from package.json
 * This is used for generating unique identifiers across the application
 */
export function getProjectName(): string {
  try {
    const packagePath = join(process.cwd(), "package.json")
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"))
    return packageJson.name || "echo-stack-app"
  } catch {
    console.warn("Could not read package.json, falling back to default name")
    return "echo-stack-app"
  }
}

/**
 * Generate JWT issuer name based on project
 * Format: project-name (kebab-case)
 */
export function getJWTIssuer(): string {
  return getProjectName()
}

/**
 * Generate service context tag based on project
 * Format: @project-name/ServiceName
 */
export function getServiceContext(serviceName: string): string {
  return `@${getProjectName()}/${serviceName}`
}

/**
 * Generate normalized project name for database contexts
 * Converts hyphens to underscores for database compatibility
 */
export function getNormalizedProjectName(): string {
  return getProjectName().replace(/-/g, "_")
}

/**
 * Generate database URL with project-specific database name
 */
export function getProjectDatabaseUrl(environment: "dev" | "test"): string {
  const projectName = getNormalizedProjectName()
  return `postgresql://user:password@localhost:5432/${projectName}_${environment}`
}

/**
 * Generate test JWT issuer name
 */
export function getTestJWTIssuer(): string {
  return `${getProjectName()}-test`
}
