// DROP TABLE IF EXITS visitors;

const text = `
    CREATE TABLE IF NOT EXISTS visitors (
		id  SERIAL NOT NULL PRIMARY KEY,
		name TEXT NOT NULL,
		email_id TEXT NOT NULL,
		mobile_no INT DEFAULT NULL
	    
    );`;
