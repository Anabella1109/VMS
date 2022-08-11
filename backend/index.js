const express = require("express");
const bodyParser= require('body-parser');
const QRCode= require('qrcode');
const postgresql=require('./db_connector/postgresql.js');
const config=require('./config.json');
const crypto = require('crypto');
const fs = require('fs');
const fastcsv= require('fast-csv');
const PDFDocument = require("pdfkit-table");
const cors = require('cors')
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const { DateTime } = require("luxon");    
const cron = require('node-cron');
const multer = require('multer');
const sendEMail= require('./sendNotifications/send_email');
const sendSmsNotif= require('./sendNotifications/send-sms');
const validators=require('./validations/validators.js');
const { param,validationResult } = require('express-validator');
const {csvWriterHost, csvWriterVisitor, csvWriterVisits}= require('./csv/csv_writers.js')
const { tableVisits, tableVisitors, tableHosts}= require('./pdf/pdf_writers.js')

const PORT = process.env.PORT || 3001;

const oneDay = 1000 * 60 * 60 * 24;

const app = express();
const path = require('path');

// const router = express.Router();
;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public",express.static(__dirname+'/public'));
app.use(cors())

app.use(sessions({
    secret: process.env.SECRET,
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));
app.use(cookieParser());




let session;

//___________________________________ Connection to database ________________________________________________
postgresql(async (connection) => {
 });


app.get("/", (req, res) => {
	res.sendFile(__dirname+'/views/index.html');
  });


//___________________________________ HOSTS ________________________________________________

//___________________________________ Send hosts ________________________________________________
app.get('/api/hosts', async (req, res) => {
	try {
		const query=`SELECT * FROM hosts;`;
		const rows= await process.postgresql.query(query);
	res.json(rows);
	} catch (error) {
		console.error(error);
	}
	
  });


//___________________________________ Sending single host ________________________________________________
app.get('/api/hosts/:id', validators.checkIfIdIsInt(), async (req, res) => {
	const errors = validationResult(req);

		if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
    else{
	const pk=req.params['id'];
	
		try {

		const rows = await process.postgresql.query('SELECT * FROM hosts WHERE id=$1', [pk]);
		res.json(rows);
			
	} catch (error) {
			console.error(error);
		}
	}
  });


//___________________________________ login host ________________________________________________
 app.post('/api/login/host', validators.checkLoginDataQuality(), async(req,res)=>{
	const errors = validationResult(req);

		if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
    else{
	const user={
		email: req.body.email,
		pass: req.body.password
	}
	try{
		const host=await process.postgresql.query(`SELECT * FROM hosts WHERE email_id = '${user.email}' AND password = '${user.pass}';`);
		if (host.length != 0){
			session=req.session;
			session.userid=user.email;
			session.isAdmin=false;
			session.hostId= host[0].id;
			res.json(session);
	}
	else{
		
			res.status(404).json('Invalid username or password');
	
	};
	}
	catch(error){
    console.error(error);
	}
}
	});


//___________________________________ registering a host ________________________________________________
app.post('/api/hosts', validators.checkHostDataQuality(), async (req, res) => {
	const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				errors: errors.array()
			});
		}
	else{
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

			sendEMail(mailOptions);
		
		
			const from = "250787380054";
			const to =`25${host.mobile_no}`;
			const text =` Your new login information
			Email: ${host.email_id} 
			Password: ${host.password}
			`;
			
			sendSmsNotif(from, to,text);
			res.status(201).json('Host registered!');

	}
		catch(error){
			console.error(error);
			res.send(error);
		}
	}
	});

  //___________________________________ editing a host ________________________________________________
