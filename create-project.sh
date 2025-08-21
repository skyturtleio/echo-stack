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

print_success "Project '$PROJECT_NAME' created successfully!"

echo ""
print_warning "NEXT STEPS:"
echo "1. cd $PROJECT_NAME"
echo "2. Edit src/lib/project-config.ts with your project details"
echo "3. Edit package.json (name, description, author, repository)"
echo "4. bun install && bun run db:setup && bun run dev"

echo ""
print_status "Happy coding! 🚀"