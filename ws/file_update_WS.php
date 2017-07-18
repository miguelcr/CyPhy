<?php
	require 'connect.php';
	
	$id = $_GET["i"];
	$username = $_GET["u"];
	$password = $_GET["p"];
	$file = $_GET["f"];

	if(empty($username) || empty($password) || empty($file)){
		if(empty($nome)) echo "Preencha o nome! <br>";
		if(empty($descricao)) echo "Preencha a descricao! <br>";
		if(empty($file)) echo "Preencha o file! <br>";
	}else{
		$sql = "UPDATE cyphy.files SET
				word_file='$username',
				password_file='$password',
				directory_file="$file"
				WHERE id_Alergenio='$id';";
		
		if (mysqli_query($connection, $sql)) {
			//echo "Record edited successfully";
			echo true;
		} else {
			//echo "Error: " . $sql . "<br>" . mysqli_error($connection);
			echo false;
		}
	}
	@mysql_close($connection);
?>