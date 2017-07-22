var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));


let dburl = 'mongodb://mareddit:123123@ds115573.mlab.com:15573/mareddit'
mongoose.connect(dburl, {
    useMongoClient: true
})

let Articles = mongoose.model('articles', {
    content: String,
    title: String,
    author_id: String,
    author: String
})

let Users = mongoose.model('users', {
    username: String,
    password_hash: String,
    email: String,
})

app.get('/', function(req, res) {
    res.status(200).send('MAIN PAGE')
});


function auth(req, res, next) {

    if (req.header.token != undefined) {
        jwt.verify(req.header.token, 'secret', function(err, result) {
            if (err) throw err;
            if (result) {
            	req.body.email = result._doc.email
            	req.body.author_id = result._doc.author_id,
            	req.body.author = result._doc.author
                next()
            } else {
                res.status(401).send({
                    message: 'your are not authorized to do this operation'
                })
            }
        })
    } else {
        res.status(300).send('token is undefined')
    }
}


// authintication
app.post('/api/login', (req, res) => {
    let {
        email,
        password
    } = req.body;

    if ((email && password) === undefined) {
        res.status(400).send('some credintails not exists')
    } else {
        Users.findOne({
            email: email
        }, (err, result) => {
            if (err) throw err;

            let author_id = result.id;
            let author = result.author;


            bcrypt.compare(password, result.password_hash, function(err, result) {

                if (result) {
                    jwt.sign({
                        email: email,
                        id: author_id,
                        author: author
                    }, 'this is my secret, so keep it as it is', (err, token) => {
                        res.status(200).send({
                            token: token,
                            errorCode: 3232,
                            msg: 'logged in successfuly'

                        })
                    })
                } else {
                    res.status(200).send({
                        errorCode: 32342,
                        msg: 'incorrect password and email'
                    })
                }


            });



        })
    }

})
app.post('/api/signup', (req, res) => {

    let email = req.body.email
    let username = req.body.username
    let password = req.body.password

    if ((email && username && password) === undefined) {
        res.status(400).send({
            message: 'some credentials not exists'
        })
    } else {


        // TODO: ADD MORE VALIDATION TO USERNSME AND PASSWORD
        if (validator.validate(email) === true) {

            Users.findOne({
                email: email
            }, function(err, result) {
                if (err) throw err;
                if (result) {
                    res.status(200).send({
                        result: result,
                        errorCode: 0,
                        msg: 'user does exist'
                    })
                } else {


                    bcrypt.hash(password, 10, function(err, hash) {
                        if (err) throw err;


                        let user = new Users({
                            username: username,
                            password: hash,
                            email: email
                        })

                        user.save(function(err, result) {
                            if (err) {
                                console.log(err)
                                res.send(err)
                            };
                            if (result) {
                                res.send({
                                    msg: 'new user has been created',
                                    errorCode: 1
                                })
                            }
                        })


                    });





                }

            })


        } else {
            res.send('something bad happend')
        }

    }

})


// Articles CRUD
app.get('/api/articles', auth, (req, res) => {
    Articles.find({}, (err, result) => {
        if (err) throw err;
        res.status(200).json(result)
    })
})


app.post('/api/articles', auth, (req, res) => {
    
    let article = new Articles({
        content: req.body.content,
        title: req.body.title,
        author_id: req.body.author_id,
        author: req.body.author
    })

    article.save((err, result) => {
        if (err) throw err;
        res.status(200).json(result)
    })
})





io.on('connection', function(socket) {
    socket.emit('news', {
        hello: 'world'
    });
    socket.on('my other event', function(data) {
        console.log(data);
    });
});


server.listen(80);