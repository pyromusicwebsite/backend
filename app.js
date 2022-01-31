const os = require("os"),
    dotenv = require('dotenv').config(),
    mongoose = require('mongoose'),
    express = require('express'),
    app = express(),
    chalk = require('chalk'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    cors = require('cors'),
    morgan = require('morgan');

/**
 *  Connection Setup
 */
const db_host = process.env.DB_HOST,
    environment = process.env.MODE,
    port = process.env.PORT;

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;
mongoose.connect(db_host, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);
mongoose.connection.on('error', (err) => {
    console.log("error in mongobd--->", err);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
});

/*Express configuration*/
app.set('port', port);
app.use(morgan('dev'));
app.use(cors());


app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb',
    parameterLimit: 1000000
}));

app.use(passport.initialize());
app.use(express.static('public'));

//Models
const User = require('./app/models/users');


//defining router
const userRoute = require('./app/routes/userRoute');
require('./helpers/authApi');

/* User Routes */
app.use('/user', userRoute);

const __ = require('./helpers/globalFunctions');


/* Start Express server. */
app.listen(app.get('port'), (req, res) => {
    console.log(`%s App is running at ${process.env.SERVER_BASEURL} `, chalk.green('✓'), app.get('port'), environment);
    console.log('Press CTRL-C to exit');
});