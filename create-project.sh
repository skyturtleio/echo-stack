#!/bin/bash

# 🛩️ Echo Stack Project Creator
# Simple script to clone Echo Stack and set up a new project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}✈️${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if project name is provided
if [ -z "$1" ]; then
    print_error "Usage: ./create-project.sh <project-name>"
    echo "Example: ./create-project.sh my-awesome-app"
    exit 1
fi

PROJECT_NAME="$1"
ECHO_STACK_PATH="$(pwd)"

# Validate project name
if [[ ! "$PROJECT_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    print_error "Project name should only contain letters, numbers, hyphens, and underscores"
    exit 1
fi

# Check if directory already exists
if [ -d "$PROJECT_NAME" ]; then
    print_error "Directory '$PROJECT_NAME' already exists"
    exit 1
fi

print_status "Creating new Echo Stack project: $PROJECT_NAME"

# Clone the project
print_status "Copying Echo Stack files..."
cp -r "$ECHO_STACK_PATH" "$PROJECT_NAME"

# Navigate to new project
cd "$PROJECT_NAME"

# Clean up git history
print_status "Cleaning up git history..."
rm -rf .git
git init
git add .
git commit -m "Initial commit from Echo Stack"

# Remove the creation script from the new project
rm -f create-project.sh

# Update configuration files automatically
print_status "Updating configuration files..."

# Update package.json
print_status "Updating package.json..."
if command -v jq >/dev/null 2>&1; then
    # Use jq if available for precise JSON editing
    jq --arg name "$PROJECT_NAME" \
       --arg desc "Full-stack application built with Echo Stack" \
       '.name = $name | .description = $desc | .repository.url = "git+https://github.com/your-username/\($name).git"' \
       package.json > package.json.tmp && mv package.json.tmp package.json
else
    # Fallback to sed for basic replacements
    sed -i.bak "s/\"name\": \"echo-stack-starter\"/\"name\": \"$PROJECT_NAME\"/" package.json
    sed -i.bak "s/Single-seat full-stack starter kit for the solo developer/Full-stack application built with Echo Stack/" package.json
    sed -i.bak "s/your-username\/your-project-name.git/your-username\/$PROJECT_NAME.git/" package.json
    rm -f package.json.bak
fi

# Update project-config.ts
print_status "Updating project configuration..."
PROJECT_TITLE=$(echo "$PROJECT_NAME" | sed 's/-/ /g' | sed 's/\b\w/\U&/g')  # Convert kebab-case to Title Case
cat > src/lib/project-config.ts << EOF
/**
 * Project Configuration - Update these values for your project
 *
 * This file contains the main branding and configuration for your application.
 * Update these values when starting a new project from Echo Stack.
 */

export const PROJECT_CONFIG = {
  // Main project information
  name: "$PROJECT_TITLE",
  tagline: "Full-Stack Application",
  description: "Modern full-stack application built with Echo Stack",

  // Branding
  emoji: "🚀",

  // Meta information
  author: "Your Name",
  version: "1.0.0",
} as const

export type ProjectConfig = typeof PROJECT_CONFIG
EOF

# Update .env.example with project-specific values
print_status "Updating .env.example..."
sed -i.bak "s/your-project-name/$PROJECT_NAME/g" .env.example
rm -f .env.example.bak

print_success "Project '$PROJECT_NAME' created and configured successfully!"

echo ""
print_warning "NEXT STEPS:"
echo "1. cd $PROJECT_NAME"
echo "2. Review and edit src/lib/project-config.ts if needed"
echo "3. Copy .env.example to .env and configure your environment"
echo "4. bun install && bun run db:setup && bun run dev"

echo ""
print_status "Happy coding! 🚀"