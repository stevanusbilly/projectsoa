const express = require("express");
const app = express();
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
var bodyParser = require('body-parser')
const http = require('http');
var request = require('request')
multer = require('multer');
path = require('path')
app.use(express.json());
app.use(bodyParser.json());
require('dotenv').config();

const port = process.env.PORT || 3000
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

//link pembayaran midtrans
//https://simulator.sandbox.midtrans.com/bca/va/index

let storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, './uploads')
    },
    filename: function(req, file, callback) {
        callback(null,file.originalname)
    }
})
var upload = multer({ storage: storage })

const pool = mysql.createPool({
    host:"sql12.freemysqlhosting.net",
    user:"sql12344701",
    password:"EAMeb36449",
    port:"3306",
    database:"sql12344701",
})


// apikey weather.io
//var key = "e195d378aaf344e9954cfbd417f79d77"
var key = "1e912c6a9f5c478b971957f039a7488a"

const SERVERKEY_MIDTRANS = 'SB-Mid-server-T4agrfWABk-N9H2MlpDtG-uO'

    
app.post('/user/registerUser', upload.single('filename'),async (req, res) => {
    const email = req.body.email;
    const filename = req.file.filename;
    const nama = req.body.nama;
    tipe = 0
    const password = req.body.password;
    api_hit = 50;
    pool.getConnection(function(err,conn){
        if(email != "" && nama != "" && tipe != "" && password!= ""){
            conn.query(`select * from user where email='${email}'`,function(error,result){
                if(result.length > 0){
                    return res.status(403).send({
                        "status":"403",
                        "msg":"user already exist"
                    });
                }else{
                    conn.query("insert into user values(?,?,?,?,?)",[email,password,nama,tipe,filename], (error, rows, fields) => {
                        res.status(200).send({
                            "status":"200",
                            "msg":"register success"
                        })
                    });
                }
            })
        }else{
            res.send("data harus terisi semua")
        }
    });
});

app.post("/user/login",function(req,res){ 
    const email = req.body.email;
    const password = req.body.password;
    pool.getConnection(function(err,conn){
        conn.query(`select * from user where email='${email}' and password ='${password}'`,function(error,result){
            if(result.length <=0){
                return res.status(403).send({
                    "status":"403",
                    "msg":"invalid email or password"
                });
            }
            const token = jwt.sign({    
                "email":email,
                "password":result[0].password,
                "tipe":result[0].tipe
            }   ,"proyeksoa");
            res.status(200).send({
                "status":200,
                "msg":"login success",
                "token":token
            });
        })
    });
})

app.put('/user/updateUser', (req, res) => {
    email = req.body.email
    pass = req.body.password
    nama = req.body.nama_baru
    password_baru = req.body.password_baru
    pool.getConnection(function(err,conn){
        if(email != "" && pass!= ""){
            conn.query(`select * from user where email='${email}'`,function(error,result){
                if(result.length > 0){
                    if(result[0].password == pass){
                        conn.query("update user set nama = ?,password =? where email = ?",[nama,password_baru,email], (error, rows, fields) => {
                            res.status(200).send({
                                "status":"200",
                                "msg":"update success"
                            })
                        });
                    }else{
                        return res.status(403).send({
                            "status":"403",
                            "msg":"invalid username or password"
                        });
                    }
                }else{
                    return res.status(404).send({
                        "status":"404",
                        "msg":"user not found"
                    });
                }
            })
        }else{
            res.send("data harus terisi semua")
        }
    });
});

app.post('/user/subscribe', (req, res) => {
    email = req.body.email
    pass = req.body.password
    pool.getConnection(function(err,conn){
        if(email != "" && pass!= ""){
            conn.query(`select * from user where email='${email}'`,function(error,result){
                if(result.length > 0){
                    if(result[0].password == pass){
                        conn.query("update user set tipe=?",["1"], (error, rows, fields) => {
                            console.log(result)
                            bayar(result,res);
                        });
                    }else{
                        return res.status(403).send({
                            "status":"403",
                            "msg":"invalid username or password"
                        });
                    }
                }else{
                    return res.status(404).send({
                        "status":"404",
                        "msg":"user not found"
                    });
                }
            })
        }else{
            res.send("data harus terisi semua")
        }
    });
});

