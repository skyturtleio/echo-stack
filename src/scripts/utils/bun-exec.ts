/**
 * Bun-native command execution utilities
 *
 * Replaces Node.js child_process with Bun's superior APIs for better performance
 */

import { Effect, Duration } from "effect"

export interface CommandResult {
  stdout: string
  stderr: string
  exitCode: number
}

/**
 * Execute a shell command using Bun's $ template literal API
 * More efficient and easier to use than Node.js child_process.exec
 */
export const execCommand = (
  command: string,
): Effect.Effect<CommandResult, Error, never> =>
  Effect.tryPromise({
    try: async () => {
      // Use Bun.$ for shell-like command execution with better error handling
      const proc = await Bun.$`sh -c ${command}`.quiet()

      return {
        stdout: proc.stdout.toString().trim(),
        stderr: proc.stderr.toString().trim(),
        exitCode: proc.exitCode,
      }
    },
    catch: (error) => new Error(`Command execution failed: ${error}`),
  })

/**
 * Execute PostgreSQL commands with proper error handling
 */
export const psqlCommand = (
  connectionUrl: string,
  query: string,
): Effect.Effect<CommandResult, Error, never> =>
  Effect.gen(function* () {
    const command = `psql "${connectionUrl}" -c "${query}"`
    return yield* execCommand(command)
  })

/**
 * Execute Drizzle Kit commands
 */
export const drizzleCommand = (
  subcommand: string,
): Effect.Effect<CommandResult, Error, never> =>
  execCommand(`bun x drizzle-kit ${subcommand}`)

/**
 * Execute a script with timeout
 */
export const execWithTimeout = (
  command: string,
  timeoutMs: number = 30000,
): Effect.Effect<CommandResult, Error, never> =>
  execCommand(command).pipe(
    Effect.timeout(Duration.millis(timeoutMs)),
    Effect.catchAll(() =>
      Effect.succeed({
        stdout: "",
        stderr: "Command timed out",
        exitCode: 1,
      }),
    ),
  )
