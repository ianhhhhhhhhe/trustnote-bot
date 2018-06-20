CREATE TABLE user_status (
	from_address CHAR(33) NOT NULL,
	address CHAR(32) NOT NULL,
	amount INTEGER NOT NULL,
	lockupId INTEGER NOT NULL,
	shared_address CHAR(32) NULL,
	sent INTEGER NULL,
	PRIMARY KEY(from_address, lockupId)
);

CREATE TABLE lockups (
	financialBenefitsId INTEGER NOT NULL PRIMARY KEY,
	activityStatus CHAR(32) NOT NULL,
	financialId INTEGER NOT NULL,
	financialRate INTEGER NOT NULL,
	financialStatus INTEGER NOT NULL,
	interestEndTime INTEGER NOT NULL,
	interestStartTime INTEGER NOT NULL,
	minAmount INTEGER NOT NULL,
	nextPanicEndTime INTEGER NULL,
	nextPanicStartTime INTEGER NULL,
	panicEndTime INTEGER NOT NULL,
	panicStartTime INTEGER NOT NULL,
	panicTotalLimit INTEGER NOT NULL,
	productName CHAR(32) NULL,
	purchaseLimit INTEGER NULL,
	remainLimit INTEGER NULL,
	unlockTime INTEGER NOT NULL
);