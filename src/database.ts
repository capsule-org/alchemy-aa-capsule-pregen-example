import { promises as fs } from "fs"

const DB_FILE = "user_shares.json"

interface UserShares {
  [email: string]: string
}

async function readDatabase(): Promise<UserShares> {
  try {
    const data = await fs.readFile(DB_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {}
    }
    throw error
  }
}

async function writeDatabase(data: UserShares): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf8")
}

export async function storeUserShare(
  email: string,
  userShare: string
): Promise<void> {
  const db = await readDatabase()
  db[email] = userShare
  await writeDatabase(db)
}

export async function getUserShareFromDatabase(
  email: string
): Promise<string | null> {
  const db = await readDatabase()
  return db[email] || null
}

// Initialize the database file if it doesn't exist
async function initializeDatabase(): Promise<void> {
  try {
    await fs.access(DB_FILE)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await writeDatabase({})
    } else {
      throw error
    }
  }
}

// Initialize the database when the module is imported
initializeDatabase().catch(console.error)
