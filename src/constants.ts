import dotenv from "dotenv"
import { Environment } from "@usecapsule/server-sdk"
import Example from "../artifacts/Example.json"

dotenv.config()

// Helper function to get environment variables
function getEnvVariable(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`)
  }
  return value
}

// Server configuration
export const PORT = process.env.PORT || 3000

// Capsule configuration
export const CAPSULE_API_KEY = getEnvVariable("CAPSULE_API_KEY")
export const CAPSULE_ENVIRONMENT = Environment.DEVELOPMENT

// Alchemy configuration. Please see https://dashboard.alchemy.com/ for your API key and gas policy ID
export const ALCHEMY_API_KEY = getEnvVariable("ALCHEMY_API_KEY")
export const ALCHEMY_GAS_POLICY_ID = getEnvVariable("ALCHEMY_GAS_POLICY_ID")
export const ALCHEMY_RPC_URL = `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
export const EXAMPLE_CONTRACT_ADDRESS =
  "0x7920b6d8b07f0b9a3b96f238c64e022278db1419"

export const EXAMPLE_CONTRACT_ABI =
  Example["contracts"]["contracts/Example.sol:Example"]["abi"]

export const MESSAGE_TO_SIGN = "Hello, world!"

export const PRIVATE_KEY = getEnvVariable("PRIVATE_KEY")
