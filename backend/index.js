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

const vonage = new Vonage({
  apiKey: config.vonage.apiKey,
  apiSecret:config.vonage.apiSecret
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
	secure: false,
	requireTLS: true,
	auth: {
	  user: config.email_setting.email,
	  pass: config.email_setting.password,
	},
  });
  


const app = express();
const path = require('path');
// const router = express.Router();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public",express.static(__dirname+'/public'));



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

app.get("/", (req, res) => {
	res.sendFile(__dirname+'/index.html');
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


//___________________________________ registering a host ________________________________________________
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
		if (result){let htmlBody = "Your new login information : \n";                     // Preparing Msg for sending Mail to the expected visitor of the Meeting 
		htmlBody += "Email : " + host.email_id + " \n " + "\n" + 
		" password : " +host.password ;
	  
		
		var mailOptions =                                                   // Step 2 - Setting Mail Options of Nodemailer
		{
		  from: config.email_setting.email,
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
	const to =`250${host.mobile_no}`;
	const text =` Your new login information
	Email: ${host.email_id} 
	   Password: ${host.password}
	  `;
	
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
	});};
	});

	
	 res.status(200).send('Host registered!');

	
  });

  //___________________________________ editing a host ________________________________________________
app.put('/api/hosts/:id', async (req, res) => {
	const pk=req.params['id'];
	const host = {
		name: req.body.name,
		email_id: req.body.email_id,
		mobile_no: req.body.mobile_no
	}
	 await process.postgresql.query('UPDATE "hosts" SET "name" = $1, "email_id" = $2, "mobile_no" = $3 WHERE id=$4', [host.name,host.email_id,host.mobile_no,pk]).then((err,result) => {
		if (err) throw err;
	});
	 res.status(200).send(JSON.stringify('Host edited!'));

	
  });

  //___________________________________ editing a host password ________________________________________________
  app.patch('/api/hosts/:id', async (req, res) => {
	const pk=req.params['id'];
	const host = {
		password:req.body.password
	}
	 await process.postgresql.query('UPDATE "hosts" SET "password" = $1 WHERE id=$2', [host.passsword,pk]).then((err,result) => {
		if (err) throw err;
	});
	 res.status(200).send(JSON.stringify('Password changed'));

	
  });
   //___________________________________ Deleting a single host ________________________________________________
 app.delete('/api/hosts/:id', async (req, res) => {
	const pk=req.params['id'];
	await process.postgresql.query('DELETE FROM "hosts" WHERE "id" = $1', [pk]);
	res.json('Host deleted');
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
	 res.status(200).send(JSON.stringify('Visitor registered!'));

	
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
		res.status(200).send(JSON.stringify('Visitor updated!'));
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
	res.status(200).json(rows);
  });

    //___________________________________ sending visits by date ________________________________________________
	app.get('/api/date/visits/:date', async (req, res) => {
		const date=req.params['date'];
		const rows = await process.postgresql.query('SELECT * FROM register WHERE date=$1', [date]);
	
		res.status(200).json(rows);
	  });

    //___________________________________ sending active visitors ________________________________________________
	app.get('/api/active/visits', async (req, res) => {
		// const date=req.params['date'];
		const checked_out="null";
		const rows = await process.postgresql.query('SELECT * FROM register WHERE checked_out=$1', [checked_out]);
	
		res.status(200).json(rows);
	  });

