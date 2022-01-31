const nodemailer = require("nodemailer");
var hbs = require('nodemailer-express-handlebars');

var hbsOptions = {
    viewEngine: {
        extname: '.hbs', // handlebars extension
        layoutsDir: 'public/templates/', // location of handlebars templates
        defaultLayout: 'template', // name of main template
        partialsDir: 'public/templates/', // location of your subtemplates aka. header, footer etc
    },
    viewPath: 'public/templates',
    extName: '.hbs'
};

const sendMail = async (to, subject, template, options, hbsTemp) => {
    const fromEmail = process.env.SMTP_FROM
    const transport = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE,
        host: process.env.SMTP_HOST,
        secureConnection: false,
        logger: false,
        debug: true,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD
        }
    }, {
        from: fromEmail
    });

    let mailOptions = {
        to: to, // list of receivers
        subject: subject, // Subject line
        html: template // html body
    }
    if (hbsTemp) {
        hbsOptions.viewEngine.defaultLayout = template;
        transport.use('compile', hbs(hbsOptions));
        mailOptions = {
            to: to,
            subject: subject,
            template: template,
            context: options
        }
    }
    transport.sendMail(mailOptions).then(res=>{
        console.log("*************************************")
        console.log(res,"res")
        console.log("*************************************")
    }).catch(err=>{
        console.log("*************************************")
        console.log(err,"error")
        console.log("*************************************")

    })
};


const signUpEmail = (data, subject) => {

    hbsOptions.viewEngine.defaultLayout = 'welcomeEmail'

    return sendMail(data._doc.email, subject, "welcomeEmail", data, true)
};


module.exports = {
    signUpEmail
}
