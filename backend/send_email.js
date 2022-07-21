const nodemailer= require('nodemailer');
const config=require('./config.json');

let transporter = nodemailer.createTransport({
	host: config.email_setting.host,
	port: 587,
	secure: false,
	requireTLS: true,
	auth: {
	  user: process.env.EMAIL,
	  pass: process.env.EMAIL_PASSWORD,
	},
  });

  let sendEMail= (options)=>{transporter.sendMail(options, function(error, info){             // SEnding Mail
	if (error) {
	  console.log(error);
	} else {
	  console.log('Email sent: ' + info.response);
	}
  });
};

module.exports=sendEMail;
  
