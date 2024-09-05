import express, { Request, Response, NextFunction } from "express"
import dotenv from "dotenv"
import {
  Capsule,
  Environment,
  PregenIdentifierType,
  WalletType,
} from "@usecapsule/server-sdk"
import {
  createCapsuleViemClient,
  createCapsuleAccount,
} from "@usecapsule/viem-v2-integration"
import { createModularAccountAlchemyClient } from "@alchemy/aa-alchemy"
import { WalletClientSigner, sepolia } from "@alchemy/aa-core"
import { http, WalletClientConfig } from "viem"

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000

const CAPSULE_API_KEY = process.env.CAPSULE_API_KEY
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY

app.use(express.json())

// Mock functions for database operations
async function storeUserShare(email: string, userShare: string) {
  // TODO: Implement actual database storage
  console.log(`Storing user share for ${email}`)
}

async function getUserShareFromDatabase(email: string): Promise<string | null> {
  // TODO: Implement actual database retrieval
  console.log(`Retrieving user share for ${email}`)
  return null // Simulate no stored share for now
}

app.post("/", async (req: Request, res: Response) => {
  console.log("POST request received")
  try {
    const { email } = req.body
    if (!email) {
      console.log("Email is missing in the request body")
      return res.status(400).json({ error: "Email is required" })
    }
    console.log(`Processing request for email: ${email}`)

    // Initialize Capsule
    console.log("Initializing Capsule")
    const capsule = new Capsule(Environment.DEVELOPMENT, CAPSULE_API_KEY)

    // 1. Create or get pregenerated wallet
    console.log("Checking for existing wallet")
    const hasWallet = await capsule.hasPregenWallet(
      email,
      PregenIdentifierType.EMAIL
    )
    let pregenWallet
    let userShare: string

    if (!hasWallet) {
      console.log("Creating new wallet")
      pregenWallet = await capsule.createWalletPreGen(
        WalletType.EVM,
        email,
        PregenIdentifierType.EMAIL
      )
      userShare = (await capsule.getUserShare()) ?? ""

      await storeUserShare(email, userShare)
    } else {
      console.log("Retrieving existing wallet")
      userShare = (await getUserShareFromDatabase(email)) ?? ""
      if (!userShare) {
        throw new Error("User share not found for existing wallet")
      }
      await capsule.setUserShare(userShare)
      const wallets = await capsule.getPregenWallets(
        email,
        PregenIdentifierType.EMAIL
      )
      pregenWallet = wallets[0]
    }
    console.log(`Wallet ID: ${pregenWallet.id}`)

    const capsuleAccount = createCapsuleAccount(capsule)

    // 2. Create client
    console.log("Creating Viem client config")
    const walletClientConfig: WalletClientConfig = {
      account: capsuleAccount,
      chain: sepolia,
      transport: http(
        `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      ),
    }
    console.log("Creating Viem client")
    const viemClient = createCapsuleViemClient(capsule, walletClientConfig)
    console.log("Creating WalletClientSigner")
    const walletClientSigner = new WalletClientSigner(
      viemClient,
      "capsule" // signerType
    )

    console.log("Creating Alchemy client")
    const accountClient = await createModularAccountAlchemyClient({
      apiKey: ALCHEMY_API_KEY,
      chain: sepolia,
      signer: walletClientSigner,
    })

    // 3. Sign a message
    console.log("Signing message")
    const simpleMessage = "Hello world"
    const simpleSignature = await accountClient.signMessage({
      message: simpleMessage,
    })
    console.log("Message signed successfully")

    // 4. Prepare and send response
    const walletAddress = await walletClientSigner.getAddress()
    console.log(`Wallet address: ${walletAddress}`)
    res.json({
      walletId: pregenWallet.id,
      walletAddress: walletAddress,
      message: simpleMessage,
      signature: simpleSignature,
      status: "Wallet registered and message signed successfully",
    })
    console.log("Response sent successfully")
  } catch (error) {
    console.error("An error occurred:", error)
    res.status(500).json({ error: "An error occurred during registration" })
  }
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "development") {
    console.error(err)
  }
  res.status(500).send({
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  })
})

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
})
