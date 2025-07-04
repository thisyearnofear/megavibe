# MegaVibe Scripts

This directory contains scripts for various operations in the MegaVibe platform.

## Directory Structure

- `blockchain/` - Scripts for blockchain interactions (contract deployment, seeding, verification)
- `contracts/` - Legacy location for contract-related scripts (to be deprecated)
- `database/` - Scripts for database operations (seeding, migrations)
- `deployment/` - Scripts for deploying the application to different environments
- `filcdn/` - Scripts for FilCDN operations (upload, download, diagnostics)
- `testing/` - Scripts for testing various components
- `utils/` - Utility scripts for maintenance and operations

## Migration Plan

We are in the process of consolidating scripts from multiple locations into this organized structure.
Previously, scripts were scattered between `/scripts` and `/contracts/scripts`.

### Next Steps

1. Test all scripts in their new locations to ensure they work properly
2. Update any import paths or relative paths within the scripts
3. Update documentation and CI/CD pipelines to use the new script locations
4. Remove duplicate scripts once the migration is complete

## Usage

Most scripts can be run with Node.js:

```bash
node scripts/[directory]/[script-name].js
```

For shell scripts:

```bash
bash scripts/[directory]/[script-name].sh
```
