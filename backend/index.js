const express = require("express");
// import express from 'express';
// import postgresql from './postgresql.js';
// import qrcode  from 'qrcode';
// import nodemailer from 'nodemailer';
// import bodyParser from 'body-parser';
// import openssl from 'openssl-nodejs';
// import config from './config.json' assert { type: 'json' };
const bodyParser= require('body-parser');
const nodemailer= require('nodemailer');
const QRCode= require('qrcode');
const postgresql=require('./postgresql.js');
const config=require('./config.json');
const crypto = require('crypto');
const fs = require('fs');
const {stringify} = require('csv-stringify');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fastcsv= require('fast-csv');
const Vonage = require('@vonage/server-sdk')

const vonage = new Vonage({
  apiKey: "c264a6ec",
  apiSecret: "O8JEN8Rm6CQOn5UR"
})

const PORT = process.env.PORT || 3001;
const accountSid = config.twilio.accountSid;
const authToken = config.twilio.authToken;
const client = require('twilio')(accountSid, authToken);

// const { Client } = require('pg');

// const QRCode=qrcode;






//___________________________________ Nodemailer ________________________________________________

let transporter = nodemailer.createTransport({
	host: config.email_setting.host,
	port: 587,
	secure: true,
	requireTLS: true,
	auth: {
	  user: config.email_setting.email,
	  pass: config.email_setting.password,
	},
  });
  

//___________________________________ Connection to database ________________________________________________
postgresql(async (connection) => {

  });


const app = express();
const path = require('path');
// const router = express.Router();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public",express.static(__dirname+'/public'));



app.get('/',function(req,res){
	const checked_in= new Date();
	const checkin_date= checked_in.toLocaleDateString();
	const checkin_time= checked_in.toLocaleTimeString();
	console.log(checkin_date);
	console.log(checkin_time);
	res.send("hey")
  });

app.get("/api", (req, res) => {
	res.json({ message: "Hello from server!" });
  });

//___________________________________ HOSTS ________________________________________________


//___________________________________ Send hosts ________________________________________________



  app.get('/api/hosts', async (req, res) => {
	const rows = await process.postgresql.query('SELECT * FROM hosts');
	res.json(rows);
  });


  //___________________________________ Sending single host ________________________________________________
  app.get('/api/hosts/:id', async (req, res) => {
	const pk=req.params['id'];
	const rows = await process.postgresql.query('SELECT * FROM hosts WHERE id=$1', [pk]);
	res.json(rows);
  });

   //___________________________________ login host ________________________________________________
 app.post('/api/login/host', async(req,res)=>{
	const user={
		email: req.body.email,
		pass: req.body.password
	}
	  const host=await process.postgresql.query(`SELECT * 
	  FROM hosts
	 WHERE email = '${user.email}' 
	   AND password = '${user.pass}'`).then((err,result) => {
				if (err) throw err;
			});
			 res.json(host)
	});


//___________________________________ regitering a host ________________________________________________
app.post('/api/hosts', async (req, res) => {
    const pass=crypto.randomBytes(8).toString('hex');
	const host = {
		name: req.body.name,
		email_id: req.body.email_id,
		mobile_no: req.body.mobile_no,
		password: pass
	}
	 await process.postgresql.query(`INSERT INTO hosts (name, email_id, mobile_no,password) VALUES ('${host.name}', '${host.email_id}', '${host.mobile_no}','${host.password}') ON CONFLICT DO NOTHING;`).then((err,result) => {
		if (err) throw err;
	});

	let MobileBody = "Your login information : ";
	MobileBody +=" Email : " + host.email_id + " " +
	"Password :" + host.password;

	client.messages
  .create({
     body: MobileBody,
     from: config.twilio.from_number,
     to: host.mobile_no
   })
  .then(message => console.log(message.sid));
	 res.status(200).send('Host registered!');

	
  });

  //___________________________________ editing a host ________________________________________________
app.post('/api/hosts/:id', async (req, res) => {
	const pk=req.params['id'];
	const host = {
		name: req.body.name,
		email_id: req.body.email_id,
		mobile_no: req.body.mobile_no
	}
	 await process.postgresql.query('UPDATE "hosts" SET "name" = $1, "email_id" = $2, "mobile_no" = $3 WHERE id=$4', [host.name,host.email_id,host.mobile_no,pk]).then((err,result) => {
		if (err) throw err;
	});
	 res.status(200).send('Host registered!');

	
  });
   //___________________________________ Deleting a single host ________________________________________________
 app.delete('/api/visitors/:id', async (req, res) => {
	const pk=req.params['id'];
	await process.postgresql.query('DELETE FROM "hosts" WHERE "id" = $1', [pk]);
	res.send('Host deleted');
  });




 //___________________________________ VISITORS ________________________________________________

  //___________________________________ sending visitors ________________________________________________
  app.get('/visitors', async (req, res) => {
	const rows = await process.postgresql.query('SELECT * FROM visitors');
	res.status(200).send(JSON.stringify(rows));
  });

  app.get('/api/visitors', async (req, res) => {
	const rows = await process.postgresql.query('SELECT * FROM visitors');
	res.json(rows);

	
  });
  
