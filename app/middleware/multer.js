const multer = require('multer');
const path = require('path');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const { uuid } = require('uuidv4');

aws.config.update({
    secretAccessKey: process.env.AWS_SECRET_KEY, // ,
    accessKeyId: process.env.AWS_ACCESS_KEY, // process.env.ACCESS_KEY,
    region: process.env.AWS_REGION, // process.env.REGION
})

let storage = multer.diskStorage({ // local Storage
    destination: (req, file, cb) => {
        cb(null, './public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

if (process.env.AWS_SECRET_KEY) {
    console.log("ProductionS3");
    const s3 = new aws.S3()
    storage = multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            let fieldname = file.fieldname.split(/\[(.*?)\]/)
                .filter((item) => item ? item : null)[0]
            let folder = "uploads";
            switch (true) {
                case /^(userprofile|profilePicture|personalDetails)$/.test(fieldname):
                    folder = "profile";
                    break;
                case /^(license|pcc|insurance|ownership|driverDocuments|driverDocument)$/.test(fieldname):
                    folder = "documents";
                    break;
                default:
                    folder = "uploads";
                    break;
            }
            cb(null, `${folder}/${uuid().split('-').join('') + path.extname(file.originalname)}`);
        },

    })
}

const filter = (req, res, file, cb) => {
    const formats = ['.png', '.jpg', '.jpeg', '.svg', '.pdf', '.docx', '.doc', '.pptx']
    console.log(formats.includes(path.extname(file.originalname).toLowerCase())), "formats";
    if (formats.includes(path.extname(file.originalname).toLowerCase())) {
        cb(null, true);
    } else {
        cb(null, false);
        if (!req.files.errors) {
            req.files.errors = [];
        }
        req.files.errors.push({
            file,
            reason: "Invalid file type."
        });
    }
};

function validateFile(req, res, next) {
    req.files = {}
    return new Promise((resolve, reject) => {
        multer({
            storage: storage,
            fileFilter: (req, file, cb) => filter(req, res, file, cb),
            limits: { fileSize: 10000000 },
        }).any()(req, res, (err) => {
            if (err && err.message) {
                err.status = 400;
                reject(next(err));
            }
            else {
                let files = req.files;
                if (files && (files.length || typeof files === 'object')) {
                    let details = [];
                    if (files.errors) {
                        req.files.errors.forEach((error) => {
                            let file = error.file;
                            details.push({
                                path: [file.fieldname],
                                message: error.reason
                            })
                        });

                        const data = details.reduce((prev, curr) => {
                            prev[curr.path[0]] = curr.message.replace(/"/g, "");
                            return prev;
                        }, {});
                        let msg = Object.values(data).length ? Object.values(data).join(', ') : "bad request";
                        let err = new Error(msg)
                        err.status = 400
                        reject(err);
                    }

                    if (Array.isArray(files)) {
                        files.forEach((file) => {
                            let holder = req.body;
                            let filePath = file.fieldname.split(/\[(.*?)\]/)
                                .filter((item) => item ? item : null);
                            filePath.forEach((item, index) => {
                                if (index + 1 === filePath.length) {
                                    if (process.env.AWS_SECRET_KEY) holder[item] = file.location
                                    else holder[item] = `${process.env.PUBLIC_PATH}${file.destination.replace('.', '')}${file.filename}`;
                                } else {
                                    if (!holder[item]) {
                                        holder[item] = {};
                                    }
                                    holder = holder[item];
                                }
                            });
                        });
                    }
                    resolve(true);
                }
            }
        });
    })

}


module.exports = {
    validateFile: validateFile
};