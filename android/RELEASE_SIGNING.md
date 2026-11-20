# Android APK builds

The Android workflow builds an installable debug APK with Gradle's standard debug signing configuration; it does not require `ANDROID_KEYSTORE_BASE64`, keystore passwords, aliases, or any other release-signing secret. The workflow uploads the APK as an artifact and publishes `Mediveu-ERP.apk` to the latest GitHub release, which is the target of the Android APK download button on the public website.

A debug-signed APK is suitable for direct installation and testing, but it is not a production release. Android only allows an update to install over an existing app when the signing certificate matches. A debug APK from a clean hosted CI runner may have a different debug certificate from another build, and it will not replace an existing release-signed installation. In that case, Android may require uninstalling the existing app before installing the debug APK; this can remove app-local data. Use the same trusted production signing key for production updates.
