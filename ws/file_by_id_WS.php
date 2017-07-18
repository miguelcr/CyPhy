<?php
	header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
	header("Cache-Control: post-check=0, pre-check=0", false);
	header("Pragma: no-cache");

	require 'connect.php';
	
	$id = $_GET["i"];
	$pwd = $_GET["p"];

	$sql = "SELECT password_file, directory_file FROM cyphy.files WHERE id_file='$id';";
	$result = $connection->query($sql);

	while ($row = mysqli_fetch_assoc($result)) {
     	$bdpwd = $row["password_file"];
     	$drc_file = $row["directory_file"];
	}

	if(strcmp($pwd,$bdpwd)==0){
		$myfile = fopen("../userfiles/".$drc_file.".txt", "r") or die("Unable to open file!");
		echo fread($myfile,filesize("../userfiles/".$drc_file.".txt"));
		fclose($myfile);

	}else echo false;

	@mysql_close($connection);
	
?>