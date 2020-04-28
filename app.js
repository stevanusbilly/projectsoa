const express = require("express");
const app = express();
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
var bodyParser = require('body-parser')
var request = require('request')
app.use(express.json());
app.use(bodyParser.json());
require('dotenv').config();

const pool = mysql.createPool({
    host:"localhost",
    database:"tutor_soa_minggu6",
    user:"root",
    password:""
})

app.use(bodyParser.urlencoded({ extended: true }));

// apikey weather.io
//var key = "e195d378aaf344e9954cfbd417f79d77"
var key = "1e912c6a9f5c478b971957f039a7488a"

//url link hero
// proyeksoa2020-217116658.herokuapp.com
app.get("/tugas",function(req,ress){
    ress.send("masuk")
})

app.post('/api/registerUser', (req, res) => {
    var no=req.body.id_user;
    var nama=req.body.username;
    var pass=req.body.password;
    var email=req.body.email;

    emails = false;
    pool.getConnection(function(err,con){
    if (!req.body.password || !req.body.username || !req.body.email){
        res.status(400).send('semua field terisi!');
        return;
    }
    else {
    con.query('select * from user',[email], (error, rows, fields) => {
        if (error) {
            console.error(error);
        } else {
            rows.forEach(function(row) {
                req.body.id_user++;
                no=req.body.id_user;
                if(row.email == email){
                    emails = true
                }
            });
            if(emails == false){
                con.query("insert into user values(?,?,?,?)",[no,nama,pass,email], (error, rows, fields) => {
                    if (error) {
                        console.error(error);
                    } else {
                        const course = {
                            no: req.body.id_user,
                            pass: req.body.password,
                            nama: req.body.username,
                            email: req.body.email,
                            status: '200',
                            messsage: 'Registrasi berhasil',
                        };
                        res.status(200).send(course);     
                    }
                });
            }else{
                res.send("email sudah terpakai")
            }
        }
    });
}
    })
});

app.post("/api/login",function(req,res){ 
    const email = req.body.email;
    const password = req.body.password;
    pool.getConnection(function(err,conn){
        if(err) res.status(500).send(err);
        else{
            conn.query(`select * from user where email='${email}' and password ='${password}'`,function(error,result){
                if(error ) res.status(500).send(error);
                else{
                    if(result.length <=0){
                        return res.status(400).send("Invalid Email or password");
                    }
                    const token = jwt.sign({    
                        "email":email,
                        "level":1 // 0->berbayar, 1->tidak berbayar
                    }   ,"proyeksoa"); //key yang dibutuhkan u/ verify
                    res.status(200).send(token);
                }
            })
        }
    });
})

app.get("/api/getlatlod",function(req,ress){
    kota = req.body.kota
    const options = {
        'url': `https://api.weatherbit.io/v2.0/current?lang=id&&city=`+kota+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) reject(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "city":rest.data[0].city_name,
                "country code":rest.data[0].country_code,
                "latitude":rest.data[0].lat+"degrees",
                "Longitude":rest.data[0].lon+"degrees"
            }
            ress.send(temp);
        } 
    })
})

app.get("/api/currentWeather",function(req,ress){
    kota = req.body.kota
    negara = req.body.negara
    const options = {
        'url': `https://api.weatherbit.io/v2.0/current?lang=id&&city=`+kota+`&country=`+negara+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) reject(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "city":rest.data[0].city_name,
                "timezone":rest.data[0].timezone,
                "kecepatan angin":rest.data[0].wind_spd+"m/s",
                "temperature":rest.data[0].temp+" C",
                "berawan":rest.data[0].clouds+"%",
                "city":rest.data[0].city_name,
                "cuaca":rest.data[0].weather.description,
                "jarak pandang":rest.data[0].vis+"KM",
                "Last observation time":rest.data[0].ob_time,
                "jam sekarang":rest.data[0].datetime,
            }
            ress.send(temp);
        } 
    })
})

app.get("/api/getAlertByPosition/",function(req,ress){
    latitude = req.body.latitude
    Longitude = req.body.Longitude
    const options = {
        'url': `https://api.weatherbit.io/v2.0/alerts?lat=`+latitude+`&lon=`+Longitude+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) reject(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "timezone":rest.timezone,
                "city":rest.city_name,
                "Weather alert":rest.alerts
            }
            ress.send(temp);
        } 
    })
})

app.get("/api/getAlertByCity/",function(req,ress){
    kota = req.body.kota
    negara = req.body.negara
    const options = {
        'url': `https://api.weatherbit.io/v2.0/alerts?city=`+kota+`&country=`+negara+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            if(rest.alerts.length == 0){
                var temp = {
                    "timezone":rest.timezone,
                    "city":rest.city_name,
                    "Weather alert":"tidak ada alert"
                }
            }else{
                var temp = {
                    "latitude":rest.lat+"degrees",
                    "Longitude":rest.lon+"degrees",
                    "timezone":rest.timezone,
                    "city":rest.city_name,
                    "Weather alert":rest.alerts
                }
            }
            
            ress.send(temp);
        } 
    })
})

app.get("/api/getAirQualityByPosition/",function(req,ress){
    latitude = req.body.latitude
    Longitude = req.body.Longitude
    const options = {
        'url': `https://api.weatherbit.io/v2.0/current/airquality?lat=`+latitude+`&lon=`+Longitude+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "timezone":rest.timezone,
                "city":rest.city_name,
                "data":rest.data
            }
            ress.send(temp);
        } 
    })
})

