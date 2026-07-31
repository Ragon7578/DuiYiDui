import path from "node:path"
import { backupDatabase, checkDbHealth, getDbStats } from "./maintenance.js"

const cmd = process.argv[2]
const arg = process.argv[3]

async function main() {
  switch (cmd) {
    case "backup": {
      const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "Z")
      const root = path.resolve(__dirname, "..", "..", "..", "..")
      const defaultDir = process.env.BACKUP_DIR || path.join(root, "backups")
      const out = arg || path.join(defaultDir, `contract-spirit-${stamp}.db`)
      const dest = backupDatabase(out)
      console.log(`[db:backup] ${dest}`)
      break
    }
    case "verify": {
      const h = checkDbHealth()
      console.log(JSON.stringify(h, null, 2))
      if (!h.ok) process.exit(1)
      break
    }
    case "stats": {
      console.log(JSON.stringify(getDbStats(), null, 2))
      break
    }
    default:
      console.error("用法: tsx maintenance-cli.ts backup [path] | verify | stats")
      process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
