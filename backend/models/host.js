// DROP TABLE IF EXISTS hosts;

	const createhost = `
    CREATE TABLE IF NOT EXISTS hosts (
		id  SERIAL NOT NULL PRIMARY KEY,
		name TEXT NOT NULL,
		email_id TEXT NOT NULL UNIQUE, 
		department TEXT NOT NULL,
		mobile_no INT DEFAULT NULL,
	    password TEXT  

    );`;
	