//___________________________________ regitering a visitor ________________________________________________
app.post('/api/visitors', async (req, res) => {
	const visitor = {
		name: req.body.name,
		email_id: req.body.email_id,
		mobile_no: req.body.mobile_no
	}
	 await process.postgresql.query(`INSERT INTO visitors (name, email_id, mobile_no) VALUES ('${visitor.name}', '${visitor.email_id}', '${visitor.mobile_no}') ON CONFLICT DO NOTHING;`).then((err,result) => {
		if (err) throw err;
	});
	 res.status(200).send('Visitor registered!');

	
  });

    //___________________________________ editing a visitor ________________________________________________
	app.put('/api/visitors/:id', async (req, res) => {
		const pk=req.params['id'];
		const visitor = {
			name: req.body.name,
			email_id: req.body.email_id,
			mobile_no: req.body.mobile_no
		}
		await process.postgresql.query('UPDATE "visitors" SET "name" = $1, "email_id" = $2,"mobile_no" = $3 WHERE id=$4', [visitor.name,visitor.email_id,visitor.mobile_no,pk]).then((err,result) => {
			if (err) throw err;
		});
		res.status(200).send('Visitor Updated!');
	  });
	 
	  //___________________________________ Sending a single visitor ________________________________________________
	  app.get('/api/visitors/:id', async (req, res) => {
		const pk=req.params['id'];
		const rows = await process.postgresql.query('SELECT * FROM visitors WHERE id=$1', [pk]);
		res.json(rows);
	  });
	
	   //___________________________________ Deleting a single visitor ________________________________________________
 app.delete('/api/visitors/:id', async (req, res) => {
	const pk=req.params['id'];
	await process.postgresql.query('DELETE FROM "visitors" WHERE "id" = $1', [pk]);
	res.send('Visitor deleted');
  });

   //___________________________________VISITS ________________________________________________

  //___________________________________ sending visits ________________________________________________
  app.get('/api/visits', async (req, res) => {
	const rows = await process.postgresql.query('SELECT * FROM register');
	console.log(rows);
	rows.map(row =>{

		const dat=row.checked_in.toUTCString();
		const time= row.checked_in.toLocaleTimeString();
		console.log(dat);
		console.log(time);
		const dattime=dat+'T'+time;
		console.log(dattime);

	})
	res.status(200).json(rows);
  });

    //___________________________________ sending visits by date ________________________________________________
	app.get('/api/visits/:date', async (req, res) => {
		const date=req.params['date'];
		const rows = await process.postgresql.query('SELECT * FROM register WHERE date=$1', [date]);
	
		res.status(200).json(rows);
	  });

