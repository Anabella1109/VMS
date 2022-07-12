const express = require("express");
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
const PDFDocument = require("pdfkit-table");
const cors = require('cors')
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const { DateTime } = require("luxon");    
const cron = require('node-cron');
const multer = require('multer');

const vonage = new Vonage({
  apiKey: process.env.API_KEY,
  apiSecret:process.env.API_SECRET
})

const PORT = process.env.PORT || 3001;
const accountSid = config.twilio.accountSid;
const authToken = config.twilio.authToken;
// const client = require('twilio')(accountSid, authToken);


// const { Client } = require('pg');

// const QRCode=qrcode;

const oneDay = 1000 * 60 * 60 * 24;




//___________________________________ Nodemailer ________________________________________________

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
  


const app = express();
const path = require('path');
const corsOptions ={
    origin:'https://amalitech-visitors-system.netlify.app', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
// const router = express.Router();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public",express.static(__dirname+'/public'));
app.use(cors());
app.use(sessions({
    secret: process.env.SECRET,
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));
app.use(cookieParser());



let session;



// app.get('/',function(req,res){
	// const checked_in= new Date();
	// const checkin_date= checked_in.toLocaleDateString();
	// const checkin_time= checked_in.toLocaleTimeString();
	// console.log(checkin_date);
	// console.log(checkin_time);
	// res.send('hey')
//   });
//___________________________________ Connection to database ________________________________________________
postgresql(async (connection) => {
	
 });

// const client = new Client({
//     user: process.env.DATABASE_USER,
//     database: process.env.DATABASE ,
//     password:process.env.DATABASE_PASSWORD,
//     host:process.env.DATABASE_HOST,
//     port:  5432,
//     ssl: {
//       rejectUnauthorized: false
// 	}
// });
//  const execute = async (query) => {
//     try {
//         await client.connect();     // gets connection
//         await client.query(query);  // sends queries
//         return true;
//     } catch (error) {
//         console.error(error.stack);
//         return false;
//     } finally {
//         await client.end();         // closes connection
//     }
// };

app.get("/", (req, res) => {
	const date= "2022-07-10";
	const time= "19:00";
	const combined=  date+'T'+time;
	const dateAndTime= new DateTime(combined);
	console.log(dateAndTime.weekday);
	console.log(dateAndTime.year);
	console.log(dateAndTime);
	console.log(dateAndTime);
	res.sendFile(__dirname+'/index.html');
  });


//___________________________________ HOSTS ________________________________________________


//___________________________________ Send hosts ________________________________________________



  app.get('/api/hosts', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	try {
		const rows= await process.postgresql.query('SELECT * FROM hosts;');
	res.json(rows);
	} catch (error) {
		console.error(error);
	}
	
  });


  //___________________________________ Sending single host ________________________________________________
  app.get('/api/hosts/:id', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	res.setHeader( "Access-Control-Allow-Origin", "*" );

	const pk=req.params['id'];
	try {
		const rows = await process.postgresql.query('SELECT * FROM hosts WHERE id=$1', [pk]);
	res.json(rows);
	} catch (error) {
		console.error(error);
	}
	
  });

   //___________________________________ login host ________________________________________________
 app.post('/api/login/host', async(req,res)=>{
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const user={
		email: req.body.email,
		pass: req.body.password
	}
	try{
	  const host=await process.postgresql.query(`SELECT * 
	  FROM hosts
	 WHERE email = '${user.email}' 
	   AND password = '${user.pass}';`);
			 res.json(host)
	}
	catch(error){
    console.error(error);
	}
	});


//___________________________________ registering a host ________________________________________________
app.post('/api/hosts', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
    const pass=crypto.randomBytes(8).toString('hex');
	const host = {
		name: req.body.name,
		email_id: req.body.email_id,
		mobile_no: req.body.mobile_no,
		department: req.body.department,
		password: pass
	}
	try{
	 await process.postgresql.query(`INSERT INTO hosts (name, email_id, mobile_no,department,password) VALUES ('${host.name}', '${host.email_id}', '${host.mobile_no}','${host.department}','${host.password}') ON CONFLICT DO NOTHING;`)

	let htmlBody = "Your new login information : \n";                     // Preparing Msg for sending Mail to the expected visitor of the Meeting 
		htmlBody += "Email : " + host.email_id + " \n " + "\n" + 
		" password : " +host.password ;
	  
		
		var mailOptions =                                                   // Step 2 - Setting Mail Options of Nodemailer
		{
		  from: process.env.EMAIL,
		  to: host.email_id,
		  subject: "Login information.",
		  html: htmlBody,
		};
	
		transporter.sendMail(mailOptions, function(error, info){             // SEnding Mail
			if (error) {
			  console.log(error);
			} else {
			  console.log('Email sent: ' + info.response);
			}
		  });
	
	
	const from = "250787380054";
	const to =`25${host.mobile_no}`;
	const text =` Your new login information
	   Email: ${host.email_id} 
	   Password: ${host.password}
	  `;
	
	// vonage.message.sendSms(from, to, text, (err, responseData) => {
	// 	if (err) {
	// 		console.log(err);
	// 	} else {
	// 		if(responseData.messages[0]['status'] === "0") {
	// 			console.log("Message sent successfully.");
	// 		} else {
	// 			console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
	// 		}
	// 	}
	// });
	 res.status(201).json('Host registered!');

}
catch(error){
	console.error(error);
}
  });

  //___________________________________ editing a host ________________________________________________