app.get("/api/getAirQualityByCity/",function(req,ress){
    kota = req.body.kota
    negara = req.body.negara
    const options = {
        'url': `https://api.weatherbit.io/v2.0/current/airquality?city=`+kota+`&country=`+negara+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "timezone":rest.timezone,
                "city":rest.city_name,
                "data":rest.data
            }
            ress.send(temp);
        } 
    })
})

app.get("/api/getHistoricalWeatherDailybyPosition/",function(req,ress){
    lat = req.body.latitude
    lon = req.body.longitude
    start = req.body.start
    end = req.body.end
    const options = {
        'url': `https://api.weatherbit.io/v2.0/history/daily?lat=`+lat+`&lon=`+lon+`&start_date=`+start+`&end_date=`+end+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "timezone":rest.timezone,
                "city":rest.city_name,
                "time":rest.datetime,
                "data":rest.data,
            }
             ress.send(temp);
        } 
    })
})

app.get("/api/getHistoricalWeatherDailybyCity/",function(req,ress){
    kota = req.body.kota
    negara = req.body.negara
    start = req.body.start
    end = req.body.end
    const options = {
        'url': `https://api.weatherbit.io/v2.0/history/daily?city=`+kota+`&country=`+negara+`&start_date=`+start+`&end_date=`+end+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "timezone":rest.timezone,
                "city":rest.city_name,
                "time":rest.datetime,
                "data":rest.data,
            }
            ress.send(temp);
        } 
    })
})

app.get("/api/getHistoricalEnergyWeatherbyPosition/",function(req,ress){
    lat = req.body.latitude
    lon = req.body.longitude
    start = req.body.start
    end = req.body.end
    const options = {
        'url': `https://api.weatherbit.io/v2.0/history/energy?lat=`+lat+`&lon=`+lon+`&start_date=`+start+`&end_date=`+end+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "timezone":rest.timezone,
                "city":rest.city_name,
                "data":rest.data
            }
            ress.send(temp);
        } 
    })
})

app.get("/api/getHistoricalEnergyWeatherbyCity/",function(req,ress){
    kota = req.body.kota
    negara = req.body.negara
    start = req.body.start
    end = req.body.end
    const options = {
        'url': `https://api.weatherbit.io/v2.0/history/energy?city=`+kota+`&country=`+negara+`&start_date=`+start+`&end_date=`+end+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "timezone":rest.timezone,
                "city":rest.city_name,
                "data":rest.data
            }
            ress.send(temp);
        } 
    })
})

app.get("/api/getHistoricalAirQualitybyPosition/",function(req,ress){
    lat = req.body.latitude
    lon = req.body.longitude
    const options = {
        'url': `https://api.weatherbit.io/v2.0/history/airquality?lat=`+lat+`&lon=`+lon+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "timezone":rest.timezone,
                "city":rest.city_name,
                "data":rest.data,
            }
            ress.send(temp);
        } 
    })
})

app.get("/api/getHistoricalAirQualitybyCity/",function(req,ress){
    kota = req.body.kota
    negara = req.body.negara
    const options = {
        'url': `https://api.weatherbit.io/v2.0/history/airquality?city=`+kota+`&country=`+negara+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "timezone":rest.timezone,
                "data":rest.data
            }
            ress.send(temp);
        } 
    })
})
//15
app.get("/api/get16dayforecast/",function(req,ress){
    kota = req.body.kota
    const options = {
        'url': `https://api.weatherbit.io/v2.0/forecast/daily?city=`+kota+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "city":rest.city_name,
                "data":rest.data
            }
            ress.send(temp);
        } 
    })
})
//16
app.get("/api/getForecastbyPosition",function(req,ress){
    lat = req.body.lat
    lon = req.body.lon
    const options = {
        'url': `https://api.weatherbit.io/v2.0/forecast/daily/airquality?lat=`+lat+`&lon=`+lon+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "city":rest.city_name,
                "data":rest.data
            }
            ress.send(temp);
        } 
    })
})
//17
app.get("/api/getForecastbyPostalCode",function(req,ress){
    postalcode = req.body.postalcode
    const options = {
        'url': `https://api.weatherbit.io/v2.0/forecast/daily/airquality?postal_code=`+postalcode+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "city":rest.city_name,
                "data":rest.data
            }
            ress.send(temp);
        } 
    })
})
//18
app.get("/api/getForecastbyStation",function(req,ress){
    station = req.body.station
    const options = {
        'url': `https://api.weatherbit.io/v2.0/forecast/daily?station=`+station+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "country code":rest.country_code,
                "city":rest.city_name,
                "data":rest.data
            }
            ress.send(temp);
        } 
    })
})
//19
app.get("/api/getForecastbyCityId",function(req,ress){
    cid = req.body.city_id
    console.log(cid)
    const options = {
        'url': `https://api.weatherbit.io/v2.0/forecast/daily?city_id=`+cid+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    request(options, (error, res) => {
        if (error) console.log(new Error(error));
        else{
            text = res.body.toString();
            rest = JSON.parse(text)
            var temp = {
                "city":rest.city_name,
                "data":rest.data
            }
            ress.send(temp);
        } 
    })
})

app.listen(3000,function(){
    console.log("Listening to port 3000");
})