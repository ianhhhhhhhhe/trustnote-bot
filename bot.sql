CREATE TABLE lockups (
	from_address CHAR(33) NOT NULL,
	address CHAR(32) NOT NULL,
	amount INTEGER NOT NULL,
	lockupId INTEGER NOT NULL,
	shared_address CHAR(32) NULL,
	sent INTEGER NULL
);

CREATE TABLE used_commission (
	units_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	unit CHAR(44) NOT NULL
);