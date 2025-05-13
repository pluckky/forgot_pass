------------------------------------------------------------------------------+
| Table       | Create Table                                                                                                                                                                           |
+-------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| profile_pic | CREATE TABLE `profile_pic` (
  `email` varchar(255) NOT NULL,
  `prof_pic` longblob,
  UNIQUE KEY `email` (`email`)
) 



Had to change shit sa vehicles kanina 

 vehicle | CREATE TABLE `vehicle` (
  `vehicle_plate` varchar(10) DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `worker_id` int DEFAULT NULL,
  `vehicle_type` enum('Sedan','SUV','Motorcycle') DEFAULT NULL,
  `user_id` varchar(20) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `vehicle_plate` (`vehicle_plate`),
  KEY `student_id` (`student_id`),
  KEY `worker_id` (`worker_id`),
  CONSTRAINT `vehicle_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student_information` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `vehicle_ibfk_2` FOREIGN KEY (`worker_id`) REFERENCES `worker_information` (`worker_id`) ON DELETE CASCADE,
  CONSTRAINT `vehicle_chk_1` CHECK ((((`student_id` is not null) and (`worker_id` is null)) or ((`worker_id` is not null) and (`student_id` is null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci |
