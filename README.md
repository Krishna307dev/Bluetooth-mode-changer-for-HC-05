<div align="center">
  <h1>🤖 3-in-1 Multi-Mode Robot Car</h1>
  
  <p>
    <b>A versatile robotic platform with Bluetooth, Obstacle Avoidance, and Human Following capabilities.</b>
  </p>

  <!-- Badges -->
  <p>
    <a href="../../releases"><img src="https://img.shields.io/github/v/release/yourusername/yourrepo?style=for-the-badge&color=blue" alt="Latest Release"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License"></a>
    <img src="https://img.shields.io/badge/Platform-Android_|_Arduino-orange.svg?style=for-the-badge" alt="Platform">
  </p>
</div>

---

## 📖 Table of Contents
- [✨ Features](#-features)
- [📂 Project Structure](#-project-structure)
- [📱 Controller App](#-controller-app)
- [🛠️ Build Instructions & Diagram](#️-build-instructions--diagram)
- [📦 Releases & Downloads](#-releases--downloads)
- [📄 License](#-license)

## ✨ Features

- **📱 Bluetooth Control:** Drive the robot manually using the custom Android app.
- **🛡️ Obstacle Avoidance:** Autonomous navigation avoiding collisions using ultrasonic and IR sensors.
- **🚶‍♂️ Human Following:** Automatically detects and follows a person or object in front of it.

## 📂 Project Structure

This repository is organized logically for both the hardware source and the Android control layer:

```text
├── AndroidApp/                             # Android Controller App source code (Android Studio Project)
├── ArduinoCode/                            # Arduino firmware and robot logic
├── diagrams/                               # Circuit diagram files (PNG + SVG)
├── BUILD_GUIDE.md                          # Setup and build instructions
├── INSTRUCTIONS.md                         # Detailed usage guide
├── LICENSE                                 # MIT License
└── README.md                               # This file
```

## 🔌 Circuit Diagram

![Circuit Diagram](diagrams/diagram.png)

*The SVG version is available in the same folder for scalable viewing and editing.*

## 📱 Controller App

The custom Android app is designed specifically for this robot but is highly versatile. 

**Note: The app can be used individually for other microcontrollers!**
- It sends simple character commands via standard Serial over Bluetooth.
  - Examples: `M` for Manual mode, `Y` for Obstacle mode, `Z` for Follow mode.
- You can easily pair it with any HC-05 or HC-06 Bluetooth module connected to your own custom Arduino, ESP32, STM32, or Raspberry Pi Pico projects.

## 🛠️ Build Instructions & Diagram

For complete setup, wiring, formatting, and installation steps, please refer to the dedicated instructions file.

👉 **[Read the Full Build Instructions Here!](INSTRUCTIONS.md)**

## 📦 Releases & Downloads

To download the compiled `.apk` for the Android App or grab the latest stable release of the hardware code, visit the Releases page.

👉 **[Download Latest Releases Here](../../releases)**

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
