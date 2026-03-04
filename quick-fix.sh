#!/bin/bash
# COPY AND PASTE THIS ENTIRE SCRIPT ON YOUR UBUNTU SERVER
# This is the immediate fix for the git permission errors you're experiencing

echo "🔧 Fixing Git Permission Issues..."
echo ""

# Navigate to project
cd /opt/roonDashboard || { echo "❌ Error: /opt/roonDashboard not found"; exit 1; }

echo "Step 1: Adding safe directory..."
git config --global --add safe.directory /opt/roonDashboard
echo "✓ Done"
echo ""

echo "Step 2: Fixing ownership (requires sudo)..."
sudo chown -R set:set /opt/roonDashboard
echo "✓ Done"
echo ""

echo "Step 3: Fixing git permissions..."
chmod -R u+rwX /opt/roonDashboard/.git
echo "✓ Done"
echo ""

echo "Step 4: Detecting branch..."
git fetch origin 2>/dev/null
BRANCH=$(git remote show origin 2>/dev/null | grep "HEAD branch" | cut -d' ' -f5)
if [ -z "$BRANCH" ]; then
    # Fallback: check if master or main exists
    if git ls-remote --heads origin master | grep -q master; then
        BRANCH="master"
    else
        BRANCH="main"
    fi
fi
echo "✓ Using branch: $BRANCH"
echo ""

echo "Step 5: Pulling latest changes..."
git pull origin $BRANCH

echo ""
echo "════════════════════════════════════════════════════"
echo "✅ Fix Complete!"
echo "════════════════════════════════════════════════════"
echo ""
echo "New files downloaded:"
echo "  • fix-git-permissions.sh - Automated fix script"
echo "  • update.sh - Smart update script"
echo "  • GIT-TROUBLESHOOTING.md - Full guide"
echo ""
echo "Next: Run the update script to deploy changes:"
echo "  sudo bash update.sh"
echo ""

