CREATE TABLE user_status (
	from_address CHAR(33) NOT NULL,  -- 设备地址
	address CHAR(32) NOT NULL,  -- 用户签名地址
	amount INTEGER NOT NULL,  -- 用户购买金额
	lockupId INTEGER NOT NULL,  -- 产品ID
	shared_address CHAR(32) NULL,  -- 用户合约地址
	sent INTEGER NULL,  -- 是否已发送地址合约地址
	PRIMARY KEY(from_address, lockupId)
);

CREATE TABLE lockups (
	financialBenefitsId INTEGER NOT NULL PRIMARY KEY, -- 产品ID
	productName CHAR(32) NULL,  -- 产品名称
	activityStatus CHAR(32) NOT NULL,  -- 产品状态
	financialId INTEGER NOT NULL,  -- 套餐ID：7天/30天/90天/···
	financialRate INTEGER NOT NULL,  -- 利率
	financialStatus INTEGER NOT NULL,  -- 已/未发收益
	interestStartTime INTEGER NOT NULL,  -- 计息开始时间
	interestEndTime INTEGER NOT NULL,  -- 计息结束时间
	minAmount INTEGER NOT NULL,  -- 起购金额
	purchaseLimit INTEGER NULL,  -- 限购金额
	panicStartTime INTEGER NOT NULL,  -- 活动开始时间
	panicEndTime INTEGER NOT NULL,  -- 活动结束时间
	nextPanicStartTime INTEGER NULL,  -- 下期活动开始时间
	nextPanicEndTime INTEGER NULL,  -- 下期活动结束时间
	panicTotalLimit INTEGER NOT NULL,  -- 抢购总额度
	remainLimit INTEGER NULL,  -- 剩余额度
	unlockTime INTEGER NOT NULL  -- 解锁时间
);