app.delete('/user/deleteUser', (req, res) => {
    email = req.body.email
    pass = req.body.password
    pool.getConnection(function(err,conn){
        if(email != "" && pass!= ""){
            conn.query(`select * from user where email='${email}'`,function(error,result){
                if(result.length > 0){
                    if(result[0].password == pass){
                        conn.query('delete from user where email = ?',[email], (error, rows3, fields) => {
                            res.status(200).send({
                                "status":"200",
                                "msg":"delete success"
                            })
                        });
                    }else{
                        return res.status(403).send({
                            "status":"403",
                            "msg":"invalid username or password"
                        });
                    }
                }
                else{
                    return res.status(404).send({
                        "status":"404",
                        "msg":"user not found"
                    });
                }
            })
        }else{
            res.send("data harus terisi semua")
        }
    });
});

app.post('/lokasi/insertLokasi', function(req,res){
    nama = req.body.nama_lokasi
    kota = req.body.kota_lokasi
    negara = req.body.negara_lokasi
    id_penerbangan = "L"
    pool.getConnection(function(err,conn){
        conn.query(`select * from lokasi where nama_lokasi = '${nama}'`,function(error,result){
            if(result.length < 1){
                if(result.length < 10){
                    id_penerbangan = id_penerbangan + "000" + result.length
                }else if(result.length < 100){
                    id_penerbangan = id_penerbangan + "00" + result.length
                }else if(result.length < 1000){
                    id_penerbangan = id_penerbangan + "0" + result.length
                }else{
                    id_penerbangan += result.length
                }
                conn.query("insert into lokasi values(?,?,?,?)",[id_penerbangan,nama,kota,negara], (error, rows, fields) => {
                    res.status(200).send({
                        "status":"200",
                        "msg":"insert success"
                    })
                });
            }
            else{
                res.status(200).send({
                    "status":"403",
                    "msg":"location already inserted"
                })
            }
        })
    })
})

app.get('/lokasi/searchlokasi', function(req,res){
    nama = req.body.nama;
    kota = req.body.kota;
    negara = req.body.negara;
    pool.getConnection(function(err,conn){
        conn.query(`select * from lokasi where nama_lokasi = '${nama}' or kota = '${kota}' or negara = '${negara}'`,function(error,result){
            if(result.length < 1) res.status(404).send({
                "status":"404",
                "msg":"location not found"
            });
            else{
                res.status(200).send({
                    "status":"200",
                    "msg":result
                })
            }
        })
    });
})

app.post('/list/addtolist',function(req,res){
    id_lokasi = req.body.id_lokasi
    tgl = req.body.tgl
    const token = req.header("x-auth-token");
    if(!token){
        res.status(600).send({
            "status":"600",
            "msg":"token not found"
        });
    }
    try{
        user = jwt.verify(token,"proyeksoa");
    }catch(err){
        res.status(401).send({
            "status":"401",
            "msg":"token invalid"
        });
    }
    if((new Date().getTime()/1000)-user.iat>3600){
        return res.status(602).send({
            "status":"602",
            "msg":"token expired"
        });
    }
    if(user.tipe == 0){ 
        return res.status(403).send({
            "status":"403",
            "msg":"not authorized please upgrade your account"
        })
    }else{
        pool.getConnection(function(err,conn){
            conn.query(`select * from lokasi where id_lokasi = '${id_lokasi}'`,function(error,result){
                if(result.length < 1) res.status(404).send({
                    "status":"404",
                    "msg":"location not found"
                });
                else{
                    conn.query("insert into list values(?,?,?)",[id_lokasi,tgl,user.email], (error, rows, fields) => {
                        res.status(200).send({
                            "status":"200",
                            "msg":"insert success"
                        })
                    });
                }
            })
        })
    }
})

