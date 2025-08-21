/**
 * Project Configuration - Update these values for your project
 *
 * This file contains the main branding and configuration for your application.
 * Update these values when starting a new project from Echo Stack.
 */

export const PROJECT_CONFIG = {
  // Main project information
  name: "Echo Stack",
  tagline: "Single-Seat Full-Stack Starter",
  description: "Production-ready full-stack starter kit for solo developers",

  // Branding
  emoji: "✈️",

  // Meta information
  author: "Echo Squadron",
  version: "1.0.0",
} as const

export type ProjectConfig = typeof PROJECT_CONFIG
