<?php
require_once __DIR__ . '/Db.php';

function appEnsureColumn(mysqli $conn, string $table, string $column, string $definition): void
{
    $tableEscaped = mysqli_real_escape_string($conn, $table);
    $columnEscaped = mysqli_real_escape_string($conn, $column);
    $result = mysqli_query($conn, "SHOW COLUMNS FROM `{$tableEscaped}` LIKE '{$columnEscaped}'");

    if ($result && mysqli_num_rows($result) === 0) {
        mysqli_query($conn, "ALTER TABLE `{$tableEscaped}` ADD COLUMN {$definition}");
    }
}

function appEnsureSchema(mysqli $conn): void
{
    appEnsureColumn($conn, 'usuarios', 'telefono', '`telefono` VARCHAR(30) NULL DEFAULT NULL AFTER `email`');
    appEnsureColumn($conn, 'usuarios', 'ciudad', '`ciudad` VARCHAR(120) NULL DEFAULT NULL AFTER `telefono`');
    appEnsureColumn($conn, 'usuarios', 'direccion', '`direccion` TEXT NULL AFTER `ciudad`');
    appEnsureColumn($conn, 'usuarios', 'tipo_documento', '`tipo_documento` VARCHAR(60) NULL DEFAULT NULL AFTER `direccion`');
    appEnsureColumn($conn, 'usuarios', 'numero_documento', '`numero_documento` VARCHAR(30) NULL DEFAULT NULL AFTER `tipo_documento`');
    appEnsureColumn($conn, 'usuarios', 'theme_preference', "`theme_preference` ENUM('light','dark') NOT NULL DEFAULT 'light' AFTER `numero_documento`");
}

appEnsureSchema($conn);
