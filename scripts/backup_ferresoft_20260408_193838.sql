-- MySQL dump 10.13  Distrib 9.1.0, for Win64 (x86_64)
--
-- Host: localhost    Database: ferresoft
-- ------------------------------------------------------
-- Server version	9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `carrito`
--

DROP TABLE IF EXISTS `carrito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrito` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `cantidad` int DEFAULT '1',
  `fecha_agregado` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `producto_id` (`producto_id`)
) ENGINE=MyISAM AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carrito`
--

LOCK TABLES `carrito` WRITE;
/*!40000 ALTER TABLE `carrito` DISABLE KEYS */;
INSERT INTO `carrito` VALUES (42,5,3,1,'2026-04-08 23:51:58');
/*!40000 ALTER TABLE `carrito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalles_pedido`
--

DROP TABLE IF EXISTS `detalles_pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalles_pedido` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `cantidad` int NOT NULL DEFAULT '1',
  `precio_unitario` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  KEY `producto_id` (`producto_id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalles_pedido`
--

LOCK TABLES `detalles_pedido` WRITE;
/*!40000 ALTER TABLE `detalles_pedido` DISABLE KEYS */;
INSERT INTO `detalles_pedido` VALUES (1,1,11,1,45.99),(2,1,2,1,15.50),(3,1,3,1,89.99);
/*!40000 ALTER TABLE `detalles_pedido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `estado` varchar(30) NOT NULL DEFAULT 'Pendiente',
  `fecha_pedido` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES (1,2,151.48,'Pendiente','2026-04-09 00:16:02');
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `precio` decimal(10,2) NOT NULL,
  `stock` int DEFAULT '0',
  `imagen` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'Martillo','Martillo de acero forjado',25.99,50,'/ferresoft/uploads/img_69cbd93a93aa59.12815478.png','2026-03-19 01:38:28'),(2,'Destornillador','Set de destornilladores 6 piezas',15.50,99,'/ferresoft/uploads/img_69cbd954288e70.18766659.png','2026-03-19 01:38:28'),(3,'Taladro','Taladro eléctrico 500W',89.99,24,'/ferresoft/uploads/img_69cbd963e04c56.89367961.png','2026-03-19 01:38:28'),(4,'Llave Inglesa','Llave ajustable 10 pulgadas',18.75,75,'/ferresoft/uploads/img_69cbd96d43c510.48689897.png','2026-03-19 01:38:28'),(5,'Alicate Universal','Alicate de acero de 8 pulgadas con mango antideslizante',22.40,60,'/ferresoft/uploads/img_69cbd985e761e2.48313494.png','2026-03-24 02:43:54'),(6,'Cinta Metrica','Cinta metrica retractil de 5 metros con carcasa plastica',12.90,120,'/ferresoft/uploads/img_69cbd9ad5e3292.86534061.png','2026-03-24 02:43:54'),(7,'Serrucho','Serrucho manual de 20 pulgadas para corte de madera',27.80,35,'/ferresoft/uploads/img_69cbd9d6c599e2.90424296.png','2026-03-24 02:43:54'),(8,'Pala','Pala metálica con mango de madera para construcción y jardinería',34.50,40,'/ferresoft/uploads/img_69cbd9fdb13874.14832199.png','2026-03-24 02:43:54'),(9,'Brocha','Brocha de 3 pulgadas para pintura de superficies',9.75,150,'/ferresoft/uploads/img_69cbda1fcf4ce1.43558759.png','2026-03-24 02:43:54'),(10,'Rodillo de Pintura','Rodillo de pintura de 9 pulgadas con mango ergonómico',16.30,90,'/ferresoft/uploads/img_69cbda2d7358d1.25693017.png','2026-03-24 02:43:54'),(11,'Caja de Herramientas','Caja de herramientas plástica con compartimentos y cierre seguro',45.99,29,'/ferresoft/uploads/img_69cbda40192861.97882110.png','2026-03-24 02:43:54'),(12,'Nivel','Nivel manual de aluminio de 24 pulgadas de alta precision',21.60,55,'/ferresoft/uploads/img_69cbda534561b6.15124107.png','2026-03-24 02:43:54'),(13,'Juego de Llaves Allen','Juego de llaves Allen en acero templado de 9 piezas',14.20,85,'/ferresoft/uploads/img_69cbda69382fd5.16449839.png','2026-03-24 02:43:54'),(14,'Escalera','Escalera de aluminio de 4 pasos resistente y liviana',79.90,18,'/ferresoft/uploads/img_69cbda7858f933.77071110.png','2026-03-24 02:43:54'),(15,'Cemento','Bolsa de cemento gris de 50 kg para construcción',32.00,70,'/ferresoft/uploads/img_69cbc3b9551b51.71792094.png','2026-03-24 02:43:54'),(16,'Pintura Blanca','Pintura blanca acrílica para interiores en galón',48.75,45,'/ferresoft/uploads/img_69cbda8f54e5d8.94725258.png','2026-03-24 02:43:54'),(17,'Tornillos','Caja de tornillos galvanizados de 100 unidades',11.50,200,'/ferresoft/uploads/img_69cbdd1a35afe7.33036963.png','2026-03-24 02:43:54'),(18,'Tuercas','Paquete de tuercas hexagonales de acero de 50 unidades',8.90,180,'/ferresoft/uploads/img_69cbdd2b50c8e9.89084870.png','2026-03-24 02:43:54'),(19,'Clavos','Caja de clavos de acero de 2 pulgadas',7.80,160,'/ferresoft/uploads/img_69cbdd09e40ab4.95735616.png','2026-03-24 02:43:54'),(20,'Manguera','Manguera flexible de jardín de 10 metros',26.40,50,'/ferresoft/uploads/img_69cbdaabe1bb42.54073063.png','2026-03-24 02:43:54'),(21,'Interruptor','Interruptor eléctrico sencillo de pared color blanco',6.50,110,'/ferresoft/uploads/img_69cbdabe8edb30.09434138.png','2026-03-24 02:43:54'),(22,'Tomacorriente','Tomacorriente doble de pared con acabado plástico',7.20,95,'/ferresoft/uploads/img_69cbdacf5a3ee0.49913187.png','2026-03-24 02:43:54'),(23,'Guantes de Trabajo','Par de guantes de trabajo resistentes para construcción',13.80,75,'/ferresoft/uploads/img_69cbdadd6a87d7.24110542.png','2026-03-24 02:43:54'),(24,'Casco de Seguridad','Casco de seguridad industrial ajustable color amarillo',29.99,28,'/ferresoft/uploads/img_69cbdaf508e672.00384907.png','2026-03-24 02:43:54');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('admin','cliente') DEFAULT 'cliente',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `telefono` varchar(20) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `tipo_documento` varchar(20) DEFAULT NULL,
  `numero_documento` varchar(30) DEFAULT NULL,
  `theme_preference` enum('light','dark') NOT NULL DEFAULT 'light',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Admin','admin@ferresoft.com','$2y$10$Kdnm0HDgOSbkss2q.BE2E.mTtJeA0ywycS4mxLnirGnFE1l6bda62','admin','2026-03-12 21:13:30',NULL,NULL,NULL,NULL,NULL,'dark'),(2,'Miguel','mangelmoreno01@gmail.com','$2y$10$peI1Xkj.pp3beGaEwxtgg.todxqyuNfxPUtfMegNedWFNlApR2ijq','cliente','2026-03-19 01:53:30',NULL,NULL,NULL,NULL,NULL,'dark'),(5,'Tales de mileto con sangre griega y europea hijo del propio zeusaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','tal@gmail.com','$2y$10$HHVqHNE1ooiat3ZOWUZ1tOhol6FM/Vbjl/.u0cEcIyLWZtCXX.lOq','cliente','2026-04-08 23:51:54','','','','','','light');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-08 19:38:38
