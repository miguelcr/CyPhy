
//used board ATmega168
//PWM, is a technique for getting analog results with digital means. 3 5 6 9 10 11
//existe pins GND, AREF
var analogpins = ['A0','A1','A2','A3','A4','A5'];
var digitalpins = ['2','4','6','7','8'];
var pwnpins = ['3','5','6','9','10','11']; //deixa analogWrite e analogRead
var apipin = 13; //always 13
var processFile; //make it visible to reader.html
var makecode; //make it visible to mainjs.js
var tab = "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp";

var comments_str="";

var api_set=false;

window.onload = loadFunction();
function loadFunction(){
    console.log("Loading readerjs.js...");
	processFile = function(e) {
        $("#comments").empty();
		$("#before").empty();
        $("#setup").empty();
        $("#loop").empty();

        var file = e.target.result;
        if (file && file.length) {
            //var xyz = JSON.parse(file);
            //console.log(xyz);
            //makecode(xyz);
            try {
                var xyz = JSON.parse(file);
            } catch(e) {
                console.log(e);
                alert("The uploaded file is invalid.");
            } finally {
                makecode(xyz);
            }
        }
    }

    makecode = function(xyz){
        var objects = xyz.Objects;
        var connections = xyz.Connections;
        console.log("Starting code...");
        for(let i=0;i<objects.length;i++){
            //console.log(objects[i].obj_type);
            if(objects[i].obj_type == "Sensor"){
                let sensorpin = analogpins.shift();
                let sensorname = objects[i].sensor_type+sensorpin;
                if(sensorpin==null){ //test this <-
                    alert("All pins already in use on an Arduino UNO.");
                    return false;
                }
                comments_str += "Connect "+objects[i].obj_name+" to pin "+sensorpin+"<br>";

                $("#before").append("const int "+sensorname+" = "+sensorpin+";<br>");
                $("#before").append("int sensorValue"+sensorname+" = 0;<br>");

                objects[i].sensorpin = sensorpin;
                objects[i].sensorname = sensorname;
                objects[i].sensorvalue = "sensorValue"+sensorname;

            }else if(objects[i].obj_type == "Atuador"){
                let ledpin = pwnpins.shift();
                let ledname = "ledpin"+ledpin;
                if(ledpin==null){ //test this <-
                    alert("All pins already in use on an Arduino UNO.");
                    return false;
                }
                comments_str += "Connect "+objects[i].obj_name+" to pin "+ledpin+"<br>";

                $("#before").append("const int "+ledname+" = "+ledpin+";<br>");

                objects[i].ledpin = ledpin;
                objects[i].ledname = ledname;

            }else if(objects[i].obj_type == "API"){
                if(api_set==true){
                    alert("You can have only one API.");
                    return false;
                }
                api_set=true;

                comments_str += "Connect your ethernet shield/Yún board to pin 13<br>";

                $("#before").prepend("\#include &lt;Bridge.h&gt;;<br>");
                $("#before").prepend("\#include &lt;HttpClient.h&gt;<br>");
                   
                $("#before").append("int apipin = "+apipin+";<br>");

                $("#setup").append(tab+"pinMode(apipin, OUTPUT);<br>");
                $("#setup").append(tab+"digitalWrite(apipin,LOW);<br>");
                $("#setup").append(tab+"Bridge.begin();<br>");
                $("#setup").append(tab+"digitalWrite(apipin,HIGH);<br>");
                $("#setup").append(tab+"SerialUSB.begin(9600);<br>");
                $("#setup").append(tab+"while(!SerialUSB);<br>");

                $("#loop").append(tab+"HttpClient client;<br>");
                $("#loop").append(tab+"client.get(\""+objects[i].obj_api+"\");<br>");
                $("#loop").append(tab+"while(client.available()){<br>");
                $("#loop").append(tab+tab+"char c = client.read();<br>");
                $("#loop").append(tab+tab+"SerialUSB.print(c);<br>");
                $("#loop").append(tab+"}<br>");
                $("#loop").append(tab+"SerialUSB.flush();<br>");
                
            }
        }

        //depois de declarar todos os atuadores e sensor, fazer os statments
        for(let i=0;i<objects.length;i++){
            if(objects[i].obj_type == "Statement"){

                var code = objects[i].obj_statment;//vai buscar o code todo
                var loop = statement_find_loop(code);//vai buscar o loop no code, se tiver
                if(loop==0)console.log("no loops"); // se n tiver
                else code=code.replace(loop,""); //se tiver, tira do code original
                
                //faz o code, que agora é so declaraçoes 100%
                for(let i=0;i<code.split('\n').length;i++){
                    var line = code.split('\n')[i];

                    if(line=="")continue; //se a linha tiver blank

                    let obj_name = get_obj_from_statment(line);
                    if(obj_name==""){
                        //set de um variavel
                        let var_name=line.split('=')[0];
                        let var_value=line.split('=')[1];
                        $("#before").append("int "+var_name+" = "+var_value+";<br>");
                    }else{
                        //set de um atuador
                        let obj = getObjectName(obj_name,objects);
                        if(obj.obj_type == "Atuador"){ //led
                            if(line.indexOf("LOW") >= 0) status = "LOW";
                            if(line.indexOf("HIGH") >= 0) status = "HIGH";
                            $("#setup").append(tab+"pinMode("+obj.ledname+", OUTPUT);<br>");
                            $("#setup").append(tab+"digitalWrite("+obj.ledname+","+status+");<br>");
                        }
                    }
                }

                //faz a parte do loop, se houver
                if(loop==0)continue; //se nao tiver loop, continua o for

                console.log(loop);
                for(let i=0;i<loop.split('\n').length;i++){
                    var line = loop.split('\n')[i];

                    if(line=="")continue; //se a linha tiver blank

                    if(line.split(' ')[0]=="loop"){
                        let control = line.split('(')[1];
                        control = control.replace(')','');
                        let obj_name = get_obj_from_statment(control);
                        let obj = getObjectName(obj_name,objects);
                        var threshold = control.split('\'')[2];
                        console.log(threshold);
                        $("#loop").append(tab+obj.sensorvalue +" = analogRead("+obj.sensorname+");<br>");
                        $("#loop").append(tab+"if("+obj.sensorvalue+" "+threshold+" ){<br>");

                    }else if(line.split(' ')[0]=="else"){
                        $("#loop").append(tab+"}else{<br>");
                    }else if(line.split(' ')[0]=="endloop"){
                        $("#loop").append(tab+"}<br>");
                    }else{
                        let obj_name = get_obj_from_statment(line);
                        if(obj_name==""){
                            //set de um variavel
                            let var_name=line.split('=')[0];
                            let var_value=line.split('=')[1];
                            $("#before").append("int "+var_name+" = "+var_value+";<br>");
                        }else{
                            //set de um atuador
                            let obj = getObjectName(obj_name,objects);
                            if(obj.obj_type == "Atuador"){ //led
                                if(line.indexOf("LOW") >= 0) status = "LOW";
                                if(line.indexOf("HIGH") >= 0) status = "HIGH";
                                $("#loop").append(tab+tab+"digitalWrite("+obj.ledname+","+status+");<br>");
                            }
                        }
                    }
                }
            }
        }
        
        for(let i=0;i<connections.length;i++){
            var obj_input = null;
            var obj_output = null;
            if(connections[i].default_order){  //obj1 -> obj2
                obj_input=getObject(connections[i].obj1.id,objects);
                obj_output=getObject(connections[i].obj2.id,objects);
            }else{                             //obj2 -> obj1
                obj_input=getObject(connections[i].obj2.id,objects);
                obj_output=getObject(connections[i].obj1.id,objects);
            }
            if(obj_input.obj_type == "Sensor" && obj_output.obj_type == "Atuador"){
                if(obj_input.sensor_type == "Potentiometer"){
                    //quer dizer que a led vai ter o valor do meu sensor
                    $("#before").append("int outputValue"+obj_output.ledname+" = 0;<br>");
                    $("#loop").append(tab+obj_input.sensorvalue+" = analogRead("+obj_input.sensorname+");<br>");
                    $("#loop").append(tab+"outputValue"+obj_output.ledname+" = map("+obj_input.sensorvalue+",0,1023,0,255);<br>"); //converter o valor
                    $("#loop").append(tab+"analogWrite("+obj_output.ledname+", outputValue"+obj_output.ledname+");<br><br>");
                }
            }else if(obj_input.obj_type == "Sensor" && obj_output.obj_type == "Statement"){
                //non atm
            }else if(obj_input.obj_type == "Statement" && obj_output.obj_type == "Atuador"){
                //non atm
            }else if(obj_input.obj_type == "Statement" && obj_output.obj_type == "API"){
                //STATMENT->API
            }else if(obj_input.obj_type == "Statement" && obj_output.obj_type == "Atuador"){
                //API->STATMENT
            }
        }
        $("#loop").append(tab+"delay(5000);<br>");
        comments_str = "/*<br>"+comments_str+"*/";
        $("#comments").append(comments_str);
        
        //clean up das vars, meter ready para a next
        analogpins = ['A0','A1','A2','A3','A4','A5'];
        digitalpins = ['2','4','6','7','8'];
        pwnpins = ['3','5','6','9','10','11']; //deixa analogWrite e analogRead
        comments_str="";
        api_set=false;

        console.log("...done");
        return true;
    }

    //var buscar um object com base no id fornecido
    function getObject(id,objs){
        for(let i=0;i<objs.length;i++){
            if(id==objs[i].id)return objs[i];
        }
    }

    function get_objs_from_statment(s){
        var objs_name = [];
        var in_name = false;
        var obj_name = "";
        for(let i=0;i<s.length;i++){
            if(s[i]=="'" && in_name==false){
                in_name=true;
            }else if(s[i]=="'" && in_name==true){
                in_name=false;
                objs_name.push(obj_name);
                obj_name="";
            }

            if(s[i]!="'" && in_name==true){
                obj_name=obj_name+s[i];
            }
        }
        return objs_name.filter(onlyUnique);
    }

    function get_obj_from_statment(s){
        var in_name = false;
        var obj_name = "";
        for(let i=0;i<s.length;i++){
            if(s[i]=="'" && in_name==false){
                in_name=true;
            }else if(s[i]=="'" && in_name==true){
                in_name=false;
            }
            if(s[i]!="'" && in_name==true){
                obj_name=obj_name+s[i];
            }
        }
        return obj_name;
    }

    function getObjectName(name, objs){
        for(let i=0;i<objs.length;i++){
            if(name==objs[i].obj_name)return objs[i];
        }
    }

    //filder array para tirar dupes
    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }

    function statement_find_loop(code){
        var number_of_loops = (code.match(/endloop/g) || []).length;
        if(number_of_loops>1){
            alert("Can't use loop inside a loop.");
            return -1;
        }else if(number_of_loops==1){
            var start = code.indexOf("loop");
            var end = code.lastIndexOf("endloop");
            return code.substring(start,end)+"endloop";
        }else if(number_of_loops==0)return 0;
    }
    console.log("...done loading readerjs.js");
}//end of window.onload





