//  ____________________________Database___________________________

// const client = new Client({
//     host: '127.0.0.1',
//     user: 'Bella',
//     database: 'app',
//     password: 'bellamava',
//     port: 5432,
// });

// const execute = async (query) => {
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

// execute(text).then(result => {
// 		if (result) {
// 			console.log('Table created');
// 		}
// 	});


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
	// 	await connection.query(`INSERT INTO hosts (name, email_id,mobile_no) VALUES ('${host.name}', '${host.email_id}', '${host.mobile_no}') ON CONFLICT DO NOTHING;`);
		
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