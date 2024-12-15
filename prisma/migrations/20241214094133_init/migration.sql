-- CreateTable
CREATE TABLE "Deposit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ActiveOrders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "price" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "expirationTimestamp" INTEGER NOT NULL,
    "owner" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MatchedOrders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "price" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "expirationTimestamp" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "resolver" TEXT NOT NULL,
    "deposit" INTEGER NOT NULL
);
