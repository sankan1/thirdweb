/*
  Warnings:

  - You are about to alter the column `price` on the `ActiveOrders` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `price` on the `MatchedOrders` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - Added the required column `deposit` to the `ActiveOrders` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActiveOrders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "price" REAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "expirationTimestamp" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "deposit" REAL NOT NULL
);
INSERT INTO "new_ActiveOrders" ("amount", "expirationTimestamp", "id", "owner", "price") SELECT "amount", "expirationTimestamp", "id", "owner", "price" FROM "ActiveOrders";
DROP TABLE "ActiveOrders";
ALTER TABLE "new_ActiveOrders" RENAME TO "ActiveOrders";
CREATE TABLE "new_MatchedOrders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "price" REAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "expirationTimestamp" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "resolver" TEXT NOT NULL,
    "deposit" INTEGER NOT NULL
);
INSERT INTO "new_MatchedOrders" ("amount", "deposit", "expirationTimestamp", "id", "owner", "price", "resolver") SELECT "amount", "deposit", "expirationTimestamp", "id", "owner", "price", "resolver" FROM "MatchedOrders";
DROP TABLE "MatchedOrders";
ALTER TABLE "new_MatchedOrders" RENAME TO "MatchedOrders";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