app.put('/api/hosts/:id', validators.checkIfIdIsInt(), validators.checkHostDataQuality(), async (req, res) => {
	const errors = validationResult(req);

		if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
    else{
	const pk=req.params['id'];
	const host = {
		name: req.body.name,
		email_id: req.body.email_id,
		mobile_no: req.body.mobile_no,
		department: req.body.department
	}
	try{
		if(host.mobile_no != "undefined"){
	 await process.postgresql.query('UPDATE "hosts" SET "name" = $1, "email_id" = $2, "mobile_no" = $3, "department"= $4 WHERE id=$5', [host.name,host.email_id,host.mobile_no,host.department,pk])
		res.status(200).send(JSON.stringify('Host edited!'));
		}else{
			console.log("Data undefined");
			res.status(404).json("data undefined");
		}
	}
	catch(error){
		console.error(error);
	}	
}
  });

  //___________________________________ editing a host password ________________________________________________
  app.patch('/api/hosts/:id',validators.checkIfIdIsInt(),validators.checkHostEditPasswordQaulity(), async (req, res) => {
		const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({
					success: false,
					errors: errors.array()
				});
			}
		else{
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
	}
	});
   //___________________________________ Deleting a single host ________________________________________________
 app.delete('/api/hosts/:id',validators.checkIfIdIsInt(),async (req, res) => {
		const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(400).json({
					success: false,
					errors: errors.array()
				});
			}
		else{
		const pk=req.params['id'];
		try {
			
				await process.postgresql.query('DELETE FROM "hosts" WHERE "id" = $1', [pk]);
		res.json('Host deleted');
				
		} catch (error) {
			console.error(error);
			res.status(400).json(error);
		}
		}	
	});



 //___________________________________ VISITORS ________________________________________________

  //___________________________________ sending visitors ________________________________________________
app.get('/api/visitors', async (req, res) => {
		try {
			const rows = await process.postgresql.query('SELECT * FROM visitors');
			res.json(rows);
		} catch (error) {
			console.error(error);
			res.status(400).json('Resource not found')
		}	
		});
  
//___________________________________ regitering a visitor ________________________________________________
app.post('/api/visitors',validators.checkVisitortDataQuality(), async (req, res) => {
		const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(400).json({
					success: false,
					errors: errors.array()
				});
			}
		else{
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
		}
	});

    //___________________________________ editing a visitor ________________________________________________
app.put('/api/visitors/:id',validators.checkIfIdIsInt(), validators.checkVisitortDataQuality(), async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				errors: errors.array()
			});
		}
	else{
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
			}	
		});
	 
//___________________________________ Sending a single visitor ________________________________________________
app.get('/api/visitors/:id',validators.checkIfIdIsInt(), async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
					return res.status(400).json({
						success: false,
						errors: errors.array()
					});
				}
			else{
				const pk=req.params['id'];
				try {
				
					const rows = await process.postgresql.query('SELECT * FROM visitors WHERE id=$1', [pk]);
				res.json(rows);
				
				} catch (error) {
					console.error(error);
				}
			}
			});
	
	   //___________________________________ Deleting a single visitor _____________________________________________
 app.delete('/api/visitors/:id', async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				errors: errors.array()
			});
		}
	  	else{
		const pk=req.params['id'];
		try {

			await process.postgresql.query('DELETE FROM "visitors" WHERE "id" = $1', [pk]);
		res.json('Visitor deleted');
		} catch (error) {
			console.error(error);
		}
	}	
	});

//___________________________________VISITS ________________________________________________

  //___________________________________ sending visits ________________________________________________
  app.get('/api/visits', async (req, res) => {
		const rows = await process.postgresql.query('SELECT * FROM register');
		res.status(200).json(rows);
	});

 //___________________________________ sending visits by date ________________________________________________
app.get('/api/date/visits', async (req, res) => {
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
		const checked_in= DateTime.now().setZone('CAT');
		const date= checked_in.toFormat("yyyy-MM-dd");
		const rows = await process.postgresql.query('SELECT * FROM register WHERE date=$1', [date]);

		res.status(200).json(rows);
	});

//___________________________________ sending active visitors ________________________________________________
app.get('/api/active/visits', async (req, res) => {
		const checked_out="null";
		const rows = await process.postgresql.query('SELECT * FROM register WHERE checked_out=$1', [checked_out]);
	
		res.status(200).json(rows);
	  });

//___________________________________ sending checkedout visitors ________________________________________________
app.get('/api/checkedout/visits', async (req, res) => {
		const checked_out="null";
		const rows = await process.postgresql.query('SELECT * FROM register WHERE checked_out!=$1', [checked_out]);
		res.status(200).json(rows);
	  });

