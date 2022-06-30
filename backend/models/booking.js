// DROP TABLE IF EXISTS booking;


const createbooking =`
CREATE TABLE IF NOT EXISTS booking(
	id SERIAL NOT NULL PRIMARY KEY,
	visitor_name TEXT NOT NULL,
	visitor_email TEXT NOT NULL,
	visitor_no INT DEFAULT NULL,
	host_name TEXT DEFAULT NULL,
	date TEXT NOT NULL,
	checked_in TEXT NOT NULL,
	role TEXT NOT NULL
);
`;