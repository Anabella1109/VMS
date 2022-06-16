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

// const createregister =`
// CREATE TABLE IF NOT EXISTS register(
// 	id SERIAL NOT NULL PRIMARY KEY,
//     host_id INT DEFAULT NULL,
// 	host_name TEXT DEFAULT NULL,
// 	visitor_name TEXT NOT NULL,
// 	visitor_email TEXT NOT NULL,
// 	visitor_no INT DEFAULT NULL,
// 	checked_in TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
//  	checked_out TIMESTAMPTZ ,
// 	role TEXT NOT NULL
// )
// `;

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
execute(createhost).then(result => {
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