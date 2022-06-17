// DROP TABLE IF EXISTS register;


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