//___________________________________ registering a visit ________________________________________________
app.post('/api/visits', async (req, res) => {
	const checked_in= new Date();
	const checkin_date= checked_in.toLocaleDateString();
	const checkin_time= checked_in.toLocaleTimeString();
	// console.log(checkin_date);
	// console.log(checkin_time);
	const visit = {
		host_id: req.body.host_id,
		host_name: req.body.host_name,
		visitor_name: req.body.visitor_name,
		visitor_email: req.body.email,
		visitor_no: req.body.visitor_no,
		date:checkin_date,
		checked_in: checkin_time,
		role: req.body.role
		
	};

	const visitor = await process.postgresql.query('SELECT * FROM visitors WHERE name=$1 AND email=$2' , [visit.visitor_name, visit.visitor_email],); 
	if(!visitor){
		await process.postgresql.query(`INSERT INTO visitors (name, email_id, mobile_no) VALUES ('${visit.visitor_name}', '${visit.visitor_email}', '${visit.visitor_no}') ON CONFLICT DO NOTHING;`).then((err,result) => {
			if (err) throw err;
		});
	}
	await process.postgresql.query(`INSERT INTO register (host_id,host_name,visitor_name, visitor_email, visitor_no,date,checked_in role) VALUES ('${visit.host_id}', '${visit.host_name}','${visit.visitor_name}','${visit.visitor_email}','${visit.visitor_no}','${visit.date}','${visit.checked_in}', '${visit.role}') ON CONFLICT DO NOTHING;`).then((err,result) => {
		if (err) throw err;
	});
	const host=  await process.postgresql.query('SELECT * FROM hosts WHERE id=$1' , [visit.host_id],); 
	// let htmlBody = "New visitor information : \n";                     // Preparing Msg for sending Mail to the expected visitor of the Meeting 
    //     htmlBody +=  htmlBody += "Name : " + visit.visitor_name + " \n " + "\n" + 
    //     " Email : " + visit.visitor_email + " \n " + "\n" +
    //     "Mobile Number : " +visit.visitor_no + " \n " + "\n" +
    //     " Check In Date Time :" +visit.checked_in;
      
        
    //     var mailOptions =                                                   // Step 2 - Setting Mail Options of Nodemailer
    //     {
    //       from: "bellaxbx1109@gmail.com",
    //       to: host.email,
    //       subject: "New guest for you has arrived.",
    //       html: htmlBody,
    //     };

	// 	transporter.sendMail(mailOptions, function(error, info){             // SEnding Mail
	// 		if (error) {
	// 		  console.log(error);
	// 		} else {
	// 		  console.log('Email sent: ' + info.response);
	// 		}
	// 	  });

// 	client.messages
// 	.create({
// 	   body: htmlBody,
// 	   from: config.twilio.from_number,
// 	   to: host.mobile_no
// 	 })
// 	.then((err,message) =>{
// 	if(err){
// console.log(err);}

// 	else{ console.log(message.sid)};


const from = "250787380054";
const to =`250${host.mobile_no}`;
const text =` A new  guest has arrived
Name: ${visit.visitor_name} 
   Number: ${visit.visitor_no}
   email: ${visit.visitor_email}`;

vonage.message.sendSms(from, to, text, (err, responseData) => {
    if (err) {
        console.log(err);
    } else {
        if(responseData.messages[0]['status'] === "0") {
            console.log("Message sent successfully.");
        } else {
            console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
        }
    }
});





// })
	 res.status(200).send('Visit registered!');

	 

	
  });

//___________________________________ Editing a visit ________________________________________________
app.put('/api/registers/:id', async (req, res) => {
	const pk=req.params['id'];
	const visit = {
		host_id: req.body.host_id,
		host_name: req.body.host_name,
		visitor_name: req.body.visitor_name,
		visitor_email: req.body.email,
		visitor_no: req.body.visitor_no,
		date: req.body.date,
		checked_in: req.body.checked_in,
		checked_out: req.body.checked_out,
		role: req.body.role
		
	}
	await process.postgresql.query('UPDATE "register" SET "host_id" = $1, "host_name" = $2, "visitor_name" = $3, "visitor_email" = $4, "visitor_no" = $5,"date" = $10, "checked_in"= $6, "checked_out"=$7, "role"=$8  WHERE id=$9', [visit.host_id,visit.host_name,visit.visitor_name, visit.visitor_email,visit.visitor_no, visit.checked_in, visit.checked_out,visit.role,pk,visit.date]).then((err,result) => {
		if (err) throw err;
	});
	 res.status(200).send('Visit Edited!');

	
  });

  //___________________________________ Editing a visit checkout ________________________________________________
app.put('/api/registers/checkout/:id', async (req, res) => {
	const pk=req.params['id'];
	const checkout= new Date();
	const checkout_time= checkout.toLocaleTimeString();
	const visit = {
		checked_out: checkout_time,
	}
	await process.postgresql.query('UPDATE "register" SET "checked_out"=$1  WHERE id=$2', [visit.checked_out,pk]).then((err,result) => {
		if (err) throw err;
	});
	 res.status(200).send('Checkout time Edited!');

	
  });

     //___________________________________ Sending a single visit ________________________________________________
	 app.get('/api/registers/:id', async (req, res) => {
		const pk=req.params['id'];
		const rows = await process.postgresql.query('SELECT * FROM register WHERE id=$1', [pk]);
		res.json(rows);
	  });
	
		 //___________________________________ Sending a visit ________________________________________________
		 app.post('/api/registers/:date/:time', async (req, res) => {
			const date=req.params['date'];
			const time= req.params['time'];
	
			const rows = await process.postgresql.query('SELECT * FROM register WHERE id=$1', [pk]);
			res.json(rows);
		  });
	
	
	
	  
	   //___________________________________ Deleting a single visit ________________________________________________
	 app.delete('/api/registers/:id', async (req, res) => {
		const pk=req.params['id'];
		await process.postgresql.query('DELETE FROM "register" WHERE "id" = $1', [pk]);
		res.send('Record deleted');
	  });



