#ifndef OBSTACLE_MODE_H
#define OBSTACLE_MODE_H

#include "Config.h"

int lookRight() {
  myservo.write(50); 
  delay(500);
  int distance = readDistance();
  delay(100);
  myservo.write(105); 
  return distance;
}

int lookLeft() {
  myservo.write(170); 
  delay(500);
  int distance = readDistance();
  delay(100);
  myservo.write(105); 
  return distance;
}

void handleObstacleMode() {
  int distanceRight = 0;
  int distanceLeft = 0;
  delay(50); // Small delay for stability

  int distance = readDistance();

  if (distance <= 35) {
    stopBot();
    delay(300);
    moveBackward();
    delay(400);
    stopBot();
    delay(300);
    
    distanceRight = lookRight();
    delay(300);
    distanceLeft = lookLeft();
    delay(300);

    if (distanceRight >= distanceLeft) {
      turnRight();
      delay(900); // Turn duration
      stopBot();
    } else {
      turnLeft();
      delay(900); // Turn duration
      stopBot();
    }
  } else {
    moveForward();
  }
}

#endif