//___________________________________ registering a visit ________________________________________________
app.post('/api/visits', validators.checkCheckinDataQuality(), async (req, res) => {
		const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(400).json({
					success: false,
					errors: errors.array()
				});
			}
		else{
		const checked_in= DateTime.now().setZone('CAT');
		const checkin_date= checked_in.toFormat("yyyy-MM-dd");
		const checkin_time= checked_in.toLocaleString(DateTime.TIME_24_WITH_SECONDS);
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
		try{

		const host=  await process.postgresql.query('SELECT * FROM hosts WHERE name=$1' , [visit.host_name]);
		
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
			sendEMail(mailOptions);



			const from = "250787380054";
			const to =`250${host[0].mobile_no}`;
			const text =` A new  guest for you has arrived
			Name: ${visit.visitor_name} 
			Number: ${visit.visitor_no}
			email: ${visit.visitor_email}
			Checkin Time:${visit.checked_in}`;

			sendSmsNotif(from, to, text);

			res.status(200).send('Visit registered!');


		
		}
	catch(error){
		console.error(error);
	} 
		}
		
	});

  //___________________________________ qr checkin________________________________________________
app.post('/api/checkin', async (req, res) => {
		const checked_in= DateTime.now().setZone('CAT');
		const checkin_date= checked_in.toFormat("yyyy-MM--dd");
		const checkin_time= checked_in.toLocaleString(DateTime.TIME_24_WITH_SECONDS);
		
		try{

			const obj = JSON.parse(JSON.stringify(req.body));
			const getvisit= ()=>{for(entry in obj){
				return JSON.parse(entry);;
			}
		};
			const visit=getvisit();
			const checked_out=null;
			
			if(visit != "No Result"){
		const host=  await process.postgresql.query('SELECT * FROM hosts WHERE name=$1' , [visit.host_name]);
		const visitor = await process.postgresql.query('SELECT * FROM visitors WHERE name=$1 AND email_id=$2' , [visit.visitor_name, visit.visitor_email]);
		if(visitor.length == 0){
			await process.postgresql.query(`INSERT INTO visitors (name, email_id, mobile_no) VALUES ('${visit.visitor_name}', '${visit.visitor_email}', '${visit.visitor_no}') ON CONFLICT DO NOTHING;`);
		}	

		
		await process.postgresql.query(`INSERT INTO register (host_id,host_name,visitor_name, visitor_email, visitor_no,date,checked_in,checked_out, role) VALUES ('${host[0].id}', '${visit.host_name}','${visit.visitor_name}','${visit.visitor_email}','${visit.visitor_no}','${checkin_date}','${checkin_time}','${checked_out}', '${visit.role}') ON CONFLICT DO NOTHING;`);
		
		
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

		sendEMail(mailOptions);

			const from = "250787380054";
			const to =`250${host[0].mobile_no}`;
			const text =` A new  guest for you has arrived
			Name: ${visit.visitor_name} 
			Number: ${visit.visitor_no}
			email: ${visit.visitor_email}
			Checkin Time:${visit.checked_in}`;

			sendSmsNotif(from, to, text);


		res.status(200).send('Visit registered!');

	}
		}
	catch(error){
		console.error(error);
	} 

		
	});

//___________________________________ Editing a visit ________________________________________________
app.put('/api/visits/:id',validators.checkIfIdIsInt(),validators.checkBookingDataQuality(), async (req, res) => {
		const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(400).json({
					success: false,
					errors: errors.array()
				});
			}
		else{
		const pk=req.params['id'];
		const visit = {
			host_name: req.body.host_name,
			visitor_name: req.body.visitor_name,
			visitor_email: req.body.visitor_email,
			visitor_no: req.body.visitor_no,
			date: req.body.date,
			checked_in: req.body.checked_in,
			checked_out: req.body.checked_out,
			role: req.body.role
			
		}
		try{
			
		await process.postgresql.query('UPDATE "register" SET "host_name" = $1, "visitor_name" = $2, "visitor_email" = $3, "visitor_no" = $4, "role"=$5  WHERE id=$6', [visit.host_name,visit.visitor_name, visit.visitor_email,visit.visitor_no, visit.role,pk]);
		res.status(200).send(JSON.stringify('Visit edited'));
		
		}
		catch(error){
			console.error(error);
		}
	}
	});

  //___________________________________ Editing a visit checkout ________________________________________________
app.patch('/api/visits/checkout/:id', validators.checkIfIdIsInt(),async (req, res) => {
	const errors = validationResult(req);

		if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
    else{
	const pk=req.params.id;
	const checkout= DateTime.now().setZone('CAT');
	const checkout_time= checkout.toLocaleString(DateTime.TIME_24_WITH_SECONDS);
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
	}	
  });

     //___________________________________ Sending a single visit ________________________________________________
