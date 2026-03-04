# Git Troubleshooting Guide for Ubuntu Server

## Quick Fix for Your Current Issue

You're experiencing git ownership and permission issues. Run this on your Ubuntu server:

```bash
cd /opt/roonDashboard

# Fix 1: Add safe directory
git config --global --add safe.directory /opt/roonDashboard

# Fix 2: Fix ownership (replace 'set' with your username if different)
sudo chown -R set:set /opt/roonDashboard

# Fix 3: Fix permissions
chmod -R u+rw /opt/roonDashboard
chmod -R u+rwX /opt/roonDashboard/.git

# Fix 4: Check your branch name
git branch -a

# Fix 5: Pull (use 'master' if your repo uses master instead of main)
git pull origin main
# OR
git pull origin master
```

**OR use the automated fix script:**

```bash
cd /opt/roonDashboard
bash fix-git-permissions.sh
```

---

## Common Git Issues and Solutions

### Issue 1: "fatal: detected dubious ownership"

**Cause:** The repository is owned by a different user (root) but you're logged in as 'set'

**Solution:**
```bash
# Method A: Add safe directory (for current user only)
git config --global --add safe.directory /opt/roonDashboard

# Method B: Fix ownership (recommended - fixes for all operations)
sudo chown -R set:set /opt/roonDashboard
```

---

### Issue 2: "error: cannot open '.git/FETCH_HEAD': Permission denied"

**Cause:** Git files have wrong permissions

**Solution:**
```bash
cd /opt/roonDashboard
sudo chown -R set:set .git
chmod -R u+rwX .git
```

---

### Issue 3: "fatal: couldn't find remote ref main"

**Cause:** Your repository uses 'master' branch instead of 'main'

**Solution:**
```bash
# Check what branches exist
git branch -a

# Pull from the correct branch
git pull origin master

# OR set main as the default if it exists
git checkout main
git pull origin main
```

---

### Issue 4: Git operations require sudo

**Cause:** Files are owned by root

**Solution:**
```bash
# Fix ownership permanently
sudo chown -R $USER:$USER /opt/roonDashboard

# Verify
ls -la /opt/roonDashboard | head -10
# Should show 'set' as owner, not 'root'
```

---

### Issue 5: "Your local changes would be overwritten"

**Cause:** You have uncommitted changes on the server

**Solution:**
```bash
# Option A: Stash your changes
git stash
git pull origin main
git stash pop

# Option B: Discard local changes (careful!)
git reset --hard HEAD
git pull origin main

# Option C: See what changed
git status
git diff
```

---

## Permanent Fix: Correct Repository Setup

To avoid these issues in the future:

```bash
# 1. Ensure correct ownership
sudo chown -R set:set /opt/roonDashboard

# 2. Set correct permissions
cd /opt/roonDashboard
chmod -R u+rw .
find . -type d -exec chmod u+x {} \;

# 3. Add safe directory globally
git config --global --add safe.directory /opt/roonDashboard

# 4. Verify git works
git status
git pull origin main  # or master
```

---

## Understanding the Problem

When you run commands with `sudo`, files get created with `root` ownership. Then when you try to run git commands as user `set`, you get permission errors.

**Bad workflow:**
```bash
sudo git clone ...        # ← Files owned by root
git pull                  # ← Fails! You're user 'set', files owned by root
```

**Good workflow:**
```bash
git clone ...             # ← Files owned by current user (set)
git pull                  # ← Works! Same user
```

---

## Checking Current Status

```bash
# Who owns the files?
ls -la /opt/roonDashboard | head -5

# Who am I?
whoami

# What's the git status?
git status

# What's the remote URL?
git remote -v

# What branch am I on?
git branch -a

# What's the default branch?
git remote show origin | grep "HEAD branch"
```

---

## The Fix Script Does All This

Instead of running commands manually, just use:

```bash
cd /opt/roonDashboard
bash fix-git-permissions.sh
```

This script:
1. ✅ Adds safe directory
2. ✅ Fixes ownership
3. ✅ Fixes permissions
4. ✅ Detects correct branch name
5. ✅ Attempts git pull
6. ✅ Shows you the result

---

## After Fixing

Once fixed, the normal update process works:

```bash
cd /opt/roonDashboard
sudo bash update.sh
```

The update.sh script now includes automatic permission fixes, so you shouldn't need to run fix-git-permissions.sh again.

---

## Prevention

**Golden Rule:** Don't use `sudo` for git operations unless absolutely necessary.

```bash
# ✓ Good
git pull origin master

# ✗ Bad (creates root-owned files)
sudo git pull origin master
```

If the repository was initially cloned with sudo, fix it once:

```bash
sudo chown -R $USER:$USER /opt/roonDashboard
```

Then never use sudo for git again!

---

## Need More Help?

1. Check file ownership: `ls -la /opt/roonDashboard`
2. Check git status: `git status`
3. Check permissions: `stat /opt/roonDashboard/.git/FETCH_HEAD`
4. Check branches: `git branch -a`
5. Run the fix script: `bash fix-git-permissions.sh`

