#!/bin/bash
# Fix git ownership and permission issues on Ubuntu server

set -e

echo "════════════════════════════════════════════════════════"
echo "  Fixing Git Ownership and Permissions"
echo "════════════════════════════════════════════════════════"
echo ""

# Get current user
CURRENT_USER=$(whoami)
echo "Current user: $CURRENT_USER"
echo ""

# Fix 1: Add safe directory for current user
echo "[1/5] Adding safe directory exception..."
git config --global --add safe.directory /opt/roonDashboard
echo "    ✓ Safe directory added"
echo ""

# Fix 2: Fix ownership of the entire directory (requires sudo)
echo "[2/5] Fixing ownership of /opt/roonDashboard..."
echo "    This requires sudo..."
sudo chown -R $CURRENT_USER:$CURRENT_USER /opt/roonDashboard
echo "    ✓ Ownership fixed to $CURRENT_USER:$CURRENT_USER"
echo ""

# Fix 3: Fix permissions
echo "[3/5] Fixing permissions..."
chmod -R u+rw /opt/roonDashboard
find /opt/roonDashboard -type d -exec chmod u+x {} \;
echo "    ✓ Permissions fixed"
echo ""

# Fix 4: Fix git directory permissions specifically
echo "[4/5] Fixing .git directory permissions..."
chmod -R u+rwX /opt/roonDashboard/.git
echo "    ✓ Git directory permissions fixed"
echo ""

# Fix 5: Check default branch name
echo "[5/5] Checking git branch..."
cd /opt/roonDashboard
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
DEFAULT_BRANCH=$(git remote show origin 2>/dev/null | grep "HEAD branch" | cut -d' ' -f5 || echo "master")

echo "    Current branch: $CURRENT_BRANCH"
echo "    Remote default branch: $DEFAULT_BRANCH"
echo ""

# Try to pull
echo "════════════════════════════════════════════════════════"
echo "  Testing Git Pull"
echo "════════════════════════════════════════════════════════"
echo ""

if git pull origin $DEFAULT_BRANCH 2>&1; then
    echo ""
    echo "✓ Git pull successful!"
else
    echo ""
    echo "⚠ Git pull failed. Trying alternative solutions..."
    echo ""

    # Try fetching first
    echo "Attempting to fetch..."
    git fetch origin

    # Check if we need to set upstream
    if [ "$CURRENT_BRANCH" != "$DEFAULT_BRANCH" ] && [ "$CURRENT_BRANCH" != "unknown" ]; then
        echo "Switching to $DEFAULT_BRANCH branch..."
        git checkout $DEFAULT_BRANCH
    fi

    echo "Trying pull again..."
    git pull origin $DEFAULT_BRANCH
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Fix Complete!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Git status:"
git status
echo ""
echo "Recent commits:"
git log --oneline -n 5

