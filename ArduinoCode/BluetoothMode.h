#ifndef BLUETOOTH_MODE_H
#define BLUETOOTH_MODE_H

#include "Config.h"

bool safetyAssistOn = false;
bool isMovingForward = false; // Track if the robot is currently going forward

// Extracted Safety Check Function (Non-blocking)
bool checkSafetyForward() {
  if (!safetyAssistOn || !isMovingForward) return false;

  static unsigned long lastPingTime = 0;
  static int cachedDist = 100;

  if (millis() - lastPingTime > 100) { // Max 10 checks per second
    cachedDist = readDistance();
    lastPingTime = millis();
  }
  
  if (cachedDist > 0 && cachedDist <= 35) {
    return true; // Obstacle detected!
  }
  return false;
}

void handleBluetoothMode(char command) {
  // Update state tracking so Safety Check knows what we are doing
  if (command == 'F' || command == 'G' || command == 'I') {
    isMovingForward = true;
  } else if (command == 'S' || command == 'D' || command == 'B' || command == 'L' || command == 'R' || command == 'H' || command == 'J') {
    isMovingForward = false;
  }

  // Pre-emptive safety block (if we already know there's a wall)
  // Only block commands that move the robot FORWARD
  if (checkSafetyForward() && (command == 'F' || command == 'G' || command == 'I')) {
    stopBot();
    isMovingForward = false;
    return;
  }

  switch (command) {
    case 'X': safetyAssistOn = true; break;  // Safety ON
    case 'x': safetyAssistOn = false; break; // Safety OFF
    
    case 'F': moveForward(); break;
    case 'B': moveBackward(); break;
    case 'L': turnRight(); break; // Swapped: App Left Button -> Robot Right
    case 'R': turnLeft(); break;  // Swapped: App Right Button -> Robot Left
    case 'S': stopBot(); break;
    case 'D': stopBot(); break; // Some apps send D for Stop All

    // Smooth Turns
    case 'G': forwardRight(); break; // Swapped
    case 'I': forwardLeft(); break;  // Swapped
    case 'H': backRight(); break;    // Swapped
    case 'J': backLeft(); break;     // Swapped

    // Speed Control
    case '0': currentSpeed = 0; break;
    case '1': currentSpeed = 100; break;
    case '2': currentSpeed = 120; break;
    case '3': currentSpeed = 140; break;
    case '4': currentSpeed = 160; break;
    case '5': currentSpeed = 180; break;
    case '6': currentSpeed = 200; break;
    case '7': currentSpeed = 220; break;
    case '8': currentSpeed = 240; break;
    case '9': currentSpeed = 255; break;
    case 'q': currentSpeed = 255; break; // Max Speed
  }
}

#endif