//___________________________________ USER/ ADMIN ________________________________________________

  //___________________________________ register user ________________________________________________
app.post('/api/registeruser', async(req,res)=>{
const user={
	email: req.body.email,
	pass: req.body.password
}
  await process.postgresql.query(`INSERT INTO users (email, password) VALUES (
	'${user.email}',
	crypt('${user.pass}', gen_salt('bf'))
  );`).then((err,result) => {
			if (err) throw err;
		});
		 res.status(200).send('User registered!')
});

 //___________________________________ login user ________________________________________________
 app.post('/api/login/admin', async(req,res)=>{
	const user={
		email: req.body.email,
		pass: req.body.password
	}
	  const newuser=await process.postgresql.query(`SELECT * 
	  FROM users
	 WHERE email = '${user.email}' 
	   AND password = crypt('${user.pass}', password);`).then((err,result) => {
				if (err) throw err;
			});
			 res.json(newuser)
	});


//   app.post('/api/visitors', async (req, res) => {
// 	const { name, email_id, checked_in,mobile_no } = req.body;
// 	const visitor = {
// 		name: name,
// 		email_id: email_id,
// 		checked_in: checked_in,
// 		mobile_no: mobile_no
// 	}
// 	 await process.postgresql.query(`INSERT INTO visitors (name, email_id,checked_in, mobile_no) VALUES ('${visitor.name}', '${visitor.email_id}', '${visitor.checked_in}', '${visitor.mobile_no}') ON CONFLICT DO NOTHING;`).then((err,result) => {
// 		if (err) throw err;
// 	});
// 	 res.status(200).send('Visitor registered!');

	
//   });

  


//___________________________________ QRCODE ________________________________________________


//___________________________________ generating qrcode ________________________________________________
  app.get('/qrgenerate', async(req,res) => {
	// openssl('openssl req -config csr.cnf -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout key.key -out certificate.crt');
	// const visitor = {
	// 	name: req.body.name,
	// 	email_id: req.body.email_id,
	// 	check_in: req.body.check_in,
	// 	mobile_no: req.body.mobile_no
	// }
	const visitor = {
		name: 'Anny',
		email_id: 'annylex@gmail.com',
		check_in: '2022-06-25T15:00',
		mobile_no: '787695111'
	}

	let stringdata = JSON.stringify(visitor)

	QRCode.toString(stringdata,{type:'terminal'},
                    function (err, QRcode) {
 
    if(err) return console.log("error occurred")
 
    // Printing the generated code
    console.log(QRcode)
})
   
// Converting the data into base64
QRCode.toDataURL(stringdata, function (err, code) {
    if(err) return console.log("error occurred")

	// let htmlBody = "New visitor information : \n";                     // Preparing Msg for sending Mail to the expected visitor of the Meeting 
    //     htmlBody += code;
      
        
        // var mailOptions =                                                   // Step 2 - Setting Mail Options of Nodemailer
        // {
        //   from: "bellaxbx1109@gmail.com",
        //   to: visitor.email_id,
        //   subject: "Qr Code.",
        //   html: htmlBody,
        // };

		// transporter.sendMail(mailOptions, function(error, info){             // SEnding Mail
		// 	if (error) {
		// 	  console.log(error);
		// 	} else {
		// 	  console.log('Email sent: ' + info.response);
		// 	}
		//   });

	// 	let MobileBody = "New guest : ";
	// 	MobileBody +=`Name: ${visitor.name} 
	// 	   Number: ${visitor.mobile_no}
	// 	   email: ${visitor.email_id}`;
	// 	;
	
	// 	client.messages
	//   .create({
	// 	 body: MobileBody,
	// 	 from: config.twilio.from_number,
	// 	 to: visitor.mobile_no
	//    })
	//   .then(message => console.log(message.sid));
		

// 		const from = "250787380054";
// const to = `250${visitor.mobile_no}`;
// const text =`Name: ${visitor.name} 
//    Number: ${visitor.mobile_no}
//    email: ${visitor.email_id}`;

// vonage.message.sendSms(from, to, text, (err, responseData) => {
//     if (err) {
//         console.log(err);
//     } else {
//         if(responseData.messages[0]['status'] === "0") {
//             console.log("Message sent successfully.");
//         } else {
//             console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
//         }
//     }
// });
    // Printing the code
    // console.log(`250${visitor.mobile_no}`)
	res.send(code)

	
})


  });

 




//   app.get("/", (req, res) => {
// 	res.sendFile('../views/index.html')
//   });

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});