//___________________________________ registering a visit ________________________________________________
app.post('/api/visits', async (req, res) => {
	const checked_in= new Date();
	const checkin_date= checked_in.toLocaleDateString();
	const checkin_time= checked_in.toLocaleTimeString();
	const visit = {
		host_id: req.body.host_id,
		host_name: req.body.host_name,
		visitor_name: req.body.visitor_name,
		visitor_email: req.body.email,
		visitor_no: req.body.visitor_no,
		date:checkin_date,
		checked_in: checkin_time,
		checked_out:null,
		role: req.body.role
		
	};

	const visitor = await process.postgresql.query('SELECT * FROM visitors WHERE name=$1 AND email_id=$2' , [visit.visitor_name, visit.visitor_email]);
	if(!visitor){
		await process.postgresql.query(`INSERT INTO visitors (name, email_id, mobile_no) VALUES ('${visit.visitor_name}', '${visit.visitor_email}', '${visit.visitor_no}') ON CONFLICT DO NOTHING;`);
	}
	await process.postgresql.query(`INSERT INTO register (host_id,host_name,visitor_name, visitor_email, visitor_no,date,checked_in,checked_out, role) VALUES ('${visit.host_id}', '${visit.host_name}','${visit.visitor_name}','${visit.visitor_email}','${visit.visitor_no}','${visit.date}','${visit.checked_in}','${visit.checked_out}', '${visit.role}') ON CONFLICT DO NOTHING;`);
	const host=  await process.postgresql.query('SELECT * FROM hosts WHERE id=$1' , [visit.host_id]); 
	let htmlBody = "New visitor information : \n";                     // Preparing Msg for sending Mail to the expected visitor of the Meeting 
        htmlBody += "Name : " + visit.visitor_name + " \n " + "\n" + 
        " Email : " + visit.visitor_email + " \n " + "\n" +
        "Mobile Number : " +visit.visitor_no + " \n " + "\n" +
        " Check In Time :" +visit.checked_in;
      
        
        var mailOptions =                                                   // Step 2 - Setting Mail Options of Nodemailer
        {
          from: config.email_setting.email,
          to: host.email,
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
app.put('/api/visits/:id', async (req, res) => {
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
	 res.status(200).send(JSON.stringify('Visit edited'));

	
  });

  //___________________________________ Editing a visit checkout ________________________________________________
app.patch('/api/visits/checkout/:id', async (req, res) => {
	const pk=req.params['id'];
	const checkout= new Date();
	const checkout_time= checkout.toLocaleTimeString();
	const visit = {
		checked_out: checkout_time,
	}
	await process.postgresql.query('UPDATE "register" SET "checked_out"=$1  WHERE id=$2', [visit.checked_out,pk]).then((err,result) => {
		if (err) throw err;
	});
	 res.status(200).send(JSON.stringify('Checked out'));

	
  });

     //___________________________________ Sending a single visit ________________________________________________
	 app.get('/api/visits/:id', async (req, res) => {
		const pk=req.params['id'];
		const rows = await process.postgresql.query('SELECT * FROM register WHERE id=$1', [pk]);
		res.json(rows);
	  });
	
		 //___________________________________ Sending a visit by date and time ________________________________________________
		 app.get('/api/visits/:date/:time', async (req, res) => {
			const date=req.params['date'];
			const time= req.params['time'];
	
			const rows = await process.postgresql.query('SELECT * FROM register WHERE date=$1 AND checked_in=$2', [date, time]);
			res.json(rows);
		  });
	
	
	
	  
	   //___________________________________ Deleting a single visit ________________________________________________
	 app.delete('/api/visits/:id', async (req, res) => {
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
		 res.status(200).send(JSON.stringify('User registered'))
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


  


//___________________________________ QRCODE ________________________________________________


//___________________________________ generating qrcode ________________________________________________
  app.post('/qrgenerate', async(req,res) => {
	// openssl('openssl req -config csr.cnf -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout key.key -out certificate.crt');
	const visitor = {
		name: req.body.name,
		email_id: req.body.email_id,
		date:req.body.date,
		time: req.body.time,
		mobile_no: req.body.mobile_no
	};

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
          from: config.email_setting.email,
          to: visitor.email_id,
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


	res.status(200).json('Qr code sent')

	
})

  });

// ___________________________________________pdf________________________________________________________________
app.get('/api/pdf/visits', async(req,res)=>{
	const rows = await process.postgresql.query('SELECT * FROM register');
	let doc = new PDFDocument({ margin: 30, size: 'A4' });
	const table = {
		title: "Visits",
		subtitle: "visitors report",
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
	const name= new Date().toLocaleDateString();
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
	const rows = await process.postgresql.query('SELECT * FROM hosts');
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

  app.get('/api/csv/visitors', async (req, res) => {
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


  app.get('/api/csv/visits', async (req, res) => {
	// const rows = await process.postgresql.query('SELECT * FROM register');
	const name= new Date().toLocaleDateString();
	const csvWriter = createCsvWriter({
		path:__dirname+`/public/${name}visits.csv`,
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

	const src = fs.createReadStream(__dirname+`/public/${name}visits.csv`);
	
	res.writeHead(200, {
		'Content-Type': 'application/csv',
		'Content-Disposition': `attachment; filename= ${name} report.csv`,
		'Content-Transfer-Encoding': 'Binary'
	  });
	
	  src.pipe(res); 
	//   res.send(Buffer.from(records));
  });
	


 




//   app.get("/", (req, res) => {
// 	res.sendFile('../views/index.html')
//   });

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});