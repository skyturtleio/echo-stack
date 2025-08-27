/**
 * Project Configuration - Update these values for your project
 *
 * This file contains the main branding and configuration for your application.
 * Update these values when starting a new project from Echo Stack.
 */

export const PROJECT_CONFIG = {
  // Main project information
  name: "echo stack start",
  tagline: "Full-Stack Application",
  description: "Modern full-stack application built with Echo Stack",

  // Branding
  emoji: "🚀",

  // Meta information
  author: "skyturtleio",
  version: "0.0.1",
} as const;

export type ProjectConfig = typeof PROJECT_CONFIG;
