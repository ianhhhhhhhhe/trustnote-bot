CREATE TABLE faucet_payouts (
	payout_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	device_address CHAR(33) NOT NULL,
	amount BIGINT NOT NULL,
	asset CHAR(44) NULL REFERENCES assets(unit),
	address CHAR(32) NOT NULL,
	creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX faucetByDeviceAddressDate ON faucet_payouts(device_address, creation_date);

CREATE TABLE lockups (
	from_address CHAR(33) NOT NULL,
	address CHAR(32) NOT NULL,
	amount INTEGER NOT NULL,
	term INTEGER NOT NULL,
	shared_address CHAR(32) NULL,
	sent INTEGER NULL
);

CREATE TABLE used_commission (
	units_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	unit CHAR(44) NOT NULL
);