//  ____________________________Database___________________________
const { Client } = require('pg');


const client = new Client({
    host: '127.0.0.1',
    user: 'Bella',
    database: 'app',
    password: 'bellamava',
    port: 5432,
});

const execute = async (query) => {
    try {
        await client.connect();     // gets connection
        await client.query(query);  // sends queries
        return true;
    } catch (error) {
        console.error(error.stack);
        return false;
    } finally {
        await client.end();         // closes connection
    }
};

const createregister =`
CREATE TABLE IF NOT EXISTS register(
	id SERIAL NOT NULL PRIMARY KEY,
    host_id INT DEFAULT NULL,
	host_name TEXT DEFAULT NULL,
	visitor_name TEXT NOT NULL,
	visitor_email TEXT NOT NULL,
	visitor_no INT DEFAULT NULL,
	date TEXT NOT NULL,
	checked_in TEXT NOT NULL,
 	checked_out TEXT ,
	role TEXT NOT NULL
)
`;

// const createhost = `
//     CREATE TABLE IF NOT EXISTS hosts (
// 		id  SERIAL NOT NULL PRIMARY KEY,
// 		name TEXT NOT NULL,
// 		email_id TEXT NOT NULL, 
// 		mobile_no INT DEFAULT NULL,
// 	password TEXT NOT NULL
	    
//     );`;

// const createuser=`CREATE TABLE users (
// 	id SERIAL PRIMARY KEY,
// 	email TEXT NOT NULL UNIQUE,
// 	password TEXT NOT NULL
//   );`

// ["1","John Doe","Anny Clyve", "annyclyve@gmail.com","0787695111", "2022-05-05T22:05:06.95","2022-05-05T23:05:06.95","Utility worker","1"]
// const check_in="18:35:13.97";
// const pk=2;
// const text1=`
// UPDATE register SET host_id =1, host_name =John Doe, visitor_name ="Anny Clyve", visitor_email = "annyclyve@gmail.com", visitor_no = "0787695111", checked_in="2022-05-05T22:05:06.95", checked_out="2022-05-05T23:05:06.95", role="Utility worker" WHERE id='${pk}'`;

// const visit= {
//      host_id: parseInt(process.argv[2]),
// 	 host_name: process.argv[3],
//      visitor_name: process.argv[4],
// 	 visitor_email: process.argv[5],
// 	 visitor_no: parseInt(process.argv[6]),
// 	 checked_in: process.argv[7],
// 	 checked_out: process.argv[8],
// 	 role: process.argv[9]
// };
// const pk=2;
// console.log(visit);
// const delet = `DELETE FROM "register" WHERE "id" = 1;`;
// const up=`'UPDATE "register" SET "host_id" = $1, "host_name" = $2, "visitor_name" = $3, "visitor_email" = $4, "visitor_no" = $5, "checked_in"= $6, "checked_out"=$7, "role"=$8  WHERE id=$9', ['${visit.host_id}','${visit.host_name}','${visit.visitor_name}','${visit.visitor_email}','${visit.visitor_no}', '${visit.checked_in}','${visit.checked_out}','${visit.role}','${pk}'];`;

// const up1=`UPDATE "register" SET "host_id" = '${visit.host_id}', "host_name" = '${visit.host_name}', "visitor_name" ='${visit.visitor_name}', "visitor_email" ='${visit.visitor_email}', "visitor_no" ='${visit.visitor_no}', "checked_in"= '${visit.checked_in}', "checked_out"='${visit.checked_out}', "role"='${visit.role}'  WHERE id='${pk}';`;

// const text=`INSERT INTO register (host_id,host_name,visitor_name, visitor_email, visitor_no, role) VALUES ('${visit.host_id}', '${visit.host_name}','${visit.visitor_name}','${visit.visitor_email}','${visit.visitor_no}', '${visit.role}') ON CONFLICT DO NOTHING;`;
execute(createregister).then(result => {
		if (result) {
			console.log('Table created');
			console.log(result);
		}
	});


// _____________________________________________seeding and creation______________________________
	// await connection.query('CREATE TABLE IF NOT EXISTS books (id bigserial primary key, title text, author text);');
	// await connection.query('CREATE UNIQUE INDEX IF NOT EXISTS title ON books (title);');
    // await connection.query('CREATE TABLE IF NOT EXISTS visitors (id bigserial primary key, name text,email_id text, checkin datetime,checkout datetime,mobile_no bigint(20));');
	// await connection.query('CREATE UNIQUE INDEX IF NOT EXISTS title ON books (title);');
	// const books = [
	//   { title: 'Mastering the Lightning Network', author: 'Andreas Antonopoulos' },
	//   { title: 'Load Balancing with HAProxy', author: 'Nick Ramirez' },
	//   { title: 'Silent Weapons for Quiet Wars', author: 'Unknown' },
	// ];
  
	// for (let i = 0; i < books.length; i += 1) {
	//   const book = books[i];
	//   await connection.query(`INSERT INTO books (title, author) VALUES ('${book.title}', '${book.author}') ON CONFLICT DO NOTHING;`);
	// };
	// const hosts=[
	// 	{ name: 'John Doe', email_id: 'tuyisenge1109@gmail.com',mobile_no: '0787695111' },
	// 	{ name: 'Jane Dae', email_id: 'tuyisenge1109@gmail.com',mobile_no: '0787695111' },
	// 	{ name: 'Chrissy Cole', email_id: 'tuyisenge1109@gmail.com',mobile_no: '0787695111' },
	// 	{ name: 'Sylvia Mane', email_id: 'tuyisenge1109@gmail.com',mobile_no: '0787695111' },
	// ];
	// for (let i = 0; i < hosts.length; i += 1) {
	// 	const host = hosts[i];
		// await connection.query(`INSERT INTO hosts (name, email_id,mobile_no) VALUES ('${host.name}', '${host.email_id}', '${host.mobile_no}') ON CONFLICT DO NOTHING;`);
		
	//   }
  
	// console.log('PostgreSQL database seeded!');

	// const hosts=[
