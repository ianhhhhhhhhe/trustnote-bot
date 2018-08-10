CREATE TABLE user_status (
	from_address CHAR(33) NOT NULL,
	address CHAR(32) NOT NULL,
	amount INTEGER NOT NULL,
	lockupId INTEGER NOT NULL,
	shared_address CHAR(32) NULL,
	sent INTEGER NULL,
	create_ts INTEGER NULL,
	PRIMARY KEY(from_address, lockupId)
);

CREATE TABLE states (
	from_address CHAR(33) NOT NULL,
	lang CHAR(6) NOT NULL DEFAULT 'en',
	PRIMARY KEY(from_address)
);