app.put('/api/hosts/:id', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const pk=req.params['id'];
	const host = {
		name: req.body.name,
		email_id: req.body.email_id,
		mobile_no: req.body.mobile_no
	}
	try{
	 await process.postgresql.query('UPDATE "hosts" SET "name" = $1, "email_id" = $2, "mobile_no" = $3 WHERE id=$4', [host.name,host.email_id,host.mobile_no,pk])
		res.status(200).send(JSON.stringify('Host edited!'));
	}
	catch(error){
		console.error(error);
	}	
	
  });

  //___________________________________ editing a host password ________________________________________________
  app.patch('/api/hosts/:id', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const pk=req.params['id'];
	const host = {
		password:req.body.password
	}
	try{
	 await process.postgresql.query('UPDATE "hosts" SET "password" = $1 WHERE id=$2', [host.passsword,pk])
	 res.status(200).send(JSON.stringify('Password changed'));
	}
	catch(error){
		console.error(error);
	}
	
  });
   //___________________________________ Deleting a single host ________________________________________________
 app.delete('/api/hosts/:id', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const pk=req.params['id'];
	try {
		await process.postgresql.query('DELETE FROM "hosts" WHERE "id" = $1', [pk]);
	res.json('Host deleted');
	} catch (error) {
		console.error(error);
	}
	
  });




 //___________________________________ VISITORS ________________________________________________

  //___________________________________ sending visitors ________________________________________________
  app.get('/api/visitors', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const rows = await process.postgresql.query('SELECT * FROM visitors');
	res.json(rows);

	
  });
  
//___________________________________ regitering a visitor ________________________________________________
app.post('/api/visitors', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const visitor = {
		name: req.body.name,
		email_id: req.body.email_id,
		mobile_no: req.body.mobile_no
	}
	try{
	 await process.postgresql.query(`INSERT INTO visitors (name, email_id, mobile_no) VALUES ('${visitor.name}', '${visitor.email_id}', '${visitor.mobile_no}') ON CONFLICT DO NOTHING;`)
	 res.status(200).send(JSON.stringify('Visitor registered!'));
	}
	 catch(error){
		console.error(error);}
	//   res.status(200).send(JSON.stringify('Visitor registered!'));

	
  });

    //___________________________________ editing a visitor ________________________________________________
	app.put('/api/visitors/:id', async (req, res) => {
		res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
		const pk=req.params['id'];
		const visitor = {
			name: req.body.name,
			email_id: req.body.email_id,
			mobile_no: req.body.mobile_no
		}
		try{
		await process.postgresql.query('UPDATE "visitors" SET "name" = $1, "email_id" = $2,"mobile_no" = $3 WHERE id=$4', [visitor.name,visitor.email_id,visitor.mobile_no,pk]);
		res.status(200).send(JSON.stringify('Visitor updated!'));
		}
		catch(error){
			console.error(error);}
		
	  });
	 
	  //___________________________________ Sending a single visitor ________________________________________________
	  app.get('/api/visitors/:id', async (req, res) => {
		res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
		const pk=req.params['id'];
		try {
			const rows = await process.postgresql.query('SELECT * FROM visitors WHERE id=$1', [pk]);
		res.json(rows);
		} catch (error) {
			console.error(error);
		}
		
	  });
	
	   //___________________________________ Deleting a single visitor _____________________________________________
 app.delete('/api/visitors/:id', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const pk=req.params['id'];
	try {
		await process.postgresql.query('DELETE FROM "visitors" WHERE "id" = $1', [pk]);
	res.json('Visitor deleted');
	} catch (error) {
		console.error(error);
	}
	
  });

   //___________________________________VISITS ________________________________________________

  //___________________________________ sending visits ________________________________________________
  app.get('/api/visits', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const rows = await process.postgresql.query('SELECT * FROM register');
	res.status(200).json(rows);
  });

    //___________________________________ sending visits by date ________________________________________________
	app.get('/api/date/visits', async (req, res) => {
		res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
		const date=req.query.date;
		try{
		const rows = await process.postgresql.query('SELECT * FROM register WHERE date=$1', [date]);
	
		res.status(200).json(rows);
		}
		catch(error){
			console.error(error);
		}
	  });

 //___________________________________ sending visits for current day ________________________________________________
 app.get('/api/visits/today', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const date=new Date().toLocaleDateString();
	const rows = await process.postgresql.query('SELECT * FROM register WHERE date=$1', [date]);

	res.status(200).json(rows);
  });

    //___________________________________ sending active visitors ________________________________________________
	app.get('/api/active/visits', async (req, res) => {
		res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
		// const date=req.params['date'];
		const checked_out="null";
		const rows = await process.postgresql.query('SELECT * FROM register WHERE checked_out=$1', [checked_out]);
	
		res.status(200).json(rows);
	  });

    //___________________________________ sending active visitors ________________________________________________
	app.get('/api/checkedout/visits', async (req, res) => {
		res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
		// const date=req.params['date'];
		const checked_out="null";
		const rows = await process.postgresql.query('SELECT * FROM register WHERE checked_out!=$1', [checked_out]);
	
		res.status(200).json(rows);
	  });

