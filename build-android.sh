#!/bin/bash

echo "🚀 Building Etikoppaka Toys Android App"

# Set environment variables
export ANDROID_HOME=$HOME/Library/Android/sdk
export JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || echo "/usr/local/opt/openjdk@17")

echo "📱 ANDROID_HOME: $ANDROID_HOME"
echo "☕ JAVA_HOME: $JAVA_HOME"

# Create local.properties
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync android

# Build the app
echo "🏗️ Building APK..."
cd android

# Make gradlew executable
chmod +x gradlew

# Clean build
./gradlew clean

# Build release APK
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "📱 APK location: android/app/build/outputs/apk/release/app-release.apk"
    echo ""
    ls -la app/build/outputs/apk/release/
else
    echo ""
    echo "❌ Build failed. Please check errors above."
fi

cd ..