// 	{ name: 'John Doe', email_id: 'tuyisenge1109@gmail.com',mobile_no: '0787695111' },
// 	{ name: 'Jane Dae', email_id: 'tuyisenge1109@gmail.com',mobile_no: '0787695111' },
// 	{ name: 'Chrissy Cole', email_id: 'tuyisenge1109@gmail.com',mobile_no: '0787695111' },
// 	{ name: 'Sylvia Mane', email_id: 'tuyisenge1109@gmail.com',mobile_no: '0787695111' },
// ];




// const insertinto= `INSERT INTO hosts (name, email_id,mobile_no) VALUES ('${host.name}', '${host.email_id}', '${host.mobile_no}') ON CONFLICT DO NOTHING;`;

// for (let i = 0; i < hosts.length; i += 1) {
// 	const host = hosts[i];
// 	execute(`INSERT INTO hosts (name, email_id,mobile_no) VALUES ('${host.name}', '${host.email_id}', '${host.mobile_no}') ON CONFLICT DO NOTHING;`).then(result => {
// 		if (result) {
// 			console.log('Hosts entered');
// 		}
// 	});
//   }

// ____________________________________________CSV fastcsv_______________________________________________


//   app.get('/hosts', async (req, res) => {
// 	const rows = await process.postgresql.query('SELECT * FROM hosts');
// 	const ws= fs.createWriteStream(__dirname+'/public/report.csv');
// 	fastcsv.write(rows,{headers: true})
// 	.on('finish', function(){
// 		res.status(200).send("<a href='/public/report.csv' id='download_link' download='report.csv'></a><script>document.getElementById('download_link').click();</script>");
// 	})
// 	.pipe(ws);
	 
	
	
//   });




// _____________________________________visits csv download________________________
// app.get('/visits/csv', async (req, res) => {
// 	const rows = await process.postgresql.query('SELECT id, host_name, visitor_name, visitor_email, visitor_no, date, checked_in,checked_out,role FROM register');
// 	const csvWriter = createCsvWriter({
// 		path:__dirname+'/public/report.csv',
// 		header: [
// 			{id: 'id', title: 'ID'},
// 			{id: 'host_name', title: 'HOST NAME'},
// 			{id: 'visitor_name', title: 'VISITOR NAME'},
// 			{id: 'visitor_email', title: 'VISITOR EMAIL'},
// 			{id: 'visitor_no', title: 'VISITOR NUMBER'},
// 			{id: 'date', title: 'DATE'},
// 			{id: 'checked_in', title: 'CHECK IN'},
// 			{id: 'checked_out', title: 'CHECK OUT'},
// 			{id: 'role', title: 'VISIT REASON'}
			
// 		]
// 	});
	 
// 	// const records = await process.postgresql.query('SELECT * FROM hosts');
	 
// 	csvWriter.writeRecords(rows)       // returns a promise
// 		.then(() => {
// 			console.log('...Done');
// 		});
// 	res.status(200).send("<a href='/public/report.csv' id='download_link' download='report.csv'></a><script>document.getElementById('download_link').click();</script>");
//   });

// app.post('/hosts', async (req, res) => {
// 	const rows = await process.postgresql.query('SELECT * FROM hosts');
// 	const csvWriter = createCsvWriter({
// 		path:__dirname+'/public/hosts.csv',
// 		header: [
// 			{id: 'id', title: 'ID'},
// 			{id: 'name', title: 'NAME'},
// 			{id: 'email', title: 'EMAIL'},
// 			{id: 'mobile_no', title: 'PHONE NUMBER'}
// 		]
// 	});
	 
// 	const records = await process.postgresql.query('SELECT * FROM hosts');
	 
// 	csvWriter.writeRecords(records)       // returns a promise
// 		.then(() => {
// 			console.log('...Done');
// 		});

// 	const src = fs.createReadStream(__dirname+'/public/hosts.csv');
// 	const name= new Date().toLocaleDateString();
// 	res.writeHead(200, {
// 		'Content-Type': 'application/pdf',
// 		'Content-Disposition': `attachment; filename= ${name} report.pdf`,
// 		'Content-Transfer-Encoding': 'Binary'
// 	  });
	
// 	  src.pipe(res); 
//   });

// axios.get(url, {
// 	responseType: 'arraybuffer',
// 	headers: {
// 		Accept: 'application/pdf',
// 	},
//   });


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