//___________________________________ registering a visit ________________________________________________
app.post('/api/visits', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const checked_in= new Date();
	const checkin_date= checked_in.toLocaleDateString();
	const checkin_time= checked_in.toLocaleTimeString();
	
	const visit = {
		
		host_name: req.body.host_name,
		visitor_name: req.body.visitor_name,
		visitor_email: req.body.visitor_email,
		visitor_no: req.body.visitor_no,
		date:checkin_date,
		checked_in: checkin_time,
		checked_out:null,
		role: req.body.role
		
	};
	console.log(visit);
	try{
	const host=  await process.postgresql.query('SELECT * FROM hosts WHERE name=$1' , [visit.host_name]);
	console.log(host);
	
	

	const visitor = await process.postgresql.query('SELECT * FROM visitors WHERE name=$1 AND email_id=$2' , [visit.visitor_name, visit.visitor_email]);
	if(visitor.length == 0){
		await process.postgresql.query(`INSERT INTO visitors (name, email_id, mobile_no) VALUES ('${visit.visitor_name}', '${visit.visitor_email}', '${visit.visitor_no}') ON CONFLICT DO NOTHING;`);
	}	

	
	await process.postgresql.query(`INSERT INTO register (host_id,host_name,visitor_name, visitor_email, visitor_no,date,checked_in,checked_out, role) VALUES ('${host[0].id}', '${visit.host_name}','${visit.visitor_name}','${visit.visitor_email}','${visit.visitor_no}','${visit.date}','${visit.checked_in}','${visit.checked_out}', '${visit.role}') ON CONFLICT DO NOTHING;`);
	
	 
	let htmlBody = "New visitor information : \n";                     // Preparing Msg for sending Mail to the expected visitor of the Meeting 
        htmlBody += "Name : " + visit.visitor_name + " \n " + "\n" + 
        " Email : " + visit.visitor_email + " \n " + "\n" +
        "Mobile Number : " +visit.visitor_no + " \n " + "\n" +
		"Purpose of visit:" + visit.role+  " \n " + "\n" +
        " Check In Time :" +visit.checked_in;
      
        
        var mailOptions =                                                   // Step 2 - Setting Mail Options of Nodemailer
        {
          from: process.env.EMAIL,
          to: host[0].email_id,
          subject: "New guest for you has arrived.",
          html: htmlBody,
        };

		transporter.sendMail(mailOptions, function(error, info){             // SEnding Mail
			if (error) {
			  console.log(error);
			} else {
			  console.log('Email sent: ' + info.response);
			}
		  });



const from = "250787380054";
const to =`250${host[0].mobile_no}`;
const text =` A new  guest for you has arrived
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

}
catch(error){
	console.error(error);
} 

	
  });

//___________________________________ Editing a visit ________________________________________________
app.put('/api/visits/:id', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
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
	try{
	await process.postgresql.query('UPDATE "register" SET "host_id" = $1, "host_name" = $2, "visitor_name" = $3, "visitor_email" = $4, "visitor_no" = $5,"date" = $10, "checked_in"= $6, "checked_out"=$7, "role"=$8  WHERE id=$9', [visit.host_id,visit.host_name,visit.visitor_name, visit.visitor_email,visit.visitor_no, visit.checked_in, visit.checked_out,visit.role,pk,visit.date]);
	 res.status(200).send(JSON.stringify('Visit edited'));
	}
	catch(error){
		console.error(error);
	}
	
  });

  //___________________________________ Editing a visit checkout ________________________________________________
app.patch('/api/visits/checkout/:id', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const pk=req.params.id;
	const checkout= new Date();
	const checkout_time= checkout.toLocaleTimeString();
	const visit = {
		checked_out: checkout_time,
	}
	try{
	await process.postgresql.query('UPDATE "register" SET "checked_out"=$1  WHERE id=$2', [visit.checked_out,pk]);
	 res.status(200).json('Checked out');
	}
	catch(error){
		console.error(error);
		res.status(404).json('Visit not found');
	}
	
  });

     //___________________________________ Sending a single visit ________________________________________________
	 app.get('/api/visits/:id', async (req, res) => {
		res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
		const pk=req.params['id'];
		try{
		const rows = await process.postgresql.query('SELECT * FROM register WHERE id=$1', [pk]);
		res.json(rows);
		}
		catch(error){
			console.error(error);
			res.status(404).json('Visit not found');
		}
	  });
	
		 //___________________________________ Sending a visit by date and time ________________________________________________
		 app.get('/api/visits/date/time', async (req, res) => {
			res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
			const date=req.query.date;
			const time= req.query.time;
	        try{
			const rows = await process.postgresql.query('SELECT * FROM register WHERE date=$1 AND checked_in=$2', [date, time]);
			res.json(rows);
			}
			catch(error){
				console.error(error);
				res.status(404).json("Recordnot found");
			}
		  });
	
	
	
	  
	   //___________________________________ Deleting a single visit ________________________________________________
	 app.delete('/api/visits/:id', async (req, res) => {
		res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
		const pk=req.params['id'];
		try {
			await process.postgresql.query('DELETE FROM "register" WHERE "id" = $1', [pk]);
		res.send('Record deleted');
		} catch (error) {
			console.error(error);
		}
		
	  });



//___________________________________ USER/ ADMIN ________________________________________________

  //___________________________________ register user ________________________________________________
app.post('/api/registeruser', async(req,res)=>{
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
const user={
	email: req.body.email,
	pass: req.body.password
}
try {
	await process.postgresql.query(`INSERT INTO users (email, password) VALUES (
		'${user.email}',
		crypt('${user.pass}', gen_salt('bf'))
	  );`)
			 res.status(200).send(JSON.stringify('User registered'));
} catch (error) {
	console.error(error);
}
 
});

//  //___________________________________ login user ________________________________________________
//  app.post('/api/login/admin', async(req,res)=>{
// 	const user={
// 		email: req.body.email,
// 		pass: req.body.password
// 	}
// 	  const newuser=await process.postgresql.query(`SELECT * 
// 	  FROM users
// 	 WHERE email = '${user.email}' 
// 	   AND password = crypt('${user.pass}', password);`)
// 	   if(newuser.length !=0){
// 			 res.json(newuser)
// 			 console.log(newuser)
// 	   };
// 	});

	app.post('/api/login/admin', async(req,res)=>{
		res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
		const user={
			email: req.body.email,
			pass: req.body.password
		}
		try {
			const newuser=await process.postgresql.query(`SELECT * 
			FROM users
		   WHERE email = '${user.email}' 
			 AND password = crypt('${user.pass}', password);`)
					  
					  if (newuser.length != 0){
						  session=req.session;
						  session.userid=user.email;
						  console.log(req.session)
						  res.json('User logged in');
					  }
					  else{
						  
							  res.json('Invalid username or password');
					  
					  };
			
		} catch (error) {
			console.error(error);
		}
		 
	
				
				 
		});

		app.get('/api/admin/logout',(req,res) => {
			try {
				req.session.destroy();
			res.json('User logged out');
			} catch (error) {
				console.error(error);
			}
			
		});




  


//___________________________________ Booking ________________________________________________


//___________________________________ generating qrcode ________________________________________________
  app.post('/qrgenerate', async(req,res) => {


	// openssl('openssl req -config csr.cnf -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout key.key -out certificate.crt');
	const visitor = {
		visitor_name: req.body.visitor_name,
		visitor_email: req.body.visitor_email,
		date:req.body.date,
		checked_in: req.body.checked_in,
		visitor_no: req.body.visitor_no,
		host_name: req.body.host_name,
		role: req.body.role
	};
	// console.log(visitor);
	const host = await process.postgresql.query('SELECT * FROM hosts WHERE name=$1', [visitor.host_name]);
	console.log(host[0].email_id);
	try {
		await process.postgresql.query(`INSERT INTO booking (visitor_name, visitor_email, visitor_no,host_name,date,checked_in, role) VALUES ('${visitor.visitor_name}','${visitor.visitor_email}','${visitor.visitor_no}','${visitor.host_name}','${visitor.date}','${visitor.checked_in}', '${visitor.role}') ON CONFLICT DO NOTHING;`);
     console.log('Booking registered')
	} catch (error) {
		console.error(error);
	}

	
	let stringdata = JSON.stringify(visitor)

// 	QRCode.toString(stringdata,{type:'terminal'},
//                     function (err, QRcode) {
 
//     if(err) return console.log("error occurred")
 
//     // Printing the generated code
//     console.log(QRcode)
// })
   
// Converting the data into base64
QRCode.toDataURL(stringdata, function (err, code) {
    if(err) return console.log("error occurred")

        let mailOptions =                                                   // Step 2 - Setting Mail Options of Nodemailer
        {
          from: process.env.EMAIL,
          to: visitor.visitor_email,
          subject: "Qr Code.",
		  text: 'Dear guest, find attached the qr code for your visit to AmaliTech',
		  attachDataUrls: true,
        //   html:'<img src= '+code+'> ',
		  attachments: [
			{
				filename: 'qrcode.png',
            contentType: 'image',
          path: `${code}`
			}
		]
        };

		transporter.sendMail(mailOptions, function(error, info){             // SEnding Mail
			if (error) {
			  console.log(error);
			} else {
			  console.log('Email sent: ' + info.response);
			}
		  });
		  const dateAndTime= visitor.date +' '+ visitor.checked_in; 
		  const scheduledTime=DateTime.fromSQL(dateAndTime,{zone: 'CAT'}).minus({minutes: 30});
		  const scheduledTime1=DateTime.fromSQL(dateAndTime,{zone: 'CAT'}).minus({minutes: 10});
		  console.log(scheduledTime);
		  console.log(scheduledTime1);
		//   console.log(dateAndTime);
		//   console.log(new Date(dateAndTime));
		//   console.log(new DateTime(dateAndTime));
		  const dayOfTheweek= scheduledTime.weekday;
		  const year= scheduledTime.year;
		  const month= scheduledTime.month;
		  const day= scheduledTime.day;
		  const hour= scheduledTime.hour;
		  const minute= scheduledTime.minute;
		  const second= scheduledTime.second;

		  console.log(dayOfTheweek);
		  console.log(year);
		  console.log(month);
	

		  const dayOfTheweek1= scheduledTime1.weekday;
		  const year1= scheduledTime1.year;
		  const month1= scheduledTime1.month;
		  const day1= scheduledTime1.day;
		  const hour1= scheduledTime1.hour;
		  const minute1= scheduledTime1.minute;
		  const second1= scheduledTime1.second;
   console.log(`${second} ${minute} ${hour} ${day} ${month} ${dayOfTheweek}`);
   console.log(`${second1} ${minute1} ${hour1} ${day1} ${month1} ${dayOfTheweek1}`);

		 
		   let mailOptions30=  {
			from: process.env.EMAIL,
			to: host[0].email_id,
			subject: "Reminder",
			text: `You have a scheduled visit from ${visitor.visitor_name}  in 30 minutes`,
			
		  };

		  let mailOptions10=  {
			from: process.env.EMAIL,
			to: host[0].email_id,
			subject: "Reminder",
			text: `You have a scheduled visit from ${visitor.visitor_name}  in 10 minutes`,
			
		  };


	
try {
	cron.schedule(`${second} ${minute} ${hour} ${day} ${month} ${dayOfTheweek}`,()=>{
		transporter.sendMail(mailOptions30, function(error, info){             // SEnding Mail
			if (error) {
			  console.log(error);
			} else {
			  console.log('Email sent: ' + info.response);
			}
		  });
	  }, {
		scheduled: true,
		timezone: "CAT"
	  } );
} catch (error) {
	console.error(error);
}
		 
try {
	cron.schedule(`${second1} ${minute1} ${hour1} ${day1} ${month1} ${dayOfTheweek1}`,()=>{
		transporter.sendMail(mailOptions10, function(error, info){             // SEnding Mail
			if (error) {
			  console.log(error);
			} else {
			  console.log('Email sent: ' + info.response);
			}
		  });
	  } , {
		scheduled: true,
		timezone: "CAT"
	  })
} catch (error) {
	console.error(error);
}
		  


	res.status(200).json('Qr code sent')

	
})

  });
// _________________________________________sending bookings______________________________
  app.get('/api/bookings', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const rows= await process.postgresql.query('SELECT * FROM booking;');
	res.json(rows);
  });

app.get('/api/bookings/today', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const today=DateTime.now().toFormat("yyyy-MM-dd");
	const time= DateTime.now().toLocaleString(DateTime.TIME_24_SIMPLE);
	console.log(today);
	console.log(time);
	// console.log(today.toFormat("yyyy-MM-dd"));
	const rando= "2022-06-23";
	const randomly=new Date(rando).toLocaleDateString();
	// console.log(new Date(rando).toLocaleDateString());
	console.log(today > randomly);
	let data=[];
	try {
		const rows= await process.postgresql.query('SELECT * FROM booking;');

	for (let index = 0; index < rows.length; index++) {
		const element = rows[index];
		// console.log(element);
		if( today < element.date && time < element.checked_in){
			data.push(element);
			console.log(new DateTime(element.date).toISO());
			// console.log(element);
			console.log(element.date);
			// console.log(new Date(element.date).toLocaleDateString())

		}
	}
	res.json(data);
	} catch (error) {
		console.error(error);
	}
	
  });

