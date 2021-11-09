require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const db = require(__dirname + '/db_connect'); // 引用 db_connect.js 的資料庫連線
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const http = require("http");
// 從python server下載圖片到AWS
const request = require('request')

// const upload = multer({dest:'tm'});
const fs = require('fs');
app.set('view engine', 'ejs'); // 設定樣版引擎
app.use(express.urlencoded({ extended: false })); // 使用 urlencoded
app.use(express.json()); // 使用 json
app.use(express.static('public')); // 使用public資料夾下的靜態資源


const api_dburl = 'http://85a3-61-231-184-148.ngrok.io/' //網址結尾要帶斜線

app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: 'secretary string',
    cookie: {
        maxAge: 1200000
    }
}));
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

app.get('/', (req, res) => {
    // res.locals.title = 'Home -' + res.locals.title;
    res.render('index');
});

app.get('/camera', (req, res) => {
    res.render('camera');
}); 
app.post('/camera',(req,res)=>{
    const output = {
        success: false,
        postData: req.body, // 丟回 client 以方便除錯
        error: '',
        code: 0,
    };

    // 接收 req 裡面的資料
    let { time, angle, address, camera } = req.body;

    if(time=='' || angle=='' || address=='' || camera==''){
        output.error = '不可為空值請輸入資料';
        return res.json(output);
    }

    if (angle<0 || angle>180) {
        output.error = '請輸入正確角度';
        return res.json(output);
    }

    // 檢查密碼和確認密碼是否一致
    if (camera<0 || camera>10 ) {
        output.error = '請輸入正確數量';
        return res.json(output);
    }
    res.json(output)
});

// login start //
app.get('/login', (req, res) => {
    res.render('login');
});
app.post('/login', async (req, res) => {
    const output = {
        success: false,
        error: '',
        postData: req.body,
    };
    if (!req.body.email || !req.body.password) {
        output.error = '欄位資料不足';
        return res.json(output);
    }

    const sql = "SELECT * FROM users WHERE account=? ";
    const [rs] = await db.query(sql, [req.body.email]);
    if (!rs.length) {
        output.error = '帳號錯誤';
        return res.json(output);
    }

    const sql1 = "SELECT * FROM users WHERE password_hash=? ";
    const [rs1] = await db.query(sql1, [req.body.password]);
    if (!rs1.length) {
        output.error = '密碼錯誤';
        return res.json(output);
    } else {
        req.session.users = {
            // user_id: rs[0].user_id,
            account: rs[0].account,
        };
        output.success = true;
    }
    res.json(output)

    // const result = await bcrypt.compare(req.body.password, rs[0].password_hash);
    // if (result) {
    //     req.session.admin = {
    //         account: rs[0].account,
    //         // nickname: rs[0].nickname,
    //     };
    //     output.success = true;
    // } else {
    //     output.error = '密碼錯誤';
    // }

    // res.json(output);
});
// login end //

//logout start //
app.get('/logout', (req, res) => {
    delete req.session.users;
    res.redirect('/');
});
// logout end //

// signup start //
app.get('/signup', (req, res) => {
    res.render('signup');
});
app.post('/signup', async (req, res) => {
    const output = {
        success: false,
        postData: req.body, // 丟回 client 以方便除錯
        error: '',
        code: 0,
    };

    // 接收 req 裡面的資料
    let { email, password, password2, tel } = req.body;

    if (password.length < 4) {
        output.error = '密碼至少超過四個字';
        return res.json(output);
    }

    // 檢查密碼和確認密碼是否一致
    if (password != password2) {
        output.error = '密碼和確認密碼欄位輸入不同!';
        return res.json(output);
    }

    // SQL 指令
    const sql = `INSERT INTO users
                 (account,
                 password_hash,
                 Tel)
                 VALUES (?,?,?);`;
    // 執行 SQL
    const [result] = await db.query(sql, [email, password, tel]);

    output.result = result;
    if (result.affectedRows) {
        output.success = true;
    }
    res.json(output); // 回傳output結果
});
// signup end //

const extMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'tm')
    },
    filename: function (req, file, cb) {
        const ext = extMap[file.mimetype];
        cb(null, uuidv4() + ext);
    }
});

var upload = multer({ storage: storage })

app.get('/upload', (req, res) => {
    res.render('upload', { sess: req.session });
});

