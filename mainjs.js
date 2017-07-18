/*
    ATENÇAO: CASO O UTILIZAR UTILIZAR O 'DELETE' PARA APAGAR UMA CONNECÇAO, ESSA CONNEÇAO DEIXA DE APARECER 
    NO CANVAS, MAS CONTINUA A ESTAR NA ARRAY "CONNECTIONS", SO SAI DA CONNECTIONS QUANDO O UTILIZADOR FAZ TRIGGER
    A FUNCAO 'redrawConnections', SENDO ASSIM AO FAZER O JSON DAS CONNETIONS, VERIFICAR SE O .exists = true
    ISTO NAO SE VERIFICA AO AO USAR O 'DELETE' EM OBJECTOS
*/
class ObjConnection {
    /*
    constructor(obj1,obj2){ //obj1 -> obj2 ao iniciar
        this.obj1 = obj1; //obj mesmo 
        this.obj2 = obj2; //obj mesmo
        this.obj1_index = 0;
        this.obj2_index = 0;
        this.default_order = true; //true obj1->obj2 / false obj2->obj1
        this.drawConnection();
        this.exists = true; //if false = perm deleted !NAO PASSAR PARA JSON!
        //this.connection
        //this.connection_triangle
    } */
    constructor(obj1,obj2,obj1_index,obj2_index,default_order){
        this.obj1 = obj1; //obj mesmo 
        this.obj2 = obj2; //obj mesmo
        this.obj1_index = obj1_index;
        this.obj2_index = obj2_index;
        this.default_order = default_order; //true obj1->obj2 / false obj2->obj1
        this.drawConnection();
        this.exists = true; //if false = perm deleted !NAO PASSAR PARA JSON!
        //this.connection
        //this.connection_triangle
    }
    drawConnection(){
        var that = this; //onClick
        var connection = new Path.Line(this.obj1.obj_path.segments[this.obj1_index].point, this.obj2.obj_path.segments[this.obj2_index].point);
        connection.strokeColor = "black";
        connection.strokeWidth = 3;

        //triangle no meio da connection;
        var point1 = this.obj1.obj_path.segments[this.obj1_index].point;
        var point2 = this.obj2.obj_path.segments[this.obj2_index].point;
        var x_dif = Math.abs(point1.x - point2.x);
        var y_dif = Math.abs(point1.y - point2.y);
        var x = Math.min(point1.x, point2.x) + x_dif/2;
        var y = Math.min(point1.y, point2.y) + y_dif/2;
        var connection_triangle = new Path.RegularPolygon({
            center: new Point(x,y),
            sides: 3,
            radius: 10,
            fillColor: 'black',
            strokeColor : 'red'
        });
        var vector_x = this.obj1.obj_path.position.x - this.obj2.obj_path.position.x;
        var vector_y = this.obj1.obj_path.position.y - this.obj2.obj_path.position.y;
        var vector = new Point(vector_x,vector_y);
        connection_triangle.rotate(vector.angle);
        connection_triangle.rotate(35); //assim aponta para o obj2, a ficar obj1->obj2
        //connection_triangle.segments[0].selected=true;

        connection.onClick = function(event){
            if(Key.isDown('delete')){
                that.deleteConnection();
                that.exists = false; //perm delete
            }else{
                if(event.point.getDistance(that.obj1.obj_path.position) < event.point.getDistance(that.obj2.obj_path.position)){
                    that.changeIndexConnection(1,0); //obj1
                }else{
                    that.changeIndexConnection(0,1); //obj2
                }
            }
        }

        connection_triangle.onClick = function(event){
            connection_triangle.rotate(180);
            that.default_order = !that.default_order;
            //console.log(that.default_order);
        }
        if(this.default_order == false)connection_triangle.rotate(180);

        this.connection = connection;
        this.connection_triangle = connection_triangle;
    }
    deleteConnection(){
        this.connection.remove();
        this.connection_triangle.remove();
    }
    redrawConnection(){
        this.deleteConnection();
        this.drawConnection();
    }
    changeIndexConnection(obj1_inc, obj2_inc){
        this.obj1_index = this.obj1_index + obj1_inc;
        if(this.obj1_index >= this.obj1.obj_path.segments.length)this.obj1_index=0;

        this.obj2_index = this.obj2_index + obj2_inc;
        if(this.obj2_index >= this.obj2.obj_path.segments.length)this.obj2_index=0;

        this.redrawConnection();
    }
    checkObj(objToDelete){
        if(this.obj1 == objToDelete || this.obj2 == objToDelete){
            this.deleteConnection();
            this.exists = false; //perm delete
        }
    }
}

var showAllSavedInBD; //para ser visivel deste maintest.html

