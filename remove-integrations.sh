#!/bin/bash
# Remove integrations directory manually
# Run this in your terminal

cd "$(dirname "$0")"

echo "Removing integrations directory..."
rm -rf backend/services/integrations
echo "✅ Removed integrations directory"

echo ""
echo "Done! All integration code has been removed."