app.get('/api/visits/:id',validators.checkIfIdIsInt(), async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
				return res.status(400).json({
					success: false,
					errors: errors.array()
				});
			}
		else{
			const pk=req.params['id'];
			try{
				
			const rows = await process.postgresql.query('SELECT * FROM register WHERE id=$1', [pk]);
			res.json(rows);
			}
			catch(error){
				console.error(error);
				res.status(404).json('Visit not found');
			}
		}
		});

//___________________________________ Sending a svisits by hosts ________________________________________________
 app.get('/api/visits/host/:host_id', param('host_id').isInt(),async (req, res) => {
	const errors = validationResult(req);

		if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
    else{
			const pk=req.params['host_id'];
			try{
			const rows = await process.postgresql.query('SELECT * FROM register WHERE host_id=$1', [pk]);
			res.json(rows);
			}
			catch(error){
				console.error(error);
				res.status(404).json('Visit not found');
			}
		}
		  });
	
//___________________________________ Sending a visits by date and time ________________________________________________
app.get('/api/visits/date/time', async (req, res) => {
			const date=req.query.date;
			const time= req.query.time;
	        try{
			const rows = await process.postgresql.query('SELECT * FROM register WHERE date=$1 AND checked_in=$2', [date, time]);
			res.json(rows);
			}
			catch(error){
				console.error(error);
				res.status(404).json("Record not found");
			}
		  });
	
	
	
	  
//___________________________________ Deleting a single visit ________________________________________________
app.delete('/api/visits/:id',validators.checkIfIdIsInt(), async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
    else{
		const pk=req.params['id'];
		try {

			await process.postgresql.query('DELETE FROM "register" WHERE "id" = $1', [pk]);
		res.send('Record deleted');
			
		} catch (error) {
			console.error(error);
		}
	}	
	  });



//___________________________________ USER/ ADMIN ________________________________________________

//___________________________________ register user ________________________________________________
app.post('/api/registeruser',validators.checkRegisterDataQuality(), async(req,res)=>{
		const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(400).json({
					success: false,
					errors: errors.array()
				});
			}
		else{
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
	}
	});

 //___________________________________ login user ________________________________________________
app.post('/api/login/admin', validators.checkLoginDataQuality(), async(req,res)=>{
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
				return res.status(400).json({
					success: false,
					errors: errors.array()
				});
			}
		else{
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
							session.isAdmin= true;
							res.json(session);
						}
						else{
							
								res.json('Invalid username or password');
						
						};
				
			} catch (error) {
				console.error(error);
			}
		}				 
			});

// ______________________________________________logout user________________________________________
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
  app.post('/qrgenerate',validators.checkBookingDataQuality(), async(req,res) => {
		const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(400).json({
					success: false,
					errors: errors.array()
				});
			}
		else{
		const visitor = {
			visitor_name: req.body.visitor_name,
			visitor_email: req.body.visitor_email,
			date:req.body.date,
			arrival_time: req.body.checked_in,
			visitor_no: req.body.visitor_no,
			host_name: req.body.host_name,
			role: req.body.role,
			token:''
		};

		const host = await process.postgresql.query('SELECT * FROM hosts WHERE name=$1', [visitor.host_name]);
		try {
			await process.postgresql.query(`INSERT INTO booking (visitor_name, visitor_email, visitor_no,host_name,date,checked_in, role) VALUES ('${visitor.visitor_name}','${visitor.visitor_email}','${visitor.visitor_no}','${visitor.host_name}','${visitor.date}','${visitor.arrival_time}', '${visitor.role}') ON CONFLICT DO NOTHING;`);
		console.log('Booking registered')
		} catch (error) {
			console.error(error);
		}

		
		let stringdata = JSON.stringify(visitor);

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

					sendEMail(mailOptions);
				const dateAndTime= visitor.date +' '+ visitor.arrival_time; 
				const scheduledTime=DateTime.fromSQL(dateAndTime,{zone: 'CAT'}).minus({minutes: 30}); 
				const scheduledTime1=DateTime.fromSQL(scheduledTime,{zone: 'CAT'}).plus({minutes: 20});
				
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
			cron.schedule(`${scheduledTime.second} ${scheduledTime.minute} ${scheduledTime.hour} ${scheduledTime.day} ${scheduledTime.month} ${scheduledTime.weekday}`,()=>{
				sendEMail(mailOptions30);
			}, {
				scheduled: true,
				timezone: "CAT"
			} );
		} catch (error) {
			console.error(error);
		};
				
		try {
			cron.schedule(`${scheduledTime1.second} ${scheduledTime1.minute} ${scheduledTime1.hour} ${scheduledTime1.day} ${scheduledTime1.month} ${scheduledTime1.weekday}`,()=>{
				sendEMail(mailOptions10);
			} , {
				scheduled: true,
				timezone: "CAT"
			});
		} catch (error) {
			console.error(error);
		}
			res.status(200).json('Qr code sent');
		})
		}
	});
// _________________________________________sending bookings______________________________
app.get('/api/bookings', async (req, res) => {
		const rows= await process.postgresql.query('SELECT * FROM booking;');
		res.json(rows);
  });

// _________________________________________sending bookings of current day______________________________
app.get('/api/bookings/today', async (req, res) => {
		const today=DateTime.now().toFormat("yyyy-MM-dd");
		const time= DateTime.now().toLocaleString(DateTime.TIME_24_SIMPLE);
		let data=[];
		try {
			const rows= await process.postgresql.query('SELECT * FROM booking;');

		for (let index = 0; index < rows.length; index++) {
			const element = rows[index];
			if( today < element.date && time < element.checked_in){
				data.push(element);

			}
		}
		res.json(data);
		} catch (error) {
			console.error(error);
		}
		
	});

//___________________________________ Sending a single booking ________________________________________________
app.get('/api/bookings/:id', validators.checkIfIdIsInt(),async (req, res) => {
	const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(400).json({
					success: false,
					errors: errors.array()
				});
			}
		else{
		const pk=req.params['id'];
		try {

			const rows = await process.postgresql.query('SELECT * FROM booking WHERE id=$1', [pk]);
		res.json(rows);
			
		} catch (error) {
			console.error(error);
		}
		}	
	});

	   //___________________________________ Deleting a single booking ________________________________________________
 app.delete('/api/bookings/delete/:id',validators.checkIfIdIsInt(), async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
					return res.status(400).json({
						success: false,
						errors: errors.array()
					});
				}
			else{
				const pk=req.params['id'];
				try {
					await process.postgresql.query('DELETE FROM "booking" WHERE "id" = $1', [pk]);
				res.json('Record deleted');
					
				} catch (error) {
					console.error(error);
				}
			}
		});

// ___________________________________________pdf________________________________________________________________
let doc = new PDFDocument({ margin: 30, size: 'A4' });

