const express      = require('express'),
      path         = require('path'),
      favicon      = require('serve-favicon'),
      logger       = require('morgan'),
      cookieParser = require('cookie-parser'),
      bodyParser   = require('body-parser'),
      busboy       = require('connect-busboy'),
      compression = require('compression'),
      routes       = require('./routes/index'),
      helmet       = require('helmet'),
      hbs          = require('hbs'),
      config       = require('./config/config.json')[process.env.NODE_ENV];


hbs.registerHelper('dateFormat', require('handlebars-dateformat'));


let app = express()
app.use(busboy());
app.use(compression());

// helmet
app.use(helmet())
app.use(helmet.noCache())
app.use(helmet.frameguard())
app.use(helmet.xssFilter())
app.use(helmet.hidePoweredBy())
app.disable('x-powered-by')
app.use(helmet.ieNoOpen())
app.use(helmet.noSniff())
app.use(helmet.dnsPrefetchControl())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// set secret
app.set('secret', config.secret);

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  limit: '50mb',
  parameterLimit: 1000000,
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', routes);


// catch 404 and forward to error handler
app.use((req, res, next) => {
    let err    = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error  : err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error  : {}
    });
});


module.exports = app;