/*
                for(let i=0;i<code_remaining.split('\n').length;i++){
                    //console.log(code_remaining.split('\n')[i]);
                    var line = code_remaining.split('\n')[i];
                    if(line.indexOf("while") >= 0 || line.indexOf("if") >= 0 ){
                        if(line.indexOf("while") >= 0 )
                            code_remaining = code_remaining.substring(code_remaining.indexOf("while"));
                        if(line.indexOf("if") >= 0 )
                            code_remaining = code_remaining.substring(code_remaining.indexOf("if"));
                        break; //acabou a parte de colocar vars, agora é so if/while
                    }else{
                        let obj_name = get_obj_from_statment(line);
                        if(obj_name=="" || obj_name==" " || obj_name==null)continue;
                        let obj = getObjectName(obj_name,objects);
                        console.log(obj);
                        if(obj.obj_type == "Atuador"){ //led
                            if(line.indexOf("LOW") >= 0) status = "LOW";
                            if(line.indexOf("HIGH") >= 0) status = "HIGH";

                            $("#setup").append("pinMode("+obj.ledname+", OUTPUT);<br>");
                            $("#setup").append("digitalWrite("+obj.ledname+","+status+");<br>");
                        }
                    }
                }
                //fazer aqui os while e if
                console.log(code_remaining);
                */