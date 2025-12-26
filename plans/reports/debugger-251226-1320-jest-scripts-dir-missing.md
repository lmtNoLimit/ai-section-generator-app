# GitHub Actions Failure Analysis: Jest Configuration Issue

**Report ID:** debugger-251226-1320-jest-scripts-dir-missing
**Date:** 2025-12-26 13:20
**GitHub Actions Run:** https://github.com/lmtNoLimit/ai-section-generator-app/actions/runs/20517349809
**Status:** Root cause identified ✓

## Executive Summary

**Issue:** Both test jobs (Node 20.x & 22.x) failed during "Run unit tests" step
**Impact:** CI/CD pipeline blocked, preventing deployments
**Root Cause:** Jest config references non-existent `scripts/` directory in remote repo
**Severity:** High - blocks all PR merges and deployments

## Failed Jobs

1. **test (20.x)** - Failed at 06:18:33 UTC
2. **test (22.x)** - Failed at 06:18:31 UTC

Both jobs completed earlier steps successfully:
- ✓ Checkout code
- ✓ Setup Node.js
- ✓ Install dependencies
- ✓ Type check
- ✓ Lint
- ✗ **Run unit tests** ← FAILED HERE

## Error Analysis

### Primary Error Message
```
● Validation Error:

  Directory /home/runner/work/ai-section-generator-app/ai-section-generator-app/scripts
  in the roots[1] option was not found.

  Configuration Documentation:
  https://jestjs.io/docs/configuration

Process completed with exit code 1.
```

### Jest Configuration (jest.config.cjs)
```javascript
roots: ['<rootDir>/app', '<rootDir>/scripts'],
```

Line 5 specifies `scripts/` as test root but:
- ✓ Directory exists **locally** at `/Users/lmtnolimit/working/ai-section-generator/scripts/`
- ✗ Directory **NOT** present in remote repo `lmtNoLimit/ai-section-generator-app`
- Local `scripts/` only contains empty `__tests__` directory

### Evidence

**Local Investigation:**
```bash
$ ls -la scripts/
drwx------@ 3 lmtnolimit staff 96 Dec 23 18:56 .
drwxr-xr-x@ 50 lmtnolimit staff 1600 Dec 26 13:14 ..
drwxr-xr-x@ 3 lmtnolimit staff 96 Dec 23 19:24 migrations

$ ls -la scripts/migrations/__tests__/
total 0  # Empty directory
```

**Remote Verification:**
```bash
$ gh api repos/lmtNoLimit/ai-section-generator-app/contents/scripts
{"message":"Not Found","status":"404"}
```

**Git Tracking:**
```bash
$ git ls-files scripts/
# No output - scripts/ not tracked in git
```

## Root Cause

Jest config declares `scripts/` as test root but directory doesn't exist in remote repository because:
1. `scripts/` directory only exists locally
2. Contains only empty subdirectories (`migrations/__tests__/` is empty)
3. Git doesn't track empty directories
4. Not explicitly ignored in `.gitignore`
5. Never committed to remote repo

## Impact Timeline

- Push at ~06:17:54 UTC triggers workflow
- Checkout & dependencies install successfully
- Type check & lint pass
- Jest validation fails at 06:18:31/33 UTC
- No coverage reports generated
- Pipeline terminates with exit code 1

## Recommended Solutions

### Option 1: Remove scripts/ from Jest config (Immediate Fix)
```javascript
// jest.config.cjs
roots: ['<rootDir>/app'], // Remove '<rootDir>/scripts'
```

**Pros:** Immediate fix, no tests in scripts/ anyway
**Cons:** None if no script tests planned soon

### Option 2: Add placeholder file to scripts/
```bash
touch scripts/.gitkeep
# or
touch scripts/migrations/__tests__/.gitkeep
git add scripts/
git commit -m "fix(ci): add scripts dir for jest config"
```

**Pros:** Preserves config for future script tests
**Cons:** Adds unused directory structure

### Option 3: Conditional roots config
```javascript
// jest.config.cjs
const fs = require('fs');
const roots = ['<rootDir>/app'];
if (fs.existsSync('./scripts')) {
  roots.push('<rootDir>/scripts');
}

module.exports = {
  roots,
  // ... rest of config
};
```

**Pros:** Works in both environments
**Cons:** Adds complexity, masks underlying issue

## Recommended Action

**Choose Option 1** - remove `scripts/` from Jest roots:
1. Most straightforward
2. No scripts tests currently exist
3. Can re-add when actual script tests created
4. Fixes issue immediately

## Implementation Steps

1. Edit `jest.config.cjs` line 5:
   ```diff
   - roots: ['<rootDir>/app', '<rootDir>/scripts'],
   + roots: ['<rootDir>/app'],
   ```

2. Test locally:
   ```bash
   npm test -- --coverage --maxWorkers=2
   ```

3. Commit & push:
   ```bash
   git add jest.config.cjs
   git commit -m "fix(ci): remove non-existent scripts dir from jest roots"
   git push
   ```

4. Verify CI passes on new run

## Prevention Measures

1. Run `npm test` before committing config changes
2. Add pre-push hook to run jest validation
3. Document test directory structure requirements
4. Add CI check comment in jest.config.cjs

## Files Referenced

- `/Users/lmtnolimit/working/ai-section-generator/jest.config.cjs` (line 5)
- Remote: `lmtNoLimit/ai-section-generator-app` (scripts/ missing)
- Workflow: `.github/workflows/test.yml` (assumed standard test workflow)

## Unresolved Questions

None - root cause definitively identified and solution clear.
