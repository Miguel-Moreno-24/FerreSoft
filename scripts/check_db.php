<?php
require_once __DIR__ . '/../models/Db.php';

$query = "DESCRIBE usuarios";
$result = mysqli_query($conn, $query);

if ($result) {
    echo "Columnas en la tabla 'usuarios':\n";
    while ($row = mysqli_fetch_assoc($result)) {
        echo '- ' . $row['Field'] . ' (' . $row['Type'] . ")\n";
    }
} else {
    echo 'Error: ' . mysqli_error($conn);
}
?>
