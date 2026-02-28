#ifndef CONFIG_H
#define CONFIG_H

#include <Servo.h>
#include <NewPing.h>

// --- PINOUT CONFIGURATION ---
// Motor Driver (L298N)
#define LEFT_ENA 6
#define LEFT_IN1 9
#define LEFT_IN2 10
#define RIGHT_ENB 5
#define RIGHT_IN3 7
#define RIGHT_IN4 8

// Sensors & Actuators
#define TRIG_PIN 11
#define ECHO_PIN 12
#define SERVO_PIN 3
#define IR_RIGHT A0
#define IR_LEFT A1

// --- CONSTANTS ---
#define MAX_DISTANCE 200 // Maximum distance for Ultrasonic sensor (cm)

// --- GLOBAL OBJECTS ---
Servo myservo;
NewPing sonar(TRIG_PIN, ECHO_PIN, MAX_DISTANCE);

// --- GLOBAL VARIABLES ---
int currentSpeed = 255;
int turnSpeed = 200;

// --- MOTOR CONTROL FUNCTIONS ---

void setMotorSpeed(int speed) {
  analogWrite(LEFT_ENA, speed);
  analogWrite(RIGHT_ENB, speed);
}

void moveForward() {
  setMotorSpeed(currentSpeed);
  digitalWrite(LEFT_IN1, HIGH); digitalWrite(LEFT_IN2, LOW);
  digitalWrite(RIGHT_IN3, HIGH); digitalWrite(RIGHT_IN4, LOW);
}

void moveBackward() {
  setMotorSpeed(currentSpeed);
  digitalWrite(LEFT_IN1, LOW); digitalWrite(LEFT_IN2, HIGH);
  digitalWrite(RIGHT_IN3, LOW); digitalWrite(RIGHT_IN4, HIGH);
}

void turnLeft() {
  setMotorSpeed(turnSpeed);
  digitalWrite(LEFT_IN1, LOW); digitalWrite(LEFT_IN2, HIGH);  // Left Backward
  digitalWrite(RIGHT_IN3, HIGH); digitalWrite(RIGHT_IN4, LOW); // Right Forward
}

void turnRight() {
  setMotorSpeed(turnSpeed);
  digitalWrite(LEFT_IN1, HIGH); digitalWrite(LEFT_IN2, LOW);   // Left Forward
  digitalWrite(RIGHT_IN3, LOW); digitalWrite(RIGHT_IN4, HIGH); // Right Backward
}

void stopBot() {
  digitalWrite(LEFT_IN1, LOW); digitalWrite(LEFT_IN2, LOW);
  digitalWrite(RIGHT_IN3, LOW); digitalWrite(RIGHT_IN4, LOW);
  analogWrite(LEFT_ENA, 0);
  analogWrite(RIGHT_ENB, 0);
}

// Smooth Turns (for Bluetooth)
void forwardLeft() {
  analogWrite(LEFT_ENA, currentSpeed / 4);
  analogWrite(RIGHT_ENB, currentSpeed);
  digitalWrite(LEFT_IN1, HIGH); digitalWrite(LEFT_IN2, LOW);
  digitalWrite(RIGHT_IN3, HIGH); digitalWrite(RIGHT_IN4, LOW);
}

void forwardRight() {
  analogWrite(LEFT_ENA, currentSpeed);
  analogWrite(RIGHT_ENB, currentSpeed / 4);
  digitalWrite(LEFT_IN1, HIGH); digitalWrite(LEFT_IN2, LOW);
  digitalWrite(RIGHT_IN3, HIGH); digitalWrite(RIGHT_IN4, LOW);
}

void backLeft() {
  analogWrite(LEFT_ENA, currentSpeed / 4);
  analogWrite(RIGHT_ENB, currentSpeed);
  digitalWrite(LEFT_IN1, LOW); digitalWrite(LEFT_IN2, HIGH);
  digitalWrite(RIGHT_IN3, LOW); digitalWrite(RIGHT_IN4, HIGH);
}

void backRight() {
  analogWrite(LEFT_ENA, currentSpeed);
  analogWrite(RIGHT_ENB, currentSpeed / 4);
  digitalWrite(LEFT_IN1, LOW); digitalWrite(LEFT_IN2, HIGH);
  digitalWrite(RIGHT_IN3, LOW); digitalWrite(RIGHT_IN4, HIGH);
}

// --- SENSOR HELPER ---
int readDistance() {
  delay(30); // Sensor needs settling time between pings (was 70, reduced for speed)
  int cm = sonar.ping_cm();
  if (cm == 0) return 250; // No echo = clear or out of range
  return cm;
}

#endif
