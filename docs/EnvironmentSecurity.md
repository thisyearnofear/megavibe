# Environment Variable Security Guide

## Overview

This document outlines best practices for managing environment variables in the MegaVibe project. Environment variables contain sensitive information such as API keys, private keys, and other credentials that should never be committed to the repository.

## Current Configuration

- `.env.example` and `.env.production.example` files are committed to the repository as templates
- Actual `.env` files should never be committed
- A pre-commit hook has been added to prevent accidental commits of environment files

## Best Practices

### 1. Never Commit Actual Environment Files

The following files should NEVER be committed:

- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- `.env.*.local`

### 2. Use Example Files as Templates

- Always use the `.env.*.example` files as templates
- Copy these files to create your local environment files
- Example: `cp frontend/.env.production.example frontend/.env.production`

### 3. Rotate Compromised Credentials

If environment files with real credentials are accidentally committed:

1. Consider those credentials compromised
2. Rotate/regenerate all affected API keys and secrets
3. Update environment files with new credentials
4. Ensure the files are properly gitignored

### 4. Safely Share Credentials

- Never share credentials via public channels or commit them to the repository
- Use password managers or secure credential sharing systems
- For production deployments, use environment variable configuration in your hosting platform (Vercel, Netlify, etc.)

### 5. Validate Gitignore Setup

Periodically check that your `.gitignore` is correctly configured:

```
git check-ignore -v frontend/.env.production
```

If the command doesn't show the file as ignored, review your `.gitignore` configuration.

## Environment File Organization

### Frontend

- `/frontend/.env.development` - Local development environment
- `/frontend/.env.production` - Production build environment
- `/frontend/.env.test` - Testing environment

### Backend

- `/backend/.env` - Main environment file
- `/backend/.env.development` - Development-specific overrides
- `/backend/.env.production` - Production-specific overrides

### Contracts

- `/contracts/.env` - Contains private keys and network configurations

## How to Use

### Setting Up Local Environment

1. Copy the example file:

   ```
   cp frontend/.env.production.example frontend/.env.production
   ```

2. Edit the file to add your credentials:

   ```
   nano frontend/.env.production
   ```

3. Reference environment variables in code:
   ```typescript
   const apiKey = import.meta.env.VITE_API_KEY;
   ```

## Secure Credential Storage

Consider using a secure credential management system for team development:

- HashiCorp Vault
- AWS Secrets Manager
- 1Password for Teams
- Doppler

## Pre-commit Hook

A pre-commit hook has been added to prevent accidental commits of environment files. If you need to bypass this check (not recommended), you can use:

```
git commit --no-verify
```
