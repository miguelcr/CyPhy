<?php
	require 'connect.php';
	
	$sql = "SELECT * FROM cyphy.files";
	$result = $connection->query($sql);
	
	$posts = array();
	if ($result->num_rows > 0) {
		while($post = $result->fetch_assoc()){
			$posts[] = array('post'=>$post);
		}
	}
	
	echo json_encode(array('posts'=>$posts), JSON_UNESCAPED_UNICODE);
	
	@mysql_close($connection);
	
?>