app.delete('/list/removelist', (req, res) => {
    id_lokasi = req.body.id_lokasi
    tgl = req.body.tgl
    const token = req.header("x-auth-token");
    if(!token){
        res.status(600).send({
            "status":"600",
            "msg":"token not found"
        });
    }
    try{
        user = jwt.verify(token,"proyeksoa");
    }catch(err){
        res.status(401).send({
            "status":"401",
            "msg":"token invalid"
        });
    }
    if((new Date().getTime()/1000)-user.iat>3600){
        return res.status(602).send({
            "status":"602",
            "msg":"token expired"
        });
    }
    if(user.tipe == 0){ 
        return res.status(403).send({
            "status":"403",
            "msg":"not authorized please upgrade your account"
        })
    }else{
        pool.getConnection(function(err,conn){
            conn.query(`select * from list where id_lokasi='${id_lokasi}' and tanggal='${tgl}' and email='${user.email}'`,function(error,result){
                if(result.length > 0){
                    conn.query(`delete from list where id_lokasi='${id_lokasi}' and tanggal='${tgl}' and email='${user.email}'`, (error, rows3, fields) => {
                        res.status(200).send({
                            "status":"200",
                            "msg":"remove from list success"
                        })
                    });
                }
                else{
                    return res.status(404).send({
                        "status":"404",
                        "msg":"list not found"
                    });
                }
            })
        })
    }
});
//1
app.get("/position/getlatlod",function(req,ress){
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
            ress.status(200).send({
                "status":"200",
                "hasil":temp
            });
        } 
    })
})
//2
app.get("/weather/currentWeather",function(req,ress){
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
            ress.status(200).send({
                "status":"200",
                "msg":temp
            });
        } 
    })
})
//3
app.get("/alert/getAlertByPosition",function(req,ress){
    latitude = req.body.latitude
    Longitude = req.body.Longitude
    const token = req.header("x-auth-token");
    const options = {
        'url': `https://api.weatherbit.io/v2.0/alerts?lat=`+latitude+`&lon=`+Longitude+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    if(!token){
        ress.status(600).send({
            "status":"600",
            "msg":"token not found"
        });
    }
    try{
        user = jwt.verify(token,"proyeksoa");
    }catch(err){
        ress.status(401).send({
            "status":"401",
            "msg":"token invalid"
        });
    }
    if((new Date().getTime()/1000)-user.iat>3600){
        return ress.status(602).send({
            "status":"602",
            "msg":"token expired"
        });
    }
    if(user.tipe == 0){ 
        return ress.status(403).send({
            "status":"403",
            "msg":"not authorized please upgrade your account"
        })
    }else{
        request(options, (error, res) => {
            if (error) console.log(error);
            else{
                text = res.body.toString();
                rest = JSON.parse(text)
                var temp = {
                    "timezone":rest.timezone,
                    "city":rest.city_name,
                    "Weather alert":rest.alerts
                }
                ress.status(200).send(temp);
            } 
        })
    }
})
//4
app.get("/alert/getAlertByCity",function(req,ress){
    kota = req.body.kota
    negara = req.body.negara
    const token = req.header("x-auth-token");
    const options = {
        'url': `https://api.weatherbit.io/v2.0/alerts?city=`+kota+`&country=`+negara+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    if(!token){
        ress.status(600).send({
            "status":"600",
            "msg":"token not found"
        });
    }
    try{
        user = jwt.verify(token,"proyeksoa");
    }catch(err){
        ress.status(401).send({
            "status":"401",
            "msg":"token invalid"
        });
    }
    if((new Date().getTime()/1000)-user.iat>3600){
        return ress.status(602).send({
            "status":"602",
            "msg":"token expired"
        });
    }
    if(user.tipe == 0){ 
        return ress.status(403).send({
            "status":"403",
            "msg":"not authorized please upgrade your account"
        })
    }else{
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
                
                ress.status(200).send(temp);
            } 
        })
    }
})
//5
app.get("/quality/getAirQualityByPosition",function(req,ress){
    latitude = req.body.latitude
    Longitude = req.body.Longitude
    const token = req.header("x-auth-token");
    const options = {
        'url': `https://api.weatherbit.io/v2.0/current/airquality?lat=`+latitude+`&lon=`+Longitude+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    if(!token){
        ress.status(600).send({
            "status":"600",
            "msg":"token not found"
        });
    }
    try{
        user = jwt.verify(token,"proyeksoa");
    }catch(err){
        ress.status(401).send({
            "status":"401",
            "msg":"token invalid"
        });
    }
    if((new Date().getTime()/1000)-user.iat>3600){
        return ress.status(602).send({
            "status":"602",
            "msg":"token expired"
        });
    }
    if(user.tipe == 0){ 
        return ress.status(403).send({
            "status":"403",
            "msg":"not authorized please upgrade your account"
        })
    }else{
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
                ress.status(200).send(temp);
            } 
        })
    }
})
//6
app.get("/quality/getAirQualityByCity",function(req,ress){
    kota = req.body.kota
    negara = req.body.negara
    const token = req.header("x-auth-token");
    const options = {
        'url': `https://api.weatherbit.io/v2.0/current/airquality?city=`+kota+`&country=`+negara+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    if(!token){
        ress.status(600).send({
            "status":"600",
            "msg":"token not found"
        });
    }
    try{
        user = jwt.verify(token,"proyeksoa");
    }catch(err){
        ress.status(401).send({
            "status":"401",
            "msg":"token invalid"
        });
    }
    if((new Date().getTime()/1000)-user.iat>3600){
        return ress.status(602).send({
            "status":"602",
            "msg":"token expired"
        });
    }
    if(user.tipe == 0){ 
        return ress.status(403).send({
            "status":"403",
            "msg":"not authorized please upgrade your account"
        })
    }else{
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
                ress.status(200).send(temp);
            } 
        })
    }
})
//7
app.get("/historical/getHistoricalWeatherDailybyPosition/",function(req,ress){
    lat = req.body.latitude
    lon = req.body.longitude
    start = req.body.start
    end = req.body.end
    const token = req.header("x-auth-token");
    const options = {
        'url': `https://api.weatherbit.io/v2.0/history/daily?lat=`+lat+`&lon=`+lon+`&start_date=`+start+`&end_date=`+end+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    if(!token){
        ress.status(600).send({
            "status":"600",
            "msg":"token not found"
        });
    }
    try{
        user = jwt.verify(token,"proyeksoa");
    }catch(err){
        ress.status(401).send({
            "status":"401",
            "msg":"token invalid"
        });
    }
    if((new Date().getTime()/1000)-user.iat>3600){
        return ress.status(602).send({
            "status":"602",
            "msg":"token expired"
        });
    }
    if(user.tipe == 0){ 
        return ress.status(403).send({
            "status":"403",
            "msg":"not authorized please upgrade your account"
        })
    }else{
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
                ress.status(200).send(temp);
            } 
        })
    }
})
//8
app.get("/historical/getHistoricalWeatherDailybyCity/",function(req,ress){ 
    kota = req.body.kota
    negara = req.body.negara
    start = req.body.start
    end = req.body.end
    const token = req.header("x-auth-token");
    const options = {
        'url': `https://api.weatherbit.io/v2.0/history/daily?city=`+kota+`&country=`+negara+`&start_date=`+start+`&end_date=`+end+`&key=`+key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    if(!token){
        ress.status(600).send({
            "status":"600",
            "msg":"token not found"
        });
    }
    try{
        user = jwt.verify(token,"proyeksoa");
    }catch(err){
        ress.status(401).send({
            "status":"401",
            "msg":"token invalid"
        });
    }
    if((new Date().getTime()/1000)-user.iat>3600){
        return ress.status(602).send({
            "status":"602",
            "msg":"token expired"
        });
    }
    if(user.tipe == 0){ 
        return ress.status(403).send({
            "status":"403",
            "msg":"not authorized please upgrade your account"
        })
    }else{
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
                ress.status(200).send(temp);
            } 
        })
    }
})

