import { rmSync } from "node:fs";

rmSync("data/local-db.json", { force: true });
rmSync("data/uploads", { recursive: true, force: true });
console.log("Local database and uploads removed. The next app start creates a fresh sample database.");
