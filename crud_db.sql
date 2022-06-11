-- -- Table Stucture for crud Database
-- --
-- -- Table structure for table `visitors`
-- --

-- DROP TABLE IF EXISTS `visitors`;

-- CREATE TABLE `visitors` (
--   `id` int(11) NOT NULL AUTO_INCREMENT,
--   `name` varchar(200) DEFAULT NULL,
--   `email_id` varchar(200) DEFAULT NULL,
--   `checkin` datetime DEFAULT NULL,
--   `checkout` datetime DEFAULT NULL,
--   `mobile_no` bigint(20) DEFAULT NULL,
--   PRIMARY KEY (`id`)
-- ) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=latin1;

-- --
-- -- Dumping data for table `visitors`
-- --

-- -- Table structure for table `hosts`
-- --

-- DROP TABLE IF EXISTS `hosts`;

-- CREATE TABLE `hosts` (
--   `id` int(11) NOT NULL AUTO_INCREMENT,
--   `name` varchar(200) DEFAULT NULL,
--   `email_id` varchar(200) DEFAULT NULL, 
--   `mobile_no` bigint(20) DEFAULT NULL,
--   PRIMARY KEY (`id`)
-- ) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=latin1;

-- --
-- -- Dumping data for table `hosts`
-- --


-- LOCK TABLES `visitors` WRITE;
-- UNLOCK TABLES;

-- LOCK TABLES `hosts` WRITE;
-- UNLOCK TABLES;