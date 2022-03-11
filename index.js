const fs = require("fs");
const url = require("url");
const http = require("http");
const https = require("https");
const {weather_id} = require(`./Credentials.json`);
const port = 3000;

const server = http.createServer();
server.on("request",request_handler);

function request_handler(req,res){
    console.log(`New Request from ${req.socket.remoteAddress} for ${req.url}`);
    if(req.url === "/"){
        res.writeHead(200, {"Content-Type": "text/html"});
        const html_stream = fs.createReadStream("form.html");
        html_stream.pipe(res);
    }
    else if (req.url.startsWith("/submit")){
        const user_input = url.parse(req.url, true).query;
        const zip_code = user_input.zip_code;
        console.log(`entered zip code: ${zip_code}`);
        if(zip_code == null || zip_code == ""){
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(`<h1>404 Not Found</h1>`);
        }
        else{
            const weather_api = https.request(`https://api.openweathermap.org/data/2.5/weather?zip=${zip_code},us&appid=${weather_id}`, weather_res => process_stream(weather_res, w_results, res)).end();
        }
    }
    else if (req.url.startsWith("/print")){
        res.writeHead(200, {"Content-Type": "text/html"});
        const user_input = url.parse(req.url, true).query;
        const today = new Date();
        const dob = new Date(user_input.dob);
        const days_old = Math.floor((today-dob)/(1000*60*60*24));
        res.end(`<h1>Welcome ${user_input.name} </h1>
                <p>You are ${days_old} days old </p>`);
    } 
    else if (req.url.startsWith("/anime.jpg")) {
        res.writeHead(200, {"Content-Type": "images/jpg"});
        const html_stream = fs.createReadStream("anime.jpg");
        html_stream.pipe(res);
    }
    else{
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(`<h1>404 Not Found</h1>`);
    }
}
function process_stream (stream, callback, ...args){
    let body = "";
    stream.on("data",chunk =>  body += chunk);
    stream.on("end", ()=> callback(body, ...args));
}
function process_stream_ani (stream, callback, ...args){
    let body = "";
    stream.on("data",chunk =>  body += chunk);
    stream.on("end", ()=> callback(body, ...args));
    console.log("processing the stream");
}

function w_results(data,res){
    const lookW = JSON.parse(data);
    let weatherDescription = "data not found";
    if(lookW != null){
        weatherDescription = lookW.weather[0].main;
        location = lookW.name;
    } 
    var genre = "";
    if(weatherDescription == "Drizzle"){ genre = "romance"}
    else if(weatherDescription == "Thunderstorm"){ genre = "horror"  }
    else if(weatherDescription == "Rain"){ genre = "drama"  }
    else if(weatherDescription == "Snow"){ genre = "sci-fi"}
    else if(weatherDescription == "Clouds" || weatherDescription == "Clear"){ genre = "adventure" }
    else{genre = "mystery";}
    console.log(genre);
    if(genre == null || genre == ""){
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(`<h1>404 Not Found</h1>`);
    }
    else{
        https.request(`https://kitsu.io/api/edge/anime?filter[categories]=${genre}&page[limit]=20&page[offset]=0`, anime_res => process_stream_ani(anime_res, a_results, res,weatherDescription,location)).end();
    }
}
function a_results(data,res, weatherDescription,location){
    const lookA = JSON.parse(data);
    res.writeHead(200, {"Content-Type": "text/html"});
    res.write(`<h1>Weather : ${weatherDescription} , at ${location}.</h1>`);

    if(weatherDescription === "error"){                                                          
        res.writeHead("Not found !!");
    }
    else if(weatherDescription === "Drizzle"){ //romance
        res.write(`Slow rain, romantic `);
        for(i=0;i<20;i++){res.write(`<h4>${lookA.data[i].attributes.titles.en_jp}</h4>`);}
    }
    else if(weatherDescription === "Thunderstorm"){ // horror
        res.write("thunder yo \n");
        res.write(`Some horror would be good int this weather.`);
        for(i=0;i<20;i++){res.write(`<h4>${lookA.data[i].attributes.titles.en_jp}</h4>`);}
    }
    else if(weatherDescription === "Rain"){ //drama
        res.write("rainy yo \n");
        res.write(`Watch some drama.`);
        for(i=0;i<20;i++){res.write(`<h4>${lookA.data[i].attributes.titles.en_jp}</h4>`);}
    }
    else if(weatherDescription === "Snow"){ // sci-fi
        res.write("snow yo \n");
        res.write(`Watch some Sci-Fi.`);
        for(i=0;i<20;i++){res.write(`<h4>${lookA.data[i].attributes.titles.en_jp}</h4>`);}
    }
    else if(weatherDescription === "Clouds" || weatherDescription === "Clear"){ //adventure
        res.write("clouds yo \n");
        res.write(`Watch some adventure.`);
        for(i=0;i<20;i++){res.write(`<h4>${lookA.data[i].attributes.titles.en_jp}</h4>`);}
    }
    else{
        res.write("weather is so bad, cant see \n");
        res.write("Mysterious");
        for(i=0;i<20;i++){res.write(`<h4>${lookA.data[i].attributes.titles.en_jp}</h4>`);}
    }
    res.end();
}

server.on("listening",listen_handler)
function listen_handler(){
    console.log(`now listening port ${port}`);
}
server.listen(port);