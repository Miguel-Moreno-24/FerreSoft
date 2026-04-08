<?php
require_once 'models/Db.php';

$query = "DESCRIBE usuarios";
$result = mysqli_query($conn, $query);

if ($result) {
    echo "Columns in 'usuarios' table:\n";
    while ($row = mysqli_fetch_assoc($result)) {
        echo "- " . $row['Field'] . " (" . $row['Type'] . ")\n";
    }
} else {
    echo "Error: " . mysqli_error($conn);
}
?>
