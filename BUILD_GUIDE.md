# BUILD GUIDE

*This document contains detailed background setup instructions.*
*Please refer to `INSTRUCTIONS.md` for standard step-by-step wiring and app connection guides.*

## Compiling from Source

If you choose not to download the pre-compiled `.apk` from the Releases page, you can build the application natively.

1. Ensure you have the latest stable version of Android Studio installed.
2. Clone or download this entire repository to your machine.
3. Open Android Studio and select **Open**.
4. Navigate to the `AndroidApp/` folder of this repository and open it as a project.
5. Wait for Gradle to perform its initial sync (this can take several minutes the first time as it downloads SDKs).
6. Connect your Android phone to your PC via USB and ensure **USB Debugging** is enabled in your phone's Developer Options.
7. Click the **Run 'app'** (green play button) in the Android Studio top toolbar to build and install the APK directly onto your phone.

## Re-structuring the Hardware Code

The `ArduinoCode/ArduinoCode.ino` file acts as the primary orchestrator that includes the other module files. If you add additional modes to your robot car in the future:
1. Create a new `.h` file in the `ArduinoCode/` directory (e.g., `LineFollowMode.h`).
2. Add a new `enum RobotMode` state to the top of `ArduinoCode.ino`.
3. Add a new `else if (cmd == 'L')` Bluetooth listening condition.
4. Call your new isolated logic file function within the main `loop()` switch statement.
