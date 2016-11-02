const express   = require('express'),
      lwip      = require('lwip'),
      router    = express.Router(),
      fs        = require('fs-extra'),
      mime      = require('mime'),
      Datastore = require('nedb'),
      helper    = require('../config/helper.js'),
      crypto    = require('crypto'),
      config    = require('../config/config.json')[process.env.NODE_ENV];
db              = new Datastore({
    filename: __dirname + '/../database.db',
    autoload: true
});


/**
 * get likes by post id
 * @param _postId
 * @param cb
 */
let getLikesByPostId = (_postId, cb) => {
    db.count({
        rowType: 'like',
        postId : _postId
    }, function (err, count) {
        cb(count === null ? 0 : count)
    });
};

/**
 * check if already liked
 * @param _postId
 * @param _req
 * @param cb
 */
let hasAlreadyLiked = (_postId, _req, cb) => {
    let ip = _req.headers['x-forwarded-for'] || _req.connection.remoteAddress;

    db.count({
        rowType: 'like',
        ip     : ip,
        postId : _postId
    }, function (err, count) {
        cb(count !== null && count !== 0)
    });
};

/**
 * Start screen
 */
router.get('/', (req, res, next) => {
    db.find({rowType: 'post'}).skip(0).limit(5).sort({
        date: -1
    }).exec(function (err, docs) {

        let docsCount    = docs.length,
            forEachCount = 0;

        let prepareDocs = (cb) => {
            if (docs.length === 0) {
                cb();
            } else {
                docs.map(function (doc) {
                    getLikesByPostId(doc._id, (likes) => {
                        doc.likes = likes;

                        hasAlreadyLiked(doc._id, req, (liked) => {
                            doc.liked = liked;


                            forEachCount++;

                            if (docsCount === forEachCount) {
                                cb();
                            }
                        });
                    });
                });
            }
        };


        prepareDocs(() => {
            res.render('index', {
                images  : docs,
                nextPage: docs.length >= 5 ? 2 : 0
            });
        });
    });
});

/**
 * View page
 */
router.get('/:page', (req, res, next) => {
    let page = parseInt(req.params.page);

    if (page === 0 || page === 1 || isNaN(page)) {
        res.redirect('/')
    } else {
        db.find({rowType: 'post'}).skip((page * 5) - 5).limit(5).sort({
            date: -1
        }).exec((err, docs) => {


            let docsCount    = docs.length,
                forEachCount = 0;

            let prepareDocs = (cb) => {
                if (docs.length === 0) {
                    cb();
                } else {
                    docs.map(function (doc) {
                        getLikesByPostId(doc._id, (likes) => {
                            doc.likes = likes;

                            hasAlreadyLiked(doc._id, req, (liked) => {
                                doc.liked = liked;


                                forEachCount++;

                                if (docsCount === forEachCount) {
                                    cb();
                                }
                            });
                        });
                    });
                }
            };


            prepareDocs(() => {
                res.render('index', {
                    images     : docs,
                    currentPage: page,
                    prevPage   : page > 0 ? page - 1 : 0,
                    nextPage   : docs.length >= 5 ? page + 1 : 0
                });
            });
        });
    }
});

/**
 * Download by id
 */
router.get('/download/:id', (req, res) => {
    db.findOne({
        _id: req.params.id
    }, (err, docs) => {
        if (docs !== null) {
            let file = __dirname + '/' + config.upload_path + docs.image + '.' + docs.ext;

            if (fs.existsSync(file)) {
                res.setHeader('Content-type', 'image/jpeg');
                res.download(file);
            } else {
                res.redirect('/')
            }
        } else {
            res.redirect('/')
        }
    });
});

/**
 * Like post
 */
router.post('/like/post/:id', (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let id = req.params.id;

    db.findOne({
        _id    : id,
        rowType: 'post'
    }, (err, doc) => {
        if (doc === null) {
            res.json({
                success: false
            });
        } else {
            db.findOne({
                rowType: 'like',
                ip     : ip,
                postId : id
            }, function (err, docs) {
                if (docs === null) {
                    db.insert([{
                        rowType: 'like',
                        ip     : ip,
                        postId : id
                    }], function (err, newDocs) {
                        getLikesByPostId(id, (likes) => {
                            res.json({
                                success: true,
                                insert : true,
                                likes  : likes
                            });
                        });
                    });
                } else {
                    db.remove({
                        rowType: 'like',
                        ip     : ip,
                        postId : id
                    }, {}, function (err, newDocs) {
                        getLikesByPostId(id, (likes) => {
                            res.json({
                                success: true,
                                insert : false,
                                likes  : likes
                            });
                        });
                    });
                }
            });
        }
    });
});


/**
 * Upload - Route
 */
router.route('/upload')
    .post((req, res, next) => {

        let fstream,
            secret = req.app.settings.secret;


        if (req.busboy) {
            req.busboy.on('file', (fieldname, file, filename) => {
                let ext  = filename.split('.').pop(),
                    name = crypto.createHash('sha1').update(filename + Math.random()).digest('hex');

                if ((ext === 'jpg' || ext === 'jpeg') && secret === req.query.secret) {

                    let path = __dirname + '/' + config.upload_path + name + '.' + ext;


                    fstream = fs.createWriteStream(path);
                    file.pipe(fstream);
                    fstream.on('close', () => {
                        console.log("Upload finished of " + name);

                        lwip.open(path, function (err, image) {

                            let largeImage = helper.calculateAspectRatioFit(image.width(), image.height(), 1152, 900),
                                smallImage = helper.calculateAspectRatioFit(image.width(), image.height(), 512, 384);

                            lwip.open(path, function (err, image) {

                                image.batch()
                                    .resize(largeImage.width, largeImage.height)
                                    .writeFile(__dirname + '/' + config.upload_path + name + '-original.' + ext, {
                                        quality: 80
                                    }, function (err) {
                                        console.log("save original " + name);

                                        image.batch()
                                            .resize(largeImage.width, largeImage.height)
                                            .saturate(-1)
                                            .writeFile(path, {
                                                quality: 80
                                            }, function (err) {
                                                console.log("Compress finished of " + name);

                                                image.batch()
                                                    .resize(smallImage.width, smallImage.height)
                                                    .writeFile(__dirname + '/' + config.upload_path + name + '-c.' + ext, {
                                                        quality: 90
                                                    }, function (err) {
                                                        console.log("crop finished of " + name);


                                                        db.insert([{
                                                            rowType: 'post',
                                                            image  : name,
                                                            ext    : ext,
                                                            date   : new Date()
                                                        }], function (err, newDocs) {
                                                            console.log("Inserted " + name);
                                                            res.json({
                                                                success: true
                                                            });
                                                        });
                                                    });
                                            });
                                    });
                            });


                        });


                    });
                } else {
                    res.json({
                        success: false
                    });
                }
            });
            req.pipe(req.busboy);
        } else {
            res.json({
                success: false
            });
        }
    });


module.exports = router;
