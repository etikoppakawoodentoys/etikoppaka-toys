#!/bin/bash

echo "🚀 Building Etikoppaka Toys App..."

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

# Open in Android Studio
echo "📱 Opening in Android Studio..."
npx cap open android

echo ""
echo "✅ In Android Studio:"
echo "   1. Click Build → Generate Signed Bundle / APK"
echo "   2. Select APK or Android App Bundle"
echo "   3. Create new keystore or use existing"
echo "   4. Select release build variant"
echo "   5. Click Finish"
echo ""
echo "📱 Your app will load: https://etikoppakatoys.store"