app.post('/upload', upload.single('file'), async (req, res, next) => {
    // 接收 req 裡面的資料
    const output = {
        success: false,
        postData: req.body,   // 丟回 client 以方便除錯
        pyURL: api_dburl,
        error: '',
        code: 0,
    };

    if (req.file) {
        let newPath = `public/img/upload/${req.file.filename}`;
        fs.rename(req.file.path, newPath, (error) => {
            if (error) {
                res.json({ error });
            }
        });
    } else {
        return res.json({ error: '沒有上傳檔案' });
    }

    let imgpath = `img/upload/${req.file.filename}`;

    // current image path
    const url = 'http://' + req.headers.host + '/img/upload/' + req.file.filename;
    console.log(url);

    // SQL 指令
    const sql = `INSERT INTO before_process
                 (account,
                 imgpath,
                 shoot_time)
                 VALUES (?,?,now());`;
    // 執行 SQL
    const [result] = await db.query(sql, [req.session.users.account, imgpath]);

    var json_data = { "abnormal": false };

    // call python
    let apiurl = api_dburl + '?image=' + url;
    console.log(apiurl);

    var json;
    //====== call API ===
    http.get(apiurl,(resp) => {
        console.log('123');
        let body = "";

        resp.on("data", (chunk) => {
            body += chunk;
        });

        resp.on("end", async () => {
            try {
                
                json_data = JSON.parse(body);
                console.log(json_data);
                

                const sql1 = `INSERT INTO after_process
                        (account,
                        ap_imgpath)
                        VALUES (?,?);`;
                const [result1] = await db.query(sql1, [req.session.users.account, json_data.outputpath]);
                const result2 = []

                // 把 python server 圖片下載到 AWS
                // const download = (aaaurl, path, callback) => {
                //     request.head(aaaurl, (err, res, body) => {
                //       request(aaaurl)
                //         .pipe(fs.createWriteStream(path))
                //         .on('close', callback)
                //     })
                //   }
                  
                //   const aaaurl = api_dburl + 'public/' + json_data.outputpath;
                //   console.log(aaaurl);
                //   const path = json_data.outputpath;
                //   console.log(path);

                  
                //   download(aaaurl, path, () => {
                //     console.log('✅ Done!')
                // })

                if (json_data.abnormal) {
                                        
                    let x
                    var cropped = json_data.cropped;
                    var label_json = { 'spot': 1, 'blight': 2, 'rust': 3, 'mildew': 4 };
                    for (i = 0; i < cropped.length; i++) {
                        var cropped_json = cropped[i];
                        var label = label_json[cropped_json['label']];
                        var json = JSON.stringify(cropped_json);
                        const sql2 = `INSERT INTO result
                            (ap_imgpath,
                            did,
                            json)
                            VALUES(?,?,?);`;

                        x = await db.query(sql2, [json_data.outputpath, label, json]);
                        result2.push(label)
                    }
                    
                } else {
                    output.error = "無病徵";
                    let x
                    var label = 5;
                    var json = JSON.stringify(json_data);
                    const sql2 = `INSERT INTO result
                        (ap_imgpath,
                        did,
                        json)
                        VALUES(?,?,?);`;

                    x = await db.query(sql2, [json_data.outputpath, label, json]);
                    result2.push(label)
                    
                };

                output.result = [result];     
                if (result.affectedRows) {
                    output.success = true;
                }
                res.json(output); // 回傳output結果
                
                

            } catch (error) {
                console.error(error.message);
                // data.error = error.message;
                // data.code = 2;
                res.json({
                    code : 2,
                    error : error.message
                });

            };
            res.end();
        });

    }).on("error", (error) => {
        console.error(error.message);
    });

    // const py = spawn('python', ['model/AI_save_image.py', req.file.filename, req.file.filename]);
    // py.stdout.on('data', async (data) => {
    //     py.stdout.on('data', async (data) => {
    //     json_data = JSON.parse(data);
    //     console.log(json_data);
    //     const sql1 = `INSERT INTO after_process
    //             (account,
    //             ap_imgpath)
    //             VALUES (?,?);`;
    //     const [result1] = await db.query(sql1, [req.session.users.account, json_data.outputpath]);
    //     const result2 = []
    //     if (json_data.abnormal) {
    //         // TODO:不要動到下面這幾行
    //         // let linebot = require('linebot');

    //         // let bot = linebot({
    //         //     channelId: '1656578520',
    //         //     channelSecret: '8a2ad7428ddd940efea188931941c278t',
    //         //     channelAccessToken: 'n8ZYEFmfjQ7gJcUUxoNs3+yj3TW/JAfBKHbUaORIQtUVaDCxTJ1JXEsAeq/f+lco9YH7Kg+ynoKlqVKY6bO7nMYyFu54aKUNQPIWNLwVl0X63ud1U2GlFh/SuvetEcOCTuu1DDsX4CymZOTAuWm+LwdB04t89/1O/w1cDnyilFU='
    //         // });
            
    //         let x
    //         var cropped = json_data.cropped;
    //         var label_json = { 'spot': 1, 'blight': 2, 'rust': 3, 'mildew': 4 };
    //         for (i = 0; i < cropped.length; i++) {
    //             var cropped_json = cropped[i];
    //             var label = label_json[cropped_json['label']];
    //             var json = JSON.stringify(cropped_json);
    //             const sql2 = `INSERT INTO result
    //                 (ap_imgpath,
    //                 did,
    //                 json)
    //                 VALUES(?,?,?);`;

    //             x = await db.query(sql2, [json_data.outputpath, label, json]);
    //             result2.push(label)
    //         }
    //         // TODO:不要動到下面這幾行
    //         // var userId = 'U6181eabcd192dae0be22c764a560fd9d';
    //         // var sendMsg = "偵測到您的農場在<偵測到的X號攝影機>號攝影機的範圍可能有<偵測到的疾病>的危害, 請到您的農場查看您心愛的作物喔!";
    //         // bot.push(userId, [sendMsg]);
    //     } else {
    //         output.error = "無病徵";
    //         let x
    //         var label = 5;
    //         var json = JSON.stringify(json_data);
    //         const sql2 = `INSERT INTO result
    //             (ap_imgpath,
    //             did,
    //             json)
    //             VALUES(?,?,?);`;

    //         x = await db.query(sql2, [json_data.outputpath, label, json]);
    //         result2.push(label)
            
    //     };
    // });
  
    // py.stderr.on('data', (data) => {
    //     console.error(`stderr: ${data}`);
    // });


    // output.result = [result];     
    // if (result.affectedRows) {
    //     output.success = true;
    // }
    // res.json(output); // 回傳output結果

});