paper.install(window);
window.onload = function() {
    console.log("Loading main.js...");
    openTabs('content_tab2'); //começa as tabs na tab2, no maintest.htmt

    if (!window.FileReader) {
        //alert('Your browser does NOT support Uploading Json!'); //lang supportbrowser
        popShow('Your browser does NOT support Uploading Json!');
        return false;
    }

    var canvas = document.getElementById('canvas');
    paper.setup(canvas);
    var view = paper.view;

    var start_point = new Point(100,20);
    var Objects = [];
    var Connections = [];

    var selectedNowObj = 0;
    var selecedBeforeObj = 0;

    var speed = 1;

    var obj_i = 0; //obj que foi ultima vez after-center-before buttons

    var original_view_center = view.center;

    var statement_bring_used = 0;
    var api_bring_used = 0;
    var api_tested=false;

    var that = this;

    var drawGrid = function (cellSize) {
    
        this.cellSize = cellSize;
        this.gridColor = '#D0D0D0';
        this.gridGroup;
    
        var self = this;

        var boundingRect = view.bounds;
        var num_rectangles_wide = view.bounds.width / this.cellSize;
        var num_rectangles_tall = view.bounds.height / this.cellSize;

        this.createGrid = function() {
        
            gridGroup = new Group();
        
            for (var i = 0; i <= num_rectangles_wide; i++) {
                var correctedLeftBounds = Math.ceil(boundingRect.left / self.cellSize) * self.cellSize;
                var xPos = correctedLeftBounds + i * self.cellSize;
                var topPoint = new Point(xPos, boundingRect.top);
                var bottomPoint = new Point(xPos, boundingRect.bottom);
                var gridLine = new Path.Line(topPoint, bottomPoint);
                gridLine.strokeColor = self.gridColor;
                gridLine.strokeWidth = 1 / view.zoom;
    
                self.gridGroup.addChild(gridLine);
            }
    
            for (var i = 0; i <= num_rectangles_tall; i++) {
                var correctedTopBounds = Math.ceil(boundingRect.top / self.cellSize) * self.cellSize;
                var yPos = correctedTopBounds + i * self.cellSize;
                var leftPoint = new Point(boundingRect.left, yPos);
                var rightPoint = new Point(boundingRect.right, yPos);
                var gridLine = new Path.Line(leftPoint, rightPoint);
            
                gridLine.strokeColor = self.gridColor;
                gridLine.strokeWidth = 1 / view.zoom;
                self.gridGroup.addChild(gridLine);
            }
            gridGroup.sendToBack();
            view.update();
        }
    
        this.removeGrid = function() {
            for (var i = 0; i < gridGroup.children.length-1; i++) {
                gridGroup.children[i].remove();
            }
            gridGroup.remove();
        }
    
        if(typeof gridGroup === 'undefined') {
            this.createGrid();
        }else{
            this.removeGrid();
            this.createGrid();        
        }  
    }

    updateInfo();
    
    view.onMouseDrag = function(event){
        removePop();
        if(!Key.isDown('shift'))return;

        if(event.delta.x < 0){
            view.center = view.center.add(new Point(-1*speed,0));
        }
        if(event.delta.x > 0){
            view.center = view.center.add(new Point(speed,0));
        }
        if(event.delta.x == 0){
            //nothing
        }
        if(event.delta.y < 0){
            view.center = view.center.add(new Point(0,-1*speed));
        }
        if(event.delta.y > 0){
            view.center = view.center.add(new Point(0,speed));
        } 
        if (event.delta.y == 0){
            //nothing
        }
        updateInfo();
    }

    var placeHolder_a = new Path.Rectangle({
        point: [20, 20],
        size: [60, 60],
        strokeColor: 'black',
        fillColor: '#8D8DFF'
    });
    placeHolder_a.name = "Sensor";
    placeHolder_a.visible=false;
    //extra connections points for Sensor aka PlaceHolderA
    var point_a;
    point_a = getCenter(placeHolder_a.segments[0].point,placeHolder_a.segments[1].point);
    placeHolder_a.insert(1,point_a); //ponto medio
    point_a = getCenter(placeHolder_a.segments[0].point,placeHolder_a.segments[1].point);
    placeHolder_a.insert(1,point_a); //ponto medio esquerda
    point_a = getCenter(placeHolder_a.segments[2].point,placeHolder_a.segments[3].point);
    placeHolder_a.insert(3,point_a); //ponto medio direita
    point_a = getCenter(placeHolder_a.segments[4].point,placeHolder_a.segments[5].point);
    placeHolder_a.insert(5,point_a); //ponto medio
    point_a = getCenter(placeHolder_a.segments[4].point,placeHolder_a.segments[5].point);
    placeHolder_a.insert(5,point_a); //ponto medio esquerda
    point_a = getCenter(placeHolder_a.segments[6].point,placeHolder_a.segments[7].point);
    placeHolder_a.insert(7,point_a); //ponto medio direita
    point_a = getCenter(placeHolder_a.segments[8].point,placeHolder_a.segments[9].point);
    placeHolder_a.insert(9,point_a); //ponto medio
    point_a = getCenter(placeHolder_a.segments[8].point,placeHolder_a.segments[9].point);
    placeHolder_a.insert(9,point_a); //ponto medio esquerda
    point_a = getCenter(placeHolder_a.segments[10].point,placeHolder_a.segments[11].point);
    placeHolder_a.insert(11,point_a); //ponto medio direita
    point_a = getCenter(placeHolder_a.segments[12].point,placeHolder_a.segments[0].point);
    placeHolder_a.insert(13,point_a); //ponto medio
    point_a = getCenter(placeHolder_a.segments[12].point,placeHolder_a.segments[13].point);
    placeHolder_a.insert(13,point_a); //ponto medio esquerda
    point_a = getCenter(placeHolder_a.segments[14].point,placeHolder_a.segments[0].point);
    placeHolder_a.insert(15,point_a); //ponto medio direita
    point_a=null;

    var placeHolder_b = new Path.Star({
        center: [50, 50],
        points: 3,
        radius1: 25,
        radius2: 40,
        strokeColor: 'black',
        fillColor: 'yellow'
    });
    placeHolder_b.name = "API";
    placeHolder_b.visible=false;
    //extra connections points for API aka PlaceHolderB
    var point_b;
    point_b = getCenter(placeHolder_b.segments[0].point,placeHolder_b.segments[1].point);
    placeHolder_b.insert(1,point_b); //ponto medio
    point_b = getCenter(placeHolder_b.segments[0].point,placeHolder_b.segments[1].point);
    placeHolder_b.insert(1,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[2].point,placeHolder_b.segments[3].point);
    placeHolder_b.insert(3,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[4].point,placeHolder_b.segments[5].point);
    placeHolder_b.insert(5,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[4].point,placeHolder_b.segments[5].point);
    placeHolder_b.insert(5,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[6].point,placeHolder_b.segments[7].point);
    placeHolder_b.insert(7,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[8].point,placeHolder_b.segments[9].point);
    placeHolder_b.insert(9,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[8].point,placeHolder_b.segments[9].point);
    placeHolder_b.insert(9,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[10].point,placeHolder_b.segments[11].point);
    placeHolder_b.insert(11,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[12].point,placeHolder_b.segments[13].point);
    placeHolder_b.insert(13,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[12].point,placeHolder_b.segments[13].point);
    placeHolder_b.insert(13,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[14].point,placeHolder_b.segments[15].point);
    placeHolder_b.insert(15,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[16].point,placeHolder_b.segments[17].point);
    placeHolder_b.insert(17,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[16].point,placeHolder_b.segments[17].point);
    placeHolder_b.insert(17,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[18].point,placeHolder_b.segments[19].point);
    placeHolder_b.insert(19,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[20].point,placeHolder_b.segments[0].point);
    placeHolder_b.insert(21,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[20].point,placeHolder_b.segments[21].point);
    placeHolder_b.insert(21,point_b); //ponto medio direito
    point_b = getCenter(placeHolder_b.segments[22].point,placeHolder_b.segments[0].point);
    placeHolder_b.insert(23,point_b); //ponto medio direito
    point_b=null;

    var placeHolder_c = new Path.RegularPolygon({
        center: [50, 250],
        sides: 10,
        radius: 40,
        strokeColor: 'black',
        fillColor: '#88C400'
    });
    placeHolder_c.name = "Atuador";
    placeHolder_c.visible=false;
    //extra connections points for Atuador aka PlaceHolderC
    var point_c;
    point_c = getCenter(placeHolder_c.segments[0].point,placeHolder_c.segments[1].point);
    placeHolder_c.insert(1,point_c);
    point_c = getCenter(placeHolder_c.segments[2].point,placeHolder_c.segments[3].point);
    placeHolder_c.insert(3,point_c);
    point_c = getCenter(placeHolder_c.segments[4].point,placeHolder_c.segments[5].point);
    placeHolder_c.insert(5,point_c);
    point_c = getCenter(placeHolder_c.segments[6].point,placeHolder_c.segments[7].point);
    placeHolder_c.insert(7,point_c);
    point_c = getCenter(placeHolder_c.segments[8].point,placeHolder_c.segments[9].point);
    placeHolder_c.insert(9,point_c);
    point_c = getCenter(placeHolder_c.segments[10].point,placeHolder_c.segments[11].point);
    placeHolder_c.insert(11,point_c);
    point_c = getCenter(placeHolder_c.segments[12].point,placeHolder_c.segments[13].point);
    placeHolder_c.insert(13,point_c);
    point_c = getCenter(placeHolder_c.segments[14].point,placeHolder_c.segments[15].point);
    placeHolder_c.insert(15,point_c);
    point_c = getCenter(placeHolder_c.segments[16].point,placeHolder_c.segments[17].point);
    placeHolder_c.insert(17,point_c);
    point_c = getCenter(placeHolder_c.segments[18].point,placeHolder_c.segments[0].point);
    placeHolder_c.insert(19,point_c);
    
    point_c=null;

    var placeHolder_d = new Path.Rectangle({
        point: [20, 20],
        size: [90, 50],
        strokeColor: 'black',
        fillColor: '#FFAE00'
    });
    placeHolder_d.name = "Statement";
    placeHolder_d.visible=false;

    var point_d;
    point_d = getCenter(placeHolder_d.segments[0].point,placeHolder_d.segments[1].point);
    placeHolder_d.insert(1,point_d);
    point_d = getCenter(placeHolder_d.segments[0].point,placeHolder_d.segments[1].point);
    placeHolder_d.insert(1,point_d);
    point_d = getCenter(placeHolder_d.segments[2].point,placeHolder_d.segments[3].point);
    placeHolder_d.insert(3,point_d);
    point_d = getCenter(placeHolder_d.segments[4].point,placeHolder_d.segments[5].point);
    placeHolder_d.insert(5,point_d);
    point_d = getCenter(placeHolder_d.segments[4].point,placeHolder_d.segments[5].point);
    placeHolder_d.insert(5,point_d);
    point_d = getCenter(placeHolder_d.segments[4].point,placeHolder_d.segments[5].point);
    placeHolder_d.insert(5,point_d);
    point_d = getCenter(placeHolder_d.segments[6].point,placeHolder_d.segments[7].point);
    placeHolder_d.insert(7,point_d);
    point_d = getCenter(placeHolder_d.segments[8].point,placeHolder_d.segments[9].point);
    placeHolder_d.insert(9,point_d);
    point_d = getCenter(placeHolder_d.segments[8].point,placeHolder_d.segments[9].point);
    placeHolder_d.insert(9,point_d);
    point_d = getCenter(placeHolder_d.segments[10].point,placeHolder_d.segments[11].point);
    placeHolder_d.insert(11,point_d);
    point_d = getCenter(placeHolder_d.segments[12].point,placeHolder_d.segments[13].point);
    placeHolder_d.insert(13,point_d);
    point_d = getCenter(placeHolder_d.segments[12].point,placeHolder_d.segments[13].point);
    placeHolder_d.insert(13,point_d);
    point_d = getCenter(placeHolder_d.segments[14].point,placeHolder_d.segments[15].point);
    placeHolder_d.insert(15,point_d);
    point_d = getCenter(placeHolder_d.segments[16].point,placeHolder_d.segments[0].point);
    placeHolder_d.insert(17,point_d);
    point_d = getCenter(placeHolder_d.segments[16].point,placeHolder_d.segments[17].point);
    placeHolder_d.insert(17,point_d);
    point_d = getCenter(placeHolder_d.segments[16].point,placeHolder_d.segments[17].point);
    placeHolder_d.insert(17,point_d);
    point_d = getCenter(placeHolder_d.segments[18].point,placeHolder_d.segments[19].point);
    placeHolder_d.insert(19,point_d);
    point_d = getCenter(placeHolder_d.segments[20].point,placeHolder_d.segments[0].point);
    placeHolder_d.insert(21,point_d);
    point_d = getCenter(placeHolder_d.segments[20].point,placeHolder_d.segments[21].point);
    placeHolder_d.insert(21,point_d);
    point_d = getCenter(placeHolder_d.segments[22].point,placeHolder_d.segments[0].point);
    placeHolder_d.insert(23,point_d);
    point_d=null;


    //coloca o controlos na tabs para fazer objectos
    $("#Sensor_img").click(function(){
        removePop();
        premakeObject(placeHolder_a);
    });
    $("#Api_img").click(function(){
        removePop();
        premakeObject(placeHolder_b);
    });
    $("#Atuador_img").click(function(){
        removePop();
        premakeObject(placeHolder_c);
    });
    $("#Statement_img").click(function(){
        removePop();
        premakeObject(placeHolder_d);
    });

    //remove o popup dos Statment
    $("#statment_button").click(function() {
        removePop();
        document.getElementById("canvas").style.display = "block";
        document.getElementById("statment_div").style.display = "none";
        for (var i in Objects){
            if(Objects[i].id == statement_bring_used){
                Objects[i].obj_statment = document.getElementById("statment_textarea").value;
                document.getElementById("statment_textarea").value = "";
                statement_bring_used = 0;
                break;
            }
        }
    });

    //remove o popup dos APIs com ok
    $("#api_button").click(function() {
        removePop();
        let url = document.getElementById("api_text").value;
        if(url == false || url == ""){
            //alert("URL field is blank.");
            popShow("URL field is blank.");
            return;
        }

        if(api_tested==false){
            //alert("Please check the results because accepting. Click the \'test\' button.");
            popShow("Please check the results because accepting. Click the \'test\' button.");
            return;
        }

        document.getElementById("canvas").style.display = "block";
        document.getElementById("api_div").style.display = "none";
        for (var i in Objects){
            if(Objects[i].id == api_bring_used){
                Objects[i].obj_api = document.getElementById("api_text").value;
                document.getElementById("api_text").value = "";
                document.getElementById("api_results").innerHTML = "";
                api_bring_used = 0;
                api_tested=false;
                $("#api_tested").removeClass("green");
                $("#api_tested").addClass("red");
                break;
            }
        }
    });

    //remove o popup dos APIs com cancel
    $("#api_button_cancel").click(function() {
        removePop();
        document.getElementById("canvas").style.display = "block";
        document.getElementById("api_div").style.display = "none";
        document.getElementById("api_text").value = "";
        document.getElementById("api_results").innerHTML = "";
        api_bring_used = 0;
        api_tested=false;
        $("#api_tested").removeClass("green");
        $("#api_tested").addClass("red");
    });

    $('#api_text').on('input',function(e){
        if(api_tested==true){
            api_tested==false;
            $("#api_tested").removeClass("green");
            $("#api_tested").addClass("red");
        }
    });

    $("#statment_button").click(function() {
        removePop();
        document.getElementById("canvas").style.display = "block";
        document.getElementById("statment_div").style.display = "none";
        for (var i in Objects){
            if(Objects[i].id == statement_bring_used){
                Objects[i].obj_statment = document.getElementById("statment_textarea").value;
                document.getElementById("statment_textarea").value = "";
                statement_bring_used = 0;
                break;
            }
        }
    });

    $("#sql_button").click(function() {
        removePop();
        document.getElementById("canvas").style.display = "block";
        document.getElementById("sql_div").style.display = "none";

        $("#sql_table").empty();
        $("#procura").val("");
    });

    //api teste URL if valid
    $("#api_teste_button").click(function() {
        removePop();
        document.getElementById("api_results").innerHTML ="";
        api_tested=false;
        let url = document.getElementById("api_text").value;
        if(url == false || url == ""){
            //alert("URL field is blank.");
            popShow("URL field is blank.");
            return;
        }

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                urlresponse = xmlhttp.responseText;
                document.getElementById("api_results").innerHTML = "<br><br>"+xmlhttp.responseText;
                api_tested=true;
                $("#api_tested").removeClass("red");
                $("#api_tested").addClass("green");
            }else{
                document.getElementById("api_results").innerHTML = "<br><br>URL was not found, invalid or private.";
                api_tested=false;
            }
        }
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    });

    //download de json button trigger
    $("#json_download").click(function(){
        removePop();

        if(Objects.length==0){
            //alert("There is nothing to download to json.");
            popShow("There is nothing to download to json.");
            return;
        }

        var json = createJson();
        var name = "Cyphy" + new Date().getDate();
        downloadFile(json,name,"text/plain");
    });

    //upload de json button trigger
    $("#json_upload").click(function(){
        removePop();
        if(Objects!=0){
            //alert("Canvas needs to be clear to load."); //lang canvasclear
            popShow("Canvas needs to be clear to load.");
            return;
        }
        document.getElementById("fileid").click();
    });

    $("#fileid").change(function() {
        var fileInput = $("#fileid");
        var input = fileInput.get(0);
        var reader = new FileReader();
        if (input.files.length){
            var textFile = input.files[0];
            reader.readAsText(textFile);
            $(reader).on('load', processFile);
        }else{
            //alert("Something went wrong on upload. Try again.");
            popShow("Something went wrong on upload. Try again.");
        }
    });

    //save na bd de json button trigger
    $("#json_save").click(function(){
        removePop();
        if(Objects.length==0){
            //alert("There is nothing to save."); //lang canvasempty
            popShow("There is nothing to save.");
            return;
        }

        var json = createJson(); 

        var word = prompt("Please enter a reference word.", ""); //lang enterword
        if(word==null){
            return;
        }else if(word == ""){
            //alert("Reference word is obrigatory."); //lang obrigatoryword
            popShow("Reference word is obrigatory.");
            return;
        }else if(word.length < 3){
            //alert("Reference word is to short. Min: 3"); //lang shortword
            popShow("Reference word is to short. Min: 3");
            return;
        }else if(word.length > 10){
            //alert("Reference word is to long. Max: 10"); //lang longword
            popShow("Reference word is to long. Max: 10");
            return;
        }

        var pwd = prompt("Please enter a password word.", ""); //lang enterpws
        if(pwd==null){
            return;
        }else if(pwd == ""){
            //alert("Password is obrigatory."); //lang obrigatorypwd
            popShow("Password is obrigatory.");
            return;
        }else if(pwd.length < 8){
            //alert("Password is to short. Min: 8"); //lang shortpwd
            popShow("Password is to short. Min: 8");
            return;
        }else if(pwd.length > 20){
            //alert("Password is to long. Max: 20"); //lang longpwd
            popShow("Password is to long. Max: 20");
            return;
        }

        if(checkIfWordIsUnique(word)==false){
            //alert("Reference word is already in use, pick another one."); //lang newword
            popShow("Reference word is already in use, pick another one.");
            return;
        }

        //var filename = "Cyphy" + Math.floor((Math.random() * 100000) + 1); OR
        var filename = getNewFileName();
        addFileToBD(json,word,filename,pwd);
    });

    //load na bd de json button trigger
    $("#json_load").click(function(){
        removePop();
        if(Objects.length!=0){
            //alert("Canvas needs to be clear to load."); //lang canvasclear
            popShow("Canvas needs to be clear to load.");
            return;
        }

        document.getElementById("canvas").style.display = "none";
        document.getElementById("sql_div").style.display = "block";
        showAllSavedInBD("");
    });

    //caso ele fizer click do 'x' da procura dentro do "Load DB"
    $('#procura').on('search', function () {
        removePop();
        showAllSavedInBD("");
    });

    //download para codigo
    $("#code_button").click(function(){
        removePop();
        //console.log("faz download para codigo num file");

        if(Objects.length==0){
            //alert("There is nothing to convert.");
            popShow("There is nothing to convert.");
            return;
        }

        $("#comments").empty();
        $("#before").empty();
        $("#setup").empty();
        $("#loop").empty();

        var full_object = {
            Objects : Objects,
            Connections: Connections
        }
        var return_make_code = makecode(full_object); //return true ou false se funciou
        if(return_make_code==false){ 
            //alert("There was a problem with convertion to file, operation cancelled.");
            popShow("There was a problem with convertion to file, operation cancelled.");
            $("#comments").empty();
            $("#before").empty();
            $("#setup").empty();
            $("#loop").empty();
            return;
        }
        var data = null;

        let comments = document.getElementById('comments').innerHTML;
        let before = document.getElementById('before').innerHTML;
        let setup = document.getElementById('setup').innerHTML;
        let loop = document.getElementById('loop').innerHTML;

        setup = "void setup(){"+"\r\n"+setup+"\r\n"+"}";
        loop = "void loop(){"+"\r\n"+loop+"\r\n"+"}";

        var data = comments+"\r\n"+before+"\r\n"+setup+"\r\n"+loop;

        data=data.replace(new RegExp("<br>", 'g'),"\r\n");
        data=data.replace(new RegExp("&nbsp;", 'g')," ");

        var name = "Cyphy" + new Date().getDate();
        downloadFile(data,name,"text/plain");
    });

    showAllSavedInBD = function(search){
        $("#sql_table").empty();

        to_add = $("<tr/>");
        square = $("<th/>");
        square.append('ID');
        to_add.append(square);
        square = $("<th/>");
        square.append('Reference Word');
        to_add.append(square);
        square = $("<th/>");
        square.append('Filename');
        to_add.append(square);
        $("#sql_table").append(to_add);
        
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function(){
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                obj=JSON.parse(xmlhttp.responseText);
                console.log(obj);
                j=0;
                for (i = 0; i < obj.posts.length; i++){
                    if(search){
                        if(isNaN(search) && obj.posts[i].post.word_file.indexOf(search)==-1){ 
                            continue;
                        }
                    }
                    to_add = $("<tr/>");

                    square = $("<td/>").html(obj.posts[i].post.id_file);
                    to_add.append(square);
                    square = $("<td/>").html(obj.posts[i].post.word_file);
                    to_add.append(square);
                    square = $("<td/>").html(obj.posts[i].post.directory_file);
                    to_add.append(square);

                    $(to_add).click(function(){
                        let id, word, filename;
                        $(this).find('td').each(function() {
                            if(id==null)id=$(this).html();
                            else if(word==null)word=$(this).html();
                            else if(filename==null)filename=$(this).html();
                        });
                        loadFromDB(id,word,filename);
                    });

                    j++;
                    $("#sql_table").append(to_add);
                }
                if(j==0){
                    to_add = $("<tr/>");
                    square = $("<td/>").html("No results for that search.");
                    to_add.append(square);
                    $("#sql_table").append(to_add);
                }
            }else console.log("error");
        }
        xmlhttp.open("GET", "WS/file_list_WS.php?", true);
        xmlhttp.send();
    }

    //faz load da base de dados
    function loadFromDB(id, word, filename){
        var pwd_user = null;
        var pwd_user = prompt("Please enter the password", "");

        if (pwd_user == null) {
            return;
        }

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                if(xmlhttp.responseText==false){
                    //alert("Incorrect password.");
                    popShow("Incorrect password.");
                    return;
                }
                obj=JSON.parse(xmlhttp.responseText);

                document.getElementById("canvas").style.display = "block";
                document.getElementById("sql_div").style.display = "none";

                $("#sql_table").empty();
                $("#procura").val("");

                processObj(obj);
            }
        }

        xmlhttp.open("GET", "WS/file_by_id_WS.php?i="+id+"&p="+pwd_user, true);
        xmlhttp.send();
    }

    //faz upload do file para o servidor+php
    function addFileToBD(json,word,filename,password){
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                if(xmlhttp.responseText==true){
                    //alert("File as saved with success with name "+filename+".");
                    popShow("File as saved with success with name "+filename+".");
                }else if(xmlhttp.responseText==false){
                    //alert("Error occurred will uploading file.")
                    popShow("Error occurred will uploading file.");
                }else{
                    alert(xmlhttp.responseText); 
                }
            }
        }
        xmlhttp.open("GET", "WS/file_insirt_WS.php?u="+word+"&p="+password+"&f="+filename+"&j="+json, true);
        xmlhttp.send();
    }

    //point center de 2 points
    function getCenter(point1,point2){
        var x_dif = Math.abs(point1.x - point2.x);
        var y_dif = Math.abs(point1.y - point2.y);
        var x = Math.min(point1.x, point2.x) + x_dif/2;
        var y = Math.min(point1.y, point2.y) + y_dif/2;
        return new Point(x,y);
    }

    //funcao que faz um informaçao para um objecto
    function premakeObject(originalPath){
        var name = getNewName(); //nome de um object
        var id = new Date().valueOf(); //id de um object
        var type = originalPath.name; //id de um object

        makeObject(true,originalPath, name, id, type,"Light","No Description", "", "");
    }

    //funçao que faz um objecto
    function makeObject(pre, originalPath, name, value_id, type, sensor_type, descricao, statment, api){

        //path do obj
        var new_obj_path = originalPath.clone();
            new_obj_path.name = name;
            new_obj_path.selected=false;
            new_obj_path.visible=false;

        //caso for makeObject do premakeObject, mete no view.center
        if(pre == true)new_obj_path.position = view.center;

        //text para o nome
        var text_point = new Point(new_obj_path.position.x,new_obj_path.position.y-5);
        var new_obj_text = new PointText({
            point: text_point,
            content:  new_obj_path.name,
            fillColor: 'black',
            fontFamily: 'Courier New',
            fontWeight: 'bold',
            fontSize: 15,
            justification: 'center'
        });

        //text para o type
        var type_point = new Point(new_obj_path.position.x,new_obj_path.position.y+10);
        var new_obj_text_type = new PointText({
            point: type_point,
            content: type,
            fillColor: 'black',
            fontFamily: 'Courier New',
            fontWeight: 'bold',
            fontSize: 15,
            justification: 'center'
        });


        var new_obj = {
            obj_path : new_obj_path,
            obj_text : new_obj_text,
            obj_descricao : descricao,
            obj_type : type,
            obj_name : name,
            //obj_statment : "Not a Statement",
            id: value_id
        }

        //faz ganhar focus e update as tabs
        var getFocus = function(){
            //console.log("getting focus");

            //tira selection
            if(selecedBeforeObj != 0) selecedBeforeObj.obj_path.selected=false;
            //if(selectedNowObj != 0) selectedNowObj.obj_path.selected=false; not necessary

            //criar o new/before
            if(selectedNowObj != 0 && selecedBeforeObj.obj_path != selectedNowObj.obj_path && selectedNowObj.obj_path != new_obj_path)selecedBeforeObj = selectedNowObj;
            selectedNowObj = new_obj;

            //da selection
            //if(selecedBeforeObj != 0) selecedBeforeObj.obj_path.selected=true; not necessary
            if(selectedNowObj != 0) selectedNowObj.obj_path.selected=true;

            ////REMOVER ISTO DEPOIS, E SO UM OUTPUT TEMPORARIP PARA SABER COM QUEM TAS A FAZER LIGAÇOES PARA JA
            if(selecedBeforeObj != 0)document.getElementById("myLabel").innerHTML="Focus on "+selectedNowObj.obj_path.name+" -> "+selecedBeforeObj.obj_path.name+"."; 
            else document.getElementById("myLabel").innerHTML="[T]Focus on "+selectedNowObj.obj_path.name;

            //meter na tab caso ganhar focus como SelectedObjNew
            document.getElementById("obj_name").innerHTML= selectedNowObj.obj_path.name;
            document.getElementById("obj_type").innerHTML= type;

            //meter o nome dos objs ligadados a statment numa tab
            $("#connections_table").empty();
            if(new_obj_text_type.content == "Statement"){
                var count_temp=0;
                var objs_connected = get_connected_objs(selectedNowObj);
                to_add = $("<tr/>");
                square = $("<th/>");
                square.append('<label id=\"labelInput\">Inputs</label>');
                to_add.append(square);
                $("#connections_table").append(to_add);
                for(var i in objs_connected){
                    if(objs_connected[i].obj_type == "Sensor"){
                        to_add = $("<tr/>");
                        square = $("<td/>");
                        square.append('<label>'+objs_connected[i].obj_name+'</label>');
                        to_add.append(square);
                        square = $("<td/>");
                        square.append('<label>'+objs_connected[i].obj_type+'</label>');
                        to_add.append(square);
                        $("#connections_table").append(to_add);
                        count_temp++;
                    }
                }
                if(count_temp==0){ //caso no Inputs/Sensores
                    $("#labelInput").text("Statement has no Inputs");
                }
                count_temp=0;
                to_add = $("<tr/>");
                square = $("<th/>");
                square.append('<label id=\"labelOutput\">Outputs</label>');
                to_add.append(square);
                $("#connections_table").append(to_add);
                for(var i in objs_connected){
                    if(objs_connected[i].obj_type == "Atuador"){
                        to_add = $("<tr/>");
                        square = $("<td/>");
                        square.append('<label>'+objs_connected[i].obj_name+'</label>');
                        to_add.append(square);
                        square = $("<td/>");
                        square.append('<label>'+objs_connected[i].obj_type+'</label>');
                        to_add.append(square);
                        $("#connections_table").append(to_add);
                        count_temp++;
                    }
                }
                if(count_temp==0){ //caso no Outputs/Atuadores
                    $("#labelOutput").text("Statement has no Outputs");
                }
                count_temp=0;
                to_add = $("<tr/>");
                square = $("<th/>");
                square.append('<label id=\"labelOthers\">Others</label>');
                to_add.append(square);
                $("#connections_table").append(to_add);
                for(var i in objs_connected){
                    if(objs_connected[i].obj_type == "API" || objs_connected[i].obj_type == "Statement"){
                        to_add = $("<tr/>");
                        square = $("<td/>");
                        square.append('<label>'+objs_connected[i].obj_name+'</label>');
                        to_add.append(square);
                        square = $("<td/>");
                        square.append('<label>'+objs_connected[i].obj_type+'</label>');
                        to_add.append(square);
                        $("#connections_table").append(to_add);
                        count_temp++;
                    }
                }
                if(count_temp==0){ //caso no Others/API
                    $("#labelOthers").text("Statement has no Others");
                }
                count_temp=0;
            }
            $("#sensor_div").empty();
            if(new_obj_text_type.content == "Sensor"){
                //sensor_type
                $("#sensor_div").append('<label>Type of sensor:</label>');
                var list_of_types = {
                    'Light': 'Light',
                    'Sound': 'Sound',
                    'Speed': 'Speed',
                    'Potentiometer': 'Potentiometer'
                }
                var s = $('<select />');

                for(var val in list_of_types) {
                    $('<option />', {value: val, text: list_of_types[val]}).appendTo(s);
                }
                s.val(sensor_type);
                s.change(function() {
                    sensor_type = s.val();
                    new_obj.sensor_type = s.val();
                });
                $("#sensor_div").append(s);
            }
        }

        //faz mexer e update as connections
        var startMove = function(event){
            new_obj_path.position = new_obj_path.position.add(event.delta);
            new_obj_text.position = new_obj_path.position.add(event.delta);
            new_obj_text_type.position = new_obj_path.position.add(event.delta);
            new_obj_text.position.y += -5;
            new_obj_text_type.position.y += 10;
            redrawConnections();
        }

        //delete a este object
        var startDelete = function(){

            if(confirm("Are you sure you want to delete \'"+new_obj_text.content+"\' ?")==false)return;

            new_obj_path.remove();
            new_obj_text.remove();
            new_obj_text_type.remove();

            //tira as connections do canvas
            for (var i in Connections){
                Connections[i].checkObj(new_obj);
            }

            //tira a connection da array
            Connections = Connections.filter(function(el){
                return el.exists != false; // OU return el.obj1 != new_obj && el.obj2 != new_obj; capaz de ser mais lento
            })

            //tira o object da array
            Objects = Objects.filter(function(el){
                return el.obj_path != new_obj_path; 
            })

            //meter o focus direito depois de delete
            if(selecedBeforeObj!=0){
                selectedNowObj = selecedBeforeObj;
                document.getElementById("myLabel").innerHTML="Focus on "+selectedNowObj.obj_path.name;
            }else{
                selectedNowObj = 0;
                document.getElementById("myLabel").innerHTML="Focus on nothing"; 
            }

            //tira o focus na tab
            document.getElementById("obj_name").innerHTML= "-";
            document.getElementById("obj_type").innerHTML= "-";

            $("#connections_table").empty();
            $("#sensor_div").empty();

            refreshObjectsDiv(); //update ao div

            selecedBeforeObj = 0;
            obj_i=obj_i-1; //tira um i da selecçao de objects
        }

        //quando tem de se mexer
        new_obj_path.onMouseDrag = function(event){
            startMove(event);
        }
        new_obj_text.onMouseDrag = function(event){
            startMove(event);
        }
        new_obj_text_type.onMouseDrag = function(event){
            startMove(event);
        }

        //quando tem de ganhar focus
        new_obj_path.onClick = function(event){
            if(Key.isDown('delete'))startDelete();
            else getFocus();
        }
        new_obj_text.onClick = function(event){
            if(Key.isDown('delete'))startDelete();
            else getFocus();
        }
        new_obj_text_type.onClick = function(event){
            if(Key.isDown('delete'))startDelete();
            else getFocus();
        }
        
        //mudar o nome
        new_obj_text.onDoubleClick = function(event){
            var old_name = new_obj_path.name;
            var new_name = prompt("Please enter a new name",new_obj_text.content);

            //muda o nome em todos os sitios do obj
            if(new_name != null){

                //ve se o new_name já nao esta em uso
                if(does_obj_exist_by_name(new_name)==true){
                    console.log("name already exists");
                    return;
                }

                //REMOVER DEPOIS <---
                document.getElementById("myLabel").innerHTML = document.getElementById("myLabel").innerHTML.replace(new_obj_text.content,new_name);

                new_obj_text.content = new_name;
                new_obj_path.name = new_name;
                name = new_name; //já n tem interesse, remover(?)
                new_obj.obj_name = name;

                refreshObjectsDiv();//update div de objects porque ha um novo nome
            }

            // se for ligado a um statement, muda o nome no statment
            var con_obj = get_connected_objs_by_id(value_id);
            for(var i in con_obj){
                if(con_obj[i].obj_type == "Statement"){
                    old_name = "\'"+old_name+"\'";
                    new_name = "\'"+new_name+"\'";
                    console.log("replaceeee");
                    con_obj[i].obj_statment = con_obj[i].obj_statment.replace(new RegExp(old_name, 'g'),new_name);
                }
            }

        }

        //caso for um statement, adicionar uma textbox para ele
        if(new_obj_text_type.content == "Statement"){
            new_obj.obj_statment = statment; //se for um statement, fica com um campo statement
        	new_obj_path.onDoubleClick = function(event){
                document.getElementById("statment_textarea").value = new_obj.obj_statment;
                document.getElementById("canvas").style.display = "none";
                document.getElementById("statment_div").style.display = "block";
                statement_bring_used = new_obj.id;
        	}
        }

        //caso for um API, adiciona uma campo de API
        if(new_obj_text_type.content == "API"){
            new_obj.obj_api = api;
            new_obj_path.onDoubleClick = function(event){
                document.getElementById("api_text").value = new_obj.obj_api;
                document.getElementById("canvas").style.display = "none";
                document.getElementById("api_div").style.display = "block";
                api_bring_used = new_obj.id;
            }
        }

        //caso for um Sensor, adiciona o tipo de sensor
        if(new_obj_text_type.content == "Sensor"){
            new_obj.sensor_type = sensor_type;
            //console.log("Type of sensor: "+sensor_type);
        }

        Objects.push(new_obj); //add Obj a array de Objs
        new_obj_path.visible=true;

        refreshObjectsDiv(); //update ao div dos objects

        //console.log("Obj count: "+Objects.length);
    }

    //redesenha as connections, para se mexer objs, elas seguem
    function redrawConnections(){
        for (var i in Connections){
            if(Connections[i].exists == true)Connections[i].redrawConnection();
            else Connections.splice(i,1);
        }
    }

    //numero atual de paths
    function currentNumberOfPaths(){
        var items = project.getItems({
            class: Path
        });

        return items.length;
    }

    function updateInfo(){
        document.getElementById('coords').innerHTML = "X:"+Math.round(view.center.x)+"  Y:"+Math.round(view.center.y);
        
        document.getElementById('zoom').innerHTML = "Zoom: "+Math.round(view.zoom*100)+"%";

        drawGrid(75);
    }

    //funçao de testes
    document.getElementById("conc_button").onclick = function(){
        
        if(selectedNowObj==0 || selecedBeforeObj==0){
            //alert("No pair of objects selected.");
            popShow("No pair of objects selected.");
            return;
        }

        var con_obj = get_connected_objs(selectedNowObj);
        console.log(con_obj);
        for(var i in con_obj){
            console.log(con_obj[i]);
            if(con_obj[i] == selecedBeforeObj){
                //alert("Connection already in place.");
                popShow("Connection already in place.");
                return;
            }
        }
        
        if(selectedNowObj == 0) return;
        if(selecedBeforeObj == 0) return;
        var new_connection = new ObjConnection(selectedNowObj,selecedBeforeObj,0,0,true);
        Connections.push(new_connection);

        /* <-------- fazer o div do statment atualizar quando muda para ela<------------------
        if(selectedNowObj.obj_type="Statement"){
            console.log(selectedNowObj);
            selectedNowObj.getFocus;
        }else if(selecedBeforeObj.obj_type="Statement"){
            selecedBeforeObj.getFocus;
        }
        */
    }

    //coloca no center
    document.getElementById("center_button").onclick = function(){
        if(Objects.length == 0){
            view.center = original_view_center;
            obj_i=0;
        }else{
            view.center = Objects[0].obj_path.position;
            obj_i=0;
        }
        drawGrid(75);
        updateInfo();
    }

    //coloca no center
    document.getElementById("before_button").onclick = function(){
        //console.log("before");

        if(Objects.length==0)return; //nao há objs
        else if(obj_i == 0){
            obj_i = 0;
        }else if(obj_i > 0 &&  obj_i < Objects.length){
            obj_i = obj_i - 1;
        }
        view.center = Objects[obj_i].obj_path.position;
        drawGrid(75);
        updateInfo();
    }

    //coloca no center
    document.getElementById("after_button").onclick = function(){
        //console.log("after");

        if(Objects.length==0)return; //nao há objs
        else if(Objects.length == 1){
            obj_i = 0;
        }else if(Objects.length > 1 && obj_i < (Objects.length-1)){
            obj_i = obj_i + 1;
        }
        view.center = Objects[obj_i].obj_path.position;
        drawGrid(75);
        updateInfo();
    }

    //cor de layout default
    document.getElementById("black_color").onclick = function(){
        changeCSS('css/style_black.css',1);
    }

    //cor de layout verde
    document.getElementById("white_color").onclick = function(){
        changeCSS('css/style_white.css',1);
    }

    //cor de layout verde
    document.getElementById("green_color").onclick = function(){
        changeCSS('css/style_green.css',1);
    }

    //change css request
    function changeCSS(cssFile, cssLinkIndex) {

        var oldlink = document.getElementsByTagName("link").item(cssLinkIndex);

        var newlink = document.createElement("link");
        newlink.setAttribute("rel", "stylesheet");
        newlink.setAttribute("type", "text/css");
        newlink.setAttribute("href", cssFile);

        document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
    }

    $('#canvas').bind('mousewheel DOMMouseScroll MozMousePixelScroll', function(event){ 
        if (event.originalEvent.wheelDelta >= 0) {
            if(view.zoom>3) return false;
            view.zoom +=0.1;
        }
        else {
            if(view.zoom<0.5) return false;
            view.zoom -=0.1;
        }

        if(view.zoom <= 0.5)speed=4;
        else if(view.zoom <= 0.8)speed=2;
        else if(view.zoom <= 1)speed=1;
        updateInfo();
    });

    //primeiro button de download JSON [melhorar isto]
    function createJson(){
        var Json_object = {
            Objects : Objects,
            Connections: Connections
        }
        var json = JSON.stringify(Json_object);
        return json;
    }

    //download to file para o JsonDownload
    function downloadFile(data, filename, type) {
        var file = new Blob([data], {type: type});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
                url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);  
            }, 0); 
        }
    }

    //file->json->canvas <-
    function processFile(e) {
        var file = e.target.result;
        if (file && file.length){
            try {
                var xyz = JSON.parse(file);
            } catch(e) {
                console.log(e);
                //alert("The uploaded file is invalid.");
                popShow("The uploaded file is invalid.");
            } finally {
                processObj(xyz);
            }
        }
    }

    //json->canvas
    function processObj(xyz){
        console.log("ProcessObj");
        for(var i in xyz.Objects){
            var obj_x = xyz.Objects[i];

            var type_x = obj_x.obj_type;
            var placeholder_x = null;
            var statement_x = "null";
            var sensor_type_x = "Light";
            var api_x = "null";
            if(type_x == "Sensor"){
                placeholder_x = placeHolder_a;
                sensor_type_x = obj_x.sensor_type;
            }else if(type_x == "API"){
                placeholder_x = placeHolder_b;
                api_x = obj_x.obj_api;
            }else if(type_x == "Atuador"){
                placeholder_x = placeHolder_c;
            }else if(type_x == "Statement"){
                placeholder_x = placeHolder_d;
                statement_x = obj_x.obj_statment;
            }
            placeholder_x.removeSegments();
            placeholder_x.addSegments(obj_x.obj_path[1].segments); //devia ficar no sitio certo, mas nao ?
            makeObject(false,placeholder_x, obj_x.obj_name, obj_x.id, type_x, sensor_type_x, obj_x.obj_descricao, statement_x, api_x);
        }
            
        for(var k in xyz.Connections){
            var connection_x = xyz.Connections[k];
            var obj1_x = null;
            var obj2_x = null;
            var obj1_index = connection_x.obj1_index;
            var obj2_index = connection_x.obj2_index;
            var default_order = connection_x.default_order;
            for(var j in Objects){
                if(connection_x.obj1.id == Objects[j].id){
                    obj1_x=Objects[j];
                    continue;
                }
                if(connection_x.obj2.id == Objects[j].id){
                    obj2_x=Objects[j];
                continue;
                }            
            }
            var new_connection = new ObjConnection(obj1_x,obj2_x,obj1_index,obj2_index,default_order);
            Connections.push(new_connection);
        }
    }

    //vai buscar todos os object diretamente connectados ao main_obj
    var get_connected_objs = function(main_obj){
        var obj_connected = [];
        for(var i in Connections){
            if(Connections[i].obj1 == main_obj){
                obj_connected.push(Connections[i].obj2);
            }else if(Connections[i].obj2 == main_obj){
                obj_connected.push(Connections[i].obj1);
            }
        }
        return obj_connected;
    }

    //vai buscar todos os object diretamente connectados ao id
    var get_connected_objs_by_id = function(id){
        var obj_connected = [];
        for(var i in Connections){
            if(Connections[i].obj1.id == id){
                obj_connected.push(Connections[i].obj2);
            }else if(Connections[i].obj2.id == id){
                obj_connected.push(Connections[i].obj1);
            }
        }
        return obj_connected;
    }

    //ve se o nome do obj ja esta em uso
    var does_obj_exist_by_name = function(name){
        for(var i in Objects){
            if(Objects[i].obj_name == name){
                return true;
            }else continue;
        }
        return false;
    }

    //da um nome unico a um object novo UNDONE<------
    var getNewName = function(){
        return "Obj" + currentNumberOfPaths();
    }

    //da um nome unico a um filename, usado no directory .txt UNDONE<------- PROBLEMAS DE SEGURANÇA
    var getNewFileName = function(){
        return "Cyphy" + Math.floor((Math.random() * 100000) + 1);
        //return "Cyphy" + new Date().getUTCMilliseconds();
    }

    //check se é unique ou nao a reference word de saveDB <--------
    function checkIfWordIsUnique(){
        return true;
    }

    //faz refresh a lista de objects que existe
    function refreshObjectsDiv(){
        //console.log("refresh objects")
        var to_add, square;
        $("#objects_table").empty();
        console.log("Num:"+Objects.length);
        if(Objects.length==0){
            to_add = $("<tr/>");
            square = $("<th/>");
            square.append('<label>No Objects at the moment.</label>');
            to_add.append(square);
            $("#objects_table").append(to_add);
            return;
        }

        to_add = $("<tr/>");
        square = $("<th/>");
        square.append('<label>Name</label>');
        to_add.append(square);
        square = $("<th/>");
        square.append('<label>Type</label>');
        to_add.append(square);
        $("#objects_table").append(to_add);

        for(let i in Objects){
            to_add = $("<tr/>");
            square = $("<td/>");
            square.append('<label>'+Objects[i].obj_name+'</label>');
            to_add.append(square);
            square = $("<td/>");
            square.append('<label>'+Objects[i].obj_type+'</label>');
            to_add.append(square);
            $("#objects_table").append(to_add);
        }
    }

    //popup de info para o user
    function popShow(str){
        $('#myPopup').text(str);
        var popup = document.getElementById("myPopup");
        popup.classList.add("show");
    }

    //retira o popup de info
    function removePop(){
        var popup = document.getElementById("myPopup");
        popup.classList.remove("show");
    }
    
    document.getElementById("myLabel").innerHTML="cyphy-modelgraf";

    console.log("...done loading main.js");
}