function bayar(user,res){
    var d = new Date();
    var order_id = "order-" + d.getDate() + d.getMonth() + d.getFullYear()+"-"+ d.getHours() + d.getMinutes() + d.getSeconds();
    var authOptions = {
        url: 'https://api.sandbox.midtrans.com/v2/charge',
        headers: {
            'Accept' : 'application/json',
            'Content-Type' : 'application/json',
            'Authorization' : 'Basic ' + new Buffer(SERVERKEY_MIDTRANS).toString('base64')
        },
        body : {
            'payment_type' : 'bank_transfer',
            'transaction_details' : {
                'gross_amount' : 150000,
                'order_id' : order_id
            },
            'customer_details': {
                'first_name' : user[0].nama,
                'email' : user[0].email
            },
            'item_details' : {
                'price' : 150000,
                'quantity' : 1,
                'name' : 'Subscription API'
            },
            'bank_transfer' : {
                'bank' : 'bca',
                'va_number' : '12345678901',
                'free_text' : {
                    'inquiry' : [
                        {
                            'id' : 'Your Custom Text in ID language',
                            'en' : 'Your Custom Text in EN language'
                        }
                        ],
                        'payment' : [
                        {
                            'id' : 'Your Custom Text in ID language',
                            'en' : 'Your Custom Text in EN language'
                        }
                    ]
                }
            }
        },
        json: true,
    }
    request.post(authOptions, function(error, response, body) {
        if (error) {
            res.send(body)
        }else{
            if(body.status_code == 201){
                res.status(201).send({
                    "status":200,
                    "msg":"subscribe berhasil",
                    "transaction detail":body
                })
            }else{
                res.send(body)
            }
            
        }
    });
}

app.get('/', (req, res) => res.send("Hello world"))


app.listen(port, () => console.log(`Example app listening on port ${port}!`))