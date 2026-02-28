#ifndef HUMAN_FOLLOW_MODE_H
#define HUMAN_FOLLOW_MODE_H

#include "Config.h"

void handleHumanFollowMode() {
  int distance = readDistance();
  
  // IR Sensors (Active LOW means detection)
  bool isRight = !digitalRead(IR_RIGHT); 
  bool isLeft = !digitalRead(IR_LEFT); 

  if (distance > 1 && distance <= 7) {
    // Too close! Back up. (< 8cm)
    moveBackward();
  } else if (distance >= 8 && distance <= 11) {
    // Perfect Distance "Dead Zone" (Prevents Back-and-Forth rocking) (8cm to 14cm)
    if (isRight && isLeft) {
      stopBot(); // perfectly centered and spaced!
    } else if (isRight) {
      turnRight(); // just rotate to face the hand
    } else if (isLeft) {
      turnLeft(); // just rotate to face the hand
    } else {
      stopBot();
    }
  } else if (distance >= 12 && distance <= 37) {
    // Hand is far away (15cm to 50cm), follow it!
    if (isRight && isLeft) {
      moveForward();   // Hand exactly centered
    } else if (isRight) {
      forwardRight();  // Curve smoothly to the right
    } else if (isLeft) {
      forwardLeft();   // Curve smoothly to the left
    } else {
      moveForward();   // IR doesn't see it, but Ultrasonic does: Drive straight to catch up
    }
  } else {
    // Target is outside Ultrasonic range (> 50cm) or out of the narrow Ultrasonic beam
    // We rely purely on the wide-angle IR sensors to find it again
    if (isRight && isLeft) {
      moveForward();
    } else if (isRight) {
      turnRight(); // Spot-turn immediately to put target back in front of Ultrasonic
    } else if (isLeft) {
      turnLeft();  // Spot-turn immediately to put target back in front of Ultrasonic
    } else {
      stopBot();   // I have completely lost you!
    }
  }
}

#endif
