<?php
	require 'connect.php';
	
	$username = $_GET["u"];
	$password = $_GET["p"];
	$file = $_GET["f"];
	$json = $_GET["j"];

	$drc = "../userfiles/";

	if(empty($username) || empty($password) || empty($file)){
		if(empty($nome)) echo "Preencha o nome! <br>";
		if(empty($descricao)) echo "Preencha a descricao! <br>";
		if(empty($file)) echo "Preencha o file! <br>";
	}else{
		$sql = "INSERT INTO cyphy.files(word_file, password_file, directory_file) 
				VALUES('$username','$password','$file')";
		if (mysqli_query($connection, $sql)) {
			
			$myfile = fopen($drc.$file.".txt", "w") or die("Unable to open file!");
			fwrite($myfile, $json);
			fclose($myfile);

			echo true;
		} else {
			echo false;
		}	
	}

	@mysql_close($connection);
?>