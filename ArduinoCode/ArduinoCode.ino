/*
   3-in-1 Multi-Mode Robot Car
   Modes: Bluetooth, Obstacle Avoidance, Human Follow
*/

#include "Config.h"
#include "BluetoothMode.h"
#include "ObstacleMode.h"
#include "HumanFollowMode.h"

// --- STATE MANAGEMENT ---
enum RobotMode {
  MODE_BLUETOOTH,
  MODE_OBSTACLE,
  MODE_HUMAN_FOLLOW
};

RobotMode currentMode = MODE_BLUETOOTH;

void setup() {
  Serial.begin(9600);
  
  // Motor Pins
  pinMode(LEFT_ENA, OUTPUT); pinMode(LEFT_IN1, OUTPUT); pinMode(LEFT_IN2, OUTPUT);
  pinMode(RIGHT_ENB, OUTPUT); pinMode(RIGHT_IN3, OUTPUT); pinMode(RIGHT_IN4, OUTPUT);

  // Sensor Pins
  pinMode(IR_RIGHT, INPUT); // IR Sensors usually digital output
  pinMode(IR_LEFT, INPUT);
  
  // Servo
  myservo.attach(SERVO_PIN);
  myservo.write(105); // Initialize looking forward
  
  // Initial State
  stopBot();
}

void loop() {
  // Check for Mode Switch Commands from Bluetooth
  // Check for Mode Switch Commands from Bluetooth
  while (Serial.available() > 0) {
    char cmd = Serial.read();
    
    // Mode Switching Commands
    if (cmd == 'M') { // Changed to 'M' (Manual) because 'X' might be sent on release
      if (currentMode != MODE_BLUETOOTH) {
        currentMode = MODE_BLUETOOTH;
        stopBot();
      }
    } 
    else if (cmd == 'Y') {
      if (currentMode != MODE_OBSTACLE) {
        currentMode = MODE_OBSTACLE;
        stopBot();
      }
    }
    else if (cmd == 'Z') {
      if (currentMode != MODE_HUMAN_FOLLOW) {
        currentMode = MODE_HUMAN_FOLLOW;
        stopBot();
      }
    }
    // Pass other commands to Bluetooth handler if active
    else if (currentMode == MODE_BLUETOOTH) {
      handleBluetoothMode(cmd);
    }
  }

  // Execute Logic Based on Current Mode
  switch (currentMode) {
    case MODE_BLUETOOTH:
      // Constantly monitor safety while the app is silent
      if (checkSafetyForward()) {
         stopBot();
         isMovingForward = false; // Reset state so it doesn't get stuck
      }
      break;
      
    case MODE_OBSTACLE:
      handleObstacleMode();
      break;
      
    case MODE_HUMAN_FOLLOW:
      handleHumanFollowMode();
      break;
  }
}