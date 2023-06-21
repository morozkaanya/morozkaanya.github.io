<?php
if(isset($_POST["name"])){
  
    $name = $_POST["name"];
}
if(isset($_POST["surname"])){
  
    $surname = $_POST["surname"];
}
echo "Имя: name <br>  $surname";
?>