app.get('/api/pdf/visits', async(req,res)=>{
	const rows = await process.postgresql.query('SELECT * FROM register');
	const name= new Date().toLocaleDateString();
	  try {
		doc.table(tableVisits, {
			prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
			prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
			  doc.font("Helvetica").fontSize(8);
			  indexColumn === 0 && doc.addBackground(rectRow, 'blue', 0.15);
			},
		  });
	
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

app.get('/api/pdf/visits/host/:host', async(req,res)=>{
		const host= req.params.host;
		const rows = await process.postgresql.query('SELECT * FROM register WHERE host_id=$1',[host]);
		const name= new Date().toLocaleDateString();
		  // the magic
		  doc.table(tableVisits, {
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
	

// ____________________________________________pdf for current day's visits_____________________________

app.get('/api/pdf/visits/today', async(req,res)=>{
		res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" );
		const name= new Date().toLocaleDateString();
		try {
			const rows = await process.postgresql.query('SELECT * FROM register WHERE date=$1',[name]);
		  doc.table(tableVisits, {
			prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
			prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
			  doc.font("Helvetica").fontSize(8);
			  indexColumn === 0 && doc.addBackground(rectRow, 'blue', 0.15);
			},
		  });

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

// ________________________________________________________________pdf of visits by date______________________________________________
app.get('/api/pdf/visits/date', async(req,res)=>{
			const name= new Date().toLocaleDateString();
			const date= req.query.date;
			try {
				const rows = await process.postgresql.query('SELECT * FROM register WHERE date=$1',[date]);
			  doc.table(tableVisits, {
				prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
				prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
				  doc.font("Helvetica").fontSize(8);
				  indexColumn === 0 && doc.addBackground(rectRow, 'blue', 0.15);
				},
			  });
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
		const rows = await process.postgresql.query('SELECT * FROM visitors');
		const name= new Date().toLocaleDateString();
		  doc.table(tableVisitors, {
			prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
			prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
			  doc.font("Helvetica").fontSize(8);
			  indexColumn === 0 && doc.addBackground(rectRow, 'blue', 0.15);
			},
		  });

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
			const rows = await process.postgresql.query('SELECT * FROM hosts');
			const name= new Date().toLocaleDateString();
			
			  doc.table(tableHosts, {
				prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
				prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
				  doc.font("Helvetica").fontSize(8);
				  indexColumn === 0 && doc.addBackground(rectRow, 'blue', 0.15);
				},
			  });
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
		const records = await process.postgresql.query('SELECT * FROM hosts');
		csvWriterHost.writeRecords(records)       // returns a promise
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

//_____________________________________________csv visitors_________________________________________
  
app.get('/api/csv/visitors', async (req, res) => {
		const name= new Date().toLocaleDateString();
		const records = await process.postgresql.query('SELECT * FROM visitors');
		
		csvWriterVisitor.writeRecords(records)       // returns a promise
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

//_____________________________________________csv visits__________________________________________
app.get('/api/csv/visits', async (req, res) => {
		const name= new Date().toLocaleDateString();
		const records = await process.postgresql.query('SELECT * FROM register');
		
		csvWriterVisits.writeRecords(records)       // returns a promise
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
	});

//__________________________csv visits for current day___________________________________________________

app.get('/api/csv/visits/today', async (req, res) => {
		const date= req.params.date;
		try {
			const name= new Date().toLocaleDateString();
			const records = await process.postgresql.query('SELECT * FROM register WHERE date=$1',[name]);
			
			csvWriterVisits.writeRecords(records)       // returns a promise
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

	});

//___________________________________________________csv visits by date_______________________________________________________________________-
app.get('/api/csv/visits/date', async (req, res) => {
		const date= req.query.date;
		// https://vmsapi1.herokuapp.com/api/csv/visits/date?date=6%2F27%2F2022
		try {
		const name= new Date().toLocaleDateString();
		const records = await process.postgresql.query('SELECT * FROM register WHERE date=$1',[date]);
			
		csvWriterVisits.writeRecords(records)       // returns a promise
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
		});
		

//_________________________________________________________csv visits by host__________________________________________________________________
app.get('/api/csv/visits/host/:host', async (req, res) => {
	const host= req.params.host;
	try {
	const name= new Date().toLocaleDateString();
	const records = await process.postgresql.query('SELECT * FROM register WHERE host_id=$1',[host]);
	 
	csvWriterVisits.writeRecords(records)       // returns a promise
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

  });

//______________________________________________upload csv______________________________________________

var upload = multer({
	dest: __dirname +'/uploads/',
    rename: function (fieldname, filename) {
		filename= 'file';
            return filename;
	}
});

app.post('/uploadfiles', upload.single("file"), async (req, res) =>{
	console.log(req);
	try {
	UploadCsvDataToMyDatabase(__dirname +'/uploads/'+req.file.filename);
	console.log(req.file.filename);
	console.log(req.body);
    console.log('CSV file data has been uploaded in database ');
	res.status(200).json('Hosts added');
	} catch (error) {
		console.error(error);
	}
    
});
	
let UploadCsvDataToMyDatabase= (filePath)=>{
	let stream = fs.createReadStream(filePath);
    let csvData = [];
	let emails=[];
    let csvStream = fastcsv
        .parse()
        .on("data", function (data) {
            csvData.push(data);
        })
        .on("end", async () => {
            csvData.shift();
			console.log(csvData);
			
  
            let rows= await process.postgresql.query(`SELECT * FROM hosts;`); 
			console.log(rows);
			rows.forEach(item =>{
				emails.push(item.email_id);
				console.log(item)
			});
			console.log(emails);

			let query =   "INSERT INTO hosts ( name, email_id, mobile_no, department,password) VALUES ($1, $2, $3, $4,$5)";
			try {
				csvData.forEach(row => {
					let check= emails.includes(row[2]);
					if(check){console.log("Email already exits in database")}
					else{
					if(row.length != 0){
					let pass=crypto.randomBytes(8).toString('hex');
					process.postgresql.query(query, [row[1],row[2], row[3],row[4],pass]);

					let htmlBody = "Your new login information : \n"; 
		htmlBody += "Email : " + row[2] + " \n " + "\n" + 
		" password : " +pass ;
	  
		
		var mailOptions =  
		{
		  from: process.env.EMAIL,
		  to: row[2],
		  subject: "Login information.",
		  html: htmlBody,
		};
	sendEMail(mailOptions)
		}
				}	});
			  }
			  catch(error){
				console.error(error);
			  };

        });
  
    stream.pipe(csvStream);
	
};

app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).send('Something broke!')
  })

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});