<?php
	$host="localhost"; // Host name 
	$port="3306"; // Host port
	$username="root"; // Mysql username 
	$password=""; // Mysql password 
	$db_name="cyphy"; // Database name 
	
	
	// Connect to server and select databse.
	$connection = new mysqli($host, $username, $password, $db_name, $port);
	if($connection->connect_errno) {
		echo("error connection :" . $connection->connect_error);
		echo "falhou";
		exit();
	}
	
	$sql = "SET NAMES 'utf8'";
	$result = $connection->query($sql);
?>