//___________________________________ Sending a single booking ________________________________________________
app.get('/api/bookings/:id', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const pk=req.params['id'];
	try {
		const rows = await process.postgresql.query('SELECT * FROM booking WHERE id=$1', [pk]);
	res.json(rows);
	} catch (error) {
		console.error(error);
	}
	
  });

// ___________________________________________pdf________________________________________________________________
app.get('/api/pdf/visits', async(req,res)=>{
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const rows = await process.postgresql.query('SELECT * FROM register');
	const name= new Date().toLocaleDateString();
	let doc = new PDFDocument({ margin: 30, size: 'A4' });
	const table = {
		title: "Visits",
		subtitle: "General visits report",
		headers: [
		  { label: "Host", property: 'host_name', width: 60, renderer: null },
		  { label: "Visitor name", property: 'visitor_name', width:60, renderer: null }, 
		  { label: "Visitor email", property: 'visitor_email', width: 80, renderer: null }, 
		  { label: "Visitor mobile", property: 'visitor_no', width: 80, renderer: null }, 
		  { label: "Date", property: 'date', width: 80, renderer: null },
		  { label: "Check in time", property: 'checked_in', width: 80, renderer: null }, 
		  { label: "Check out time", property: 'checked_out', width: 80, renderer: null },
		  { label: "Role", property: 'role', width: 80, renderer: null },
		 
		],
		// complex data
		datas:rows,
		// simeple data

	  };
	  // the magic
	  doc.table(table, {
		prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
		prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
		  doc.font("Helvetica").fontSize(8);
		  indexColumn === 0 && doc.addBackground(rectRow, 'blue', 0.15);
		},
	  });
	  // done!
	//   doc.pipe(res);
	doc.pipe(fs.createWriteStream(__dirname+'/public/visits.pdf'));
	const src = fs.createReadStream(__dirname+'/public/visits.pdf');
	
	res.writeHead(200, {
		'Content-Type': 'application/pdf',
		'Content-Disposition': `attachment; filename= ${name} report.pdf`,
		'Content-Transfer-Encoding': 'Binary'
	  });
	
	  src.pipe(res);
	  doc.end();
	 
	});

	app.get('/api/pdf/visits/host/:host', async(req,res)=>{
		res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
		const host= req.params.host;
		const rows = await process.postgresql.query('SELECT * FROM register WHERE host_id=$1',[host]);
		const name= new Date().toLocaleDateString();
		let doc = new PDFDocument({ margin: 30, size: 'A4' });
		const table = {
			title: "Visits",
			subtitle: "Guest report by host",
			headers: [
			  { label: "Host", property: 'host_name', width: 60, renderer: null },
			  { label: "Visitor name", property: 'visitor_name', width:60, renderer: null }, 
			  { label: "Visitor email", property: 'visitor_email', width: 80, renderer: null }, 
			  { label: "Visitor mobile", property: 'visitor_no', width: 80, renderer: null }, 
			  { label: "Date", property: 'date', width: 80, renderer: null },
			  { label: "Check in time", property: 'checked_in', width: 80, renderer: null }, 
			  { label: "Check out time", property: 'checked_out', width: 80, renderer: null },
			  { label: "Role", property: 'role', width: 80, renderer: null },
			 
			],
			// complex data
			datas:rows,
			// simeple data
	
		  };
		  // the magic
		  doc.table(table, {
			prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
			prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
			  doc.font("Helvetica").fontSize(8);
			  indexColumn === 0 && doc.addBackground(rectRow, 'blue', 0.15);
			},
		  });
		  // done!
		//   doc.pipe(res);
		doc.pipe(fs.createWriteStream(__dirname+'/public/visits.pdf'));
		const src = fs.createReadStream(__dirname+'/public/visits.pdf');
		
		res.writeHead(200, {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename= ${name} report.pdf`,
			'Content-Transfer-Encoding': 'Binary'
		  });
		
		  src.pipe(res);
		  doc.end();
		 
		});
	


	app.get('/api/pdf/visits/today', async(req,res)=>{
		res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
		const name= new Date().toLocaleDateString();
		try {
			const rows = await process.postgresql.query('SELECT * FROM register WHERE date=$1',[name]);
		let doc = new PDFDocument({ margin: 30, size: 'A4' });
		const table = {
			title: "Visits",
			subtitle: "Today's visits report",
			headers: [
			  { label: "Host", property: 'host_name', width: 60, renderer: null },
			  { label: "Visitor name", property: 'visitor_name', width:60, renderer: null }, 
			  { label: "Visitor email", property: 'visitor_email', width: 80, renderer: null }, 
			  { label: "Visitor mobile", property: 'visitor_no', width: 80, renderer: null }, 
			  { label: "Date", property: 'date', width: 80, renderer: null },
			  { label: "Check in time", property: 'checked_in', width: 80, renderer: null }, 
			  { label: "Check out time", property: 'checked_out', width: 80, renderer: null },
			  { label: "Role", property: 'role', width: 80, renderer: null },
			 
			],
			// complex data
			datas:rows,
			// simeple data
	
		  };
		  // the magic
		  doc.table(table, {
			prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
			prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
			  doc.font("Helvetica").fontSize(8);
			  indexColumn === 0 && doc.addBackground(rectRow, 'blue', 0.15);
			},
		  });
		  // done!
		//   doc.pipe(res);
		doc.pipe(fs.createWriteStream(__dirname+'/public/visits.pdf'));
		const src = fs.createReadStream(__dirname+'/public/visits.pdf');
		
		res.writeHead(200, {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename= ${name} report.pdf`,
			'Content-Transfer-Encoding': 'Binary'
		  });
		
		  src.pipe(res);
		  doc.end();
		} catch (error) {
			console.error(error);
		}
		
		 
		});

		app.get('/api/pdf/visits/date', async(req,res)=>{
			res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
			const name= new Date().toLocaleDateString();
			const date= req.query.date;
			try {
				const rows = await process.postgresql.query('SELECT * FROM register WHERE date=$1',[date]);
			let doc = new PDFDocument({ margin: 30, size: 'A4' });
			const table = {
				title: "Visits",
				subtitle: "Visits report by date",
				headers: [
				  { label: "Host", property: 'host_name', width: 60, renderer: null },
				  { label: "Visitor name", property: 'visitor_name', width:60, renderer: null }, 
				  { label: "Visitor email", property: 'visitor_email', width: 80, renderer: null }, 
				  { label: "Visitor mobile", property: 'visitor_no', width: 80, renderer: null }, 
				  { label: "Date", property: 'date', width: 80, renderer: null },
				  { label: "Check in time", property: 'checked_in', width: 80, renderer: null }, 
				  { label: "Check out time", property: 'checked_out', width: 80, renderer: null },
				  { label: "Role", property: 'role', width: 80, renderer: null },
				 
				],
				// complex data
				datas:rows,
				// simeple data
		
			  };
			  // the magic
			  doc.table(table, {
				prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
				prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
				  doc.font("Helvetica").fontSize(8);
				  indexColumn === 0 && doc.addBackground(rectRow, 'blue', 0.15);
				},
			  });
			  // done!
			//   doc.pipe(res);
			doc.pipe(fs.createWriteStream(__dirname+'/public/visits.pdf'));
			const src = fs.createReadStream(__dirname+'/public/visits.pdf');
			
			res.writeHead(200, {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename= ${name} report.pdf`,
				'Content-Transfer-Encoding': 'Binary'
			  });
			
			  src.pipe(res);
			  doc.end();
			} catch (error) {
				console.error(error);
			}
			
			 
			});
	


	app.get('/api/pdf/visitors', async(req,res)=>{
		res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
		const rows = await process.postgresql.query('SELECT * FROM visitors');
		const name= new Date().toLocaleDateString();
		let doc = new PDFDocument({ margin: 30, size: 'A4' });
		const table = {
			title: "Visitors",
			subtitle: `${name} report`,
			headers: [
			  { label: "ID", property: 'id', width: 60, renderer: null },
			  { label: "Name", property: 'name', width:150, renderer: null }, 
			  { label: "Email", property: 'email_id', width: 150, renderer: null }, 
			  { label: "Phone nnumber", property: 'mobile_no', width: 150, renderer: null }, 
			],
			// complex data
			datas:rows,
			// simeple data
	
		  };
		  // the magic
		  doc.table(table, {
			prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
			prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
			  doc.font("Helvetica").fontSize(8);
			  indexColumn === 0 && doc.addBackground(rectRow, 'blue', 0.15);
			},
		  });
		  // done!
		//   doc.pipe(res);
		doc.pipe(fs.createWriteStream(__dirname+'/public/visitors.pdf'));
		const src = fs.createReadStream(__dirname+'/public/visitors.pdf');
		
		res.writeHead(200, {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename= ${name} report.pdf`,
			'Content-Transfer-Encoding': 'Binary'
		  });
		
		  src.pipe(res);
		  doc.end();
		 
		});
	

		app.get('/api/pdf/hosts', async(req,res)=>{
			res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
			const rows = await process.postgresql.query('SELECT * FROM hosts');
			const name= new Date().toLocaleDateString();
			let doc = new PDFDocument({ margin: 30, size: 'A4' });
			const table = {
				title: "Hosts",
				subtitle: `${name} report`,
				headers: [
				  { label: "ID", property: 'id', width: 60, renderer: null },
				  { label: "Name", property: 'name', width:150, renderer: null }, 
				  { label: "Email", property: 'email_id', width: 150, renderer: null }, 
				  { label: "Phone nnumber", property: 'mobile_no', width: 150, renderer: null }, 
				],
				// complex data
				datas:rows,
				// simeple data
		
			  };
			  // the magic
			  doc.table(table, {
				prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
				prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
				  doc.font("Helvetica").fontSize(8);
				  indexColumn === 0 && doc.addBackground(rectRow, 'blue', 0.15);
				},
			  });
			  // done!
			//   doc.pipe(res);
			doc.pipe(fs.createWriteStream(__dirname+'/public/hosts.pdf'));
			const src = fs.createReadStream(__dirname+'/public/hosts.pdf');
			
			res.writeHead(200, {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename= ${name} report.pdf`,
				'Content-Transfer-Encoding': 'Binary'
			  });
			
			  src.pipe(res);
			  doc.end();
			 
			});

// _____________________________________________csv______________________________________________________________________
app.get('/api/csv/hosts', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	// const rows = await process.postgresql.query('SELECT * FROM hosts');
	const csvWriter = createCsvWriter({
		path:__dirname+'/public/hosts.csv',
		header: [
			{id: 'id', title: 'ID'},
			{id: 'name', title: 'NAME'},
			{id: 'email_id', title: 'EMAIL'},
			{id: 'mobile_no', title: 'PHONE NUMBER'}
		]
	});
	 
	const records = await process.postgresql.query('SELECT * FROM hosts');
	 
	csvWriter.writeRecords(records)       // returns a promise
		.then(() => {
			console.log('...Done');
		});

	const src = fs.createReadStream(__dirname+'/public/hosts.csv');
	const name= new Date().toLocaleDateString();
	res.writeHead(200, {
		'Content-Type': 'application/csv',
		'Content-Disposition': `attachment; filename= ${name} report.csv`,
		'Content-Transfer-Encoding': 'Binary'
	  });
	
	  src.pipe(res); 
  });

//   +++++++++++++++++++++++++++++++++++++++++++++===csv visitors++++++++++++++++++++++++++++++++++++++
  
app.get('/api/csv/visitors', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	// const rows = await process.postgresql.query('SELECT * FROM visitors');
	const name= new Date().toLocaleDateString();
	const csvWriter = createCsvWriter({
		path:__dirname+'/public/visitors.csv',
		header: [
			{id: 'id', title: 'ID'},
			{id: 'name', title: 'NAME'},
			{id: 'email_id', title: 'EMAIL'},
			{id: 'mobile_no', title: 'PHONE NUMBER'}
		]
	});
	 
	const records = await process.postgresql.query('SELECT * FROM visitors');
	 
	csvWriter.writeRecords(records)       // returns a promise
		.then(() => {
			console.log('...Done');
		});

	const src = fs.createReadStream(__dirname+'/public/visitors.csv');
	
	res.writeHead(200, {
		'Content-Type': 'application/csv',
		'Content-Disposition': `attachment; filename= ${name} report.csv`,
		'Content-Transfer-Encoding': 'Binary'
	  });
	
	  src.pipe(res); 
  });

// ++++++++++++++++++++++++++++++++++++++++++++++csv visits++++++++++++++++++++++++++++++++++++++++

  app.get('/api/csv/visits', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	// const rows = await process.postgresql.query('SELECT * FROM register');
	const name= new Date().toLocaleDateString();
	const csvWriter = createCsvWriter({
		path:__dirname+`/public/visits.csv`,
		header: [
			{id: 'host_name', title: 'HOST'},
			{id: 'visitor_name', title: ' VISITOR NAME'},
			{id: 'visitor_email', title: 'VISITOR EMAIL'},
			{id: 'visitor_no', title: 'VISITOR MOBILE'},
			{id: 'date', title: 'DATE'},
			{id: 'checked_in', title: 'CHECK IN'},
			{id: 'checked_out', title: 'CHECK OUT'},
			{id: 'role', title: 'PURPOSE'},

		]
	});
	 
	const records = await process.postgresql.query('SELECT * FROM register');
	 
	csvWriter.writeRecords(records)       // returns a promise
		.then(() => {
			console.log('...Done');
		});

	const src = fs.createReadStream(__dirname+`/public/visits.csv`);
	
	res.writeHead(200, {
		'Content-Type': 'application/csv',
		'Content-Disposition': `attachment; filename= ${name} report.csv`,
		'Content-Transfer-Encoding': 'Binary'
	  });
	
	  src.pipe(res); 
	//   res.send(Buffer.from(records));
  });

//   ++++++++++++++++++++++++++++++++++++++++++++++++++csv visits for current day++++++++++++++++++++++++++++++++++++++++++++++

  app.get('/api/csv/visits/today', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const date= req.params.date;
	// const rows = await process.postgresql.query('SELECT * FROM register');
	try {
		const name= new Date().toLocaleDateString();
	const csvWriter = createCsvWriter({
		path:__dirname+`/public/visits.csv`,
		header: [
			{id: 'host_name', title: 'HOST'},
			{id: 'visitor_name', title: ' VISITOR NAME'},
			{id: 'visitor_email', title: 'VISITOR EMAIL'},
			{id: 'visitor_no', title: 'VISITOR MOBILE'},
			{id: 'date', title: 'DATE'},
			{id: 'checked_in', title: 'CHECK IN'},
			{id: 'checked_out', title: 'CHECK OUT'},
			{id: 'role', title: 'PURPOSE'},

		]
	});
	 
	const records = await process.postgresql.query('SELECT * FROM register WHERE date=$1',[name]);
	 
	csvWriter.writeRecords(records)       // returns a promise
		.then(() => {
			console.log('...Done');
		});

	const src = fs.createReadStream(__dirname+`/public/visits.csv`);
	
	res.writeHead(200, {
		'Content-Type': 'application/csv',
		'Content-Disposition': `attachment; filename= ${name} report.csv`,
		'Content-Transfer-Encoding': 'Binary'
	  });
	
	  src.pipe(res); 
	} catch (error) {
		console.error(error);
	}
	
	//   res.send(Buffer.from(records));
  });

//   +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++csv visits by date++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  app.get('/api/csv/visits/date', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const date= req.query.date;
	// const tdate= date.toLocaleDateString();
	// const rows = await process.postgresql.query('SELECT * FROM register');
	// https://vmsapi1.herokuapp.com/api/csv/visits/date?date=6%2F27%2F2022
	try {
		const name= new Date().toLocaleDateString();
	const csvWriter = createCsvWriter({
		path:__dirname+`/public/visits.csv`,
		header: [
			{id: 'host_name', title: 'HOST'},
			{id: 'visitor_name', title: ' VISITOR NAME'},
			{id: 'visitor_email', title: 'VISITOR EMAIL'},
			{id: 'visitor_no', title: 'VISITOR MOBILE'},
			{id: 'date', title: 'DATE'},
			{id: 'checked_in', title: 'CHECK IN'},
			{id: 'checked_out', title: 'CHECK OUT'},
			{id: 'role', title: 'PURPOSE'},

		]
	});
	 
	const records = await process.postgresql.query('SELECT * FROM register WHERE date=$1',[date]);
	 
	csvWriter.writeRecords(records)       // returns a promise
		.then(() => {
			console.log('...Done');
		});

	const src = fs.createReadStream(__dirname+`/public/visits.csv`);
	
	res.writeHead(200, {
		'Content-Type': 'application/csv',
		'Content-Disposition': `attachment; filename= ${name} report.csv`,
		'Content-Transfer-Encoding': 'Binary'
	  });
	
	  src.pipe(res); 
	} catch (error) {
		console.error(error);
	}
	
	//   res.send(Buffer.from(records));
  });
	

//   +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++csv visits by host+++++++++++++++++++++++++++++++++++++++++++++++++++++

  app.get('/api/csv/visits/host/:host', async (req, res) => {
	res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
	const host= req.params.host;
	// const rows = await process.postgresql.query('SELECT * FROM register');
	try {
		const name= new Date().toLocaleDateString();
	const csvWriter = createCsvWriter({
		path:__dirname+`/public/visits.csv`,
		header: [
			{id: 'host_name', title: 'HOST'},
			{id: 'visitor_name', title: ' VISITOR NAME'},
			{id: 'visitor_email', title: 'VISITOR EMAIL'},
			{id: 'visitor_no', title: 'VISITOR MOBILE'},
			{id: 'date', title: 'DATE'},
			{id: 'checked_in', title: 'CHECK IN'},
			{id: 'checked_out', title: 'CHECK OUT'},
			{id: 'role', title: 'PURPOSE'},

		]
	});
	 
	const records = await process.postgresql.query('SELECT * FROM register WHERE host_id=$1',[host]);
	 
	csvWriter.writeRecords(records)       // returns a promise
		.then(() => {
			console.log('...Done');
		});

	const src = fs.createReadStream(__dirname+`/public/visits.csv`);
	
	res.writeHead(200, {
		'Content-Type': 'application/csv',
		'Content-Disposition': `attachment; filename= ${name} report.csv`,
		'Content-Transfer-Encoding': 'Binary'
	  });
	
	  src.pipe(res); 
	} catch (error) {
		console.error(error);
	}
	
	//   res.send(Buffer.from(records));
  });

//   ______________________________________________upload csv______________________________________________

var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './public/uploads/')    
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
 
var upload = multer({
    storage: storage
});

app.post('/uploadfile', upload.single("uploadfile"), (req, res) =>{
    UploadCsvDataToMyDatabase(__dirname + '/public/uploads/' + req.file.filename);
    console.log('CSV file data has been uploaded in database ');
});
	
let UploadCsvDataToMyDatabase= (filePath)=>{
	let stream = fs.createReadStream(filePath);
    let csvData = [];
    let csvStream = fastcsv
        .parse()
        .on("data", function (data) {
            csvData.push(data);
        })
        .on("end", function () {
            // Remove Header ROW
            csvData.shift();
  
            // Open the MySQL connection
            
               
			let query =   "INSERT INTO hosts ( name, email_id, mobile_no, department) VALUES ($1, $2, $3, $4)";
			try {
				csvData.forEach(row => {
					process.postgresql.query(query, row);
				});
			  }
			  catch(error){
				console.error(error);
			  };
               
      
             
            // delete file after saving to MySQL database
            // -> you can comment the statement to see the uploaded CSV file.
            fs.unlinkSync(filePath)
        });
  
    stream.pipe(csvStream);
};


//   app.get("/", (req, res) => {
// 	res.sendFile('../views/index.html')
//   });

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});