app.get('/status', async(req, res) => {
    // const sql = "SELECT * FROM after_process WHERE account=? ORDER BY sid DESC LIMIT 1";
    const sql = "SELECT after_process.account,after_process.ap_imgpath,result.did,disease.disease_name FROM after_process JOIN result ON after_process.ap_imgpath = result.ap_imgpath JOIN disease ON result.did = disease.did WHERE account=? ORDER BY sid DESC LIMIT 1";
    if(req.session.users){ 
        const [rs] = await db.query(sql, [req.session.users.account]);
        res.render('status',{rs,api_dburl});
    }else{
    res.redirect('login')}
});

app.get('/photo', async (req, res) => { 
    // const sql = " SELECT * FROM after_process WHERE account=? ORDER BY sid DESC";
    const sql = "SELECT DISTINCT after_process.sid,after_process.account,after_process.ap_imgpath,result.did,disease.disease_name FROM after_process JOIN result ON after_process.ap_imgpath = result.ap_imgpath JOIN disease ON result.did = disease.did WHERE account=? ORDER BY sid DESC";
    if(req.session.users){ 
        const [rs] = await db.query(sql, [req.session.users.account]);
        res.render('photo',{rs});
    }else{
    res.redirect('login')}
});

app.get('/photo2', async (req, res) => { 
    // const sql = " SELECT * FROM after_process WHERE account=? ORDER BY sid DESC";
    const sql = "SELECT DISTINCT after_process.sid,after_process.account,after_process.ap_imgpath,result.did,disease.disease_name FROM after_process JOIN result ON after_process.ap_imgpath = result.ap_imgpath JOIN disease ON result.did = disease.did WHERE account=? ORDER BY sid DESC";
    if(req.session.users){ 
        const [rs] = await db.query(sql, [req.session.users.account]);
        res.render('photo2',{rs});
    }else{
    res.redirect('login')}
});

app.get('/disease', (req, res) => {
    res.render('disease');
});
app.get('/Spots', (req, res) => {
    res.render('Spots');
});
app.get('/Blights', (req, res) => {
    res.render('Blights');
});
app.get('/Rusts', (req, res) => {
    res.render('Rusts');
});
app.get('/Mildew', (req, res) => {
    res.render('Mildew');
});


// 放在所有路由的後面 
app.use((req, res) => {
    res.type('text/html');
    res.status = 404;
    res.send(`
    path: ${req.url} <br> 
    <h2>404 - page not found</h2>
    `);
});
// 設定 port
app.listen(3000, () => {
    console.log('process.argv:', process.argv);
    console.log('server started!');
});