//document.body.style.cursor = "move";
//document.getElementById("myLabel").innerHTML="Object Properties";
/*
    var placeHolder_b = new Path.Circle({
        center: [45, 150],
        radius: 30,
        strokeColor: 'black',
        fillColor: 'yellow'
    });
    placeHolder_b.name = "API";
    placeHolder_b.onMouseDown = function(event){
        makeObject(placeHolder_b);
    }
    var placeHolder_b_text = new PointText({
        point: placeHolder_b.position,
        content:  placeHolder_b.name,
        fillColor: 'black',
        fontFamily: 'Courier New',
        fontWeight: 'bold',
        fontSize: 15,
        justification: 'center'
    });
    placeHolder_b_text.onMouseDown = function(event){
        makeObject(placeHolder_b);
    }

    var placeHolder_c = new Path.RegularPolygon({
        center: [50, 250],
        sides: 10,
        radius: 40,
        fillColor: 'purple'
    });
    placeHolder_c.name = "DataBase";
    placeHolder_c.onMouseDown = function(event){
        makeObject(placeHolder_c);
    }
    var placeHolder_c_text = new PointText({
        point: placeHolder_c.position,
        content:  placeHolder_c.name,
        fillColor: 'black',
        fontFamily: 'Courier New',
        fontWeight: 'bold',
        fontSize: 15,
        justification: 'center'
    });
    placeHolder_c_text.onMouseDown = function(event){
        makeObject(placeHolder_c);
    }
*/
/*
    var placeHolder_c = new Path.RegularPolygon({
        center: [50, 250],
        sides: 10,
        radius: 40,
        fillColor: 'purple'
    });
    placeHolder_c.name = "Atuador";
    placeHolder_c.selected = false;

    var type_point = new Point(placeHolder_c.position.x,placeHolder_c.position.y+25);
    var placeHolder_c_text = new PointText({
        point: type_point,
        content:  placeHolder_c.name,
        fillColor: 'black',
        fontFamily: 'Courier New',
        fontWeight: 'bold',
        fontSize: 15,
        justification: 'center'
    });

    var point;
    point = getCenter(placeHolder_c.segments[0].point,placeHolder_c.segments[1].point);
    placeHolder_c.insert(1,point);
    point = getCenter(placeHolder_c.segments[2].point,placeHolder_c.segments[3].point);
    placeHolder_c.insert(3,point);
    point = getCenter(placeHolder_c.segments[4].point,placeHolder_c.segments[5].point);
    placeHolder_c.insert(5,point);
    point = getCenter(placeHolder_c.segments[6].point,placeHolder_c.segments[7].point);
    placeHolder_c.insert(7,point);
    point = getCenter(placeHolder_c.segments[8].point,placeHolder_c.segments[9].point);
    placeHolder_c.insert(9,point);
    point = getCenter(placeHolder_c.segments[10].point,placeHolder_c.segments[11].point);
    placeHolder_c.insert(11,point);
    point = getCenter(placeHolder_c.segments[12].point,placeHolder_c.segments[13].point);
    placeHolder_c.insert(13,point);
    point = getCenter(placeHolder_c.segments[14].point,placeHolder_c.segments[15].point);
    placeHolder_c.insert(15,point);
    point = getCenter(placeHolder_c.segments[16].point,placeHolder_c.segments[17].point);
    placeHolder_c.insert(17,point);
    point = getCenter(placeHolder_c.segments[18].point,placeHolder_c.segments[0].point);
    placeHolder_c.insert(19,point);
    

    placeHolder_c.onMouseDown = function(event){
        makeObject(placeHolder_c);
    }

    */

    /* ESTA VERSAO GUARDA SO OBJECTS QUE NAO ESTAM EM CONNECTIONS / CREATEJSON()
    var Objects_without_connection = [];

    loop1:
    for (var i in Objects){
        loop2:
        for(var j in Connections){
            if(Objects[i].id == Connections[j].obj1.id || Objects[i].id == Connections[j].obj2.id){
                continue loop1; //ou break loop2;
            }
        }
        //se chegou ate aqui é porque o objecto nao esta numa connection
        Objects_without_connection.push(Objects[i]);
    }

    var Json_object = {
        Connections: Connections,
        Solo_Objects : Objects_without_connection
    }
    */
    /*
    document.getElementById("statment_add_input").onclick = function(){
        if(selectedNowObj == null)return;
        if(selectedNowObj.obj_type != "Statement")return;
        console.log("add to Statement Input");

        var objs_connected_to = get_connected_objs(selectedNowObj);
        if(objs_connected_to.length == 0)return; //no connections a ele
        
        to_add = $("<tr/>");
            square = $("<th/>");
            combobox = $("<select/>");
            combobox.attr('id','inputCombobox');
            for(var i in objs_connected_to){
                var name = objs_connected_to[i].obj_name;
                var id = objs_connected_to[i].id;
                combobox.append('<option value="'+id+'">'+name+'</option>');
            }
            square.append(combobox);
            to_add.append(square);
            square = $("<th/>");
            square.append('<input type="text" value="null" />');
            to_add.append(square);
        $("#inputs_div").append(to_add);
    }

    $("body").css({
            "background-color": "#DCDCDC"
        });
        $("html").css({
            "background-color": "#DCDCDC"
        });
        $(".tabcontent").css({
            "background-image": "-webkit-linear-gradient(top, #ffffff, #000000)"
        });
        $(".info-bar").css({
            "color":"grey"
        });
        $("div.tab ").css({
            "background":"#197f99"
        });
        $(".tablinkS").css({
            "color":"white"
        });
        $("div.tab button:hover").css({
            "background-color":"#ddd"
        });
        $("div.tab button.active").css({
            "background-color":"#ccc"
        });
        $(".tabcontent").css({
            "background-color":"white",
            "background-image":"-webkit-linear-gradient(top, #cad1eb, #dedede)"
        });
        $(".button").css({
            "background-color":"#008B8B",
            "background":"#ffffff",
            "background-image":"-webkit-linear-gradient(top, #ffffff, #d1d1d1)",
            "color":"#6d6d6d"
        });/*
        $(".button:hover").css({
            "background":"#197f99",
            "color":"white"
        });
        $(".button:active").css({
            "background-color":"#2F4F4F"
        });
        $(".button").hover(function(){
            $(this).css("background","#197f99");
        });
    */