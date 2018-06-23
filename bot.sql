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
	productName CHAR(32) NULL,
	activityStatus CHAR(32) NOT NULL,
	financialId INTEGER NOT NULL,
	financialRate INTEGER NOT NULL,
	financialStatus INTEGER NOT NULL,
	interestStartTime INTEGER NOT NULL,
	interestEndTime INTEGER NOT NULL,
	minAmount INTEGER NOT NULL,
	purchaseLimit INTEGER NULL,
	panicStartTime INTEGER NOT NULL,
	panicEndTime INTEGER NOT NULL,
	nextPanicStartTime INTEGER NULL,
	nextPanicEndTime INTEGER NULL,
	panicTotalLimit INTEGER NOT NULL,
	remainLimit INTEGER NULL,
	unlockTime INTEGER NOT NULL
);