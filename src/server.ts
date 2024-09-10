import express, { Request, Response, NextFunction } from "express"
import {
  EXAMPLE_CONTRACT_ABI,
  EXAMPLE_CONTRACT_ADDRESS,
  MESSAGE_TO_SIGN,
  PORT,
} from "./constants"
import {
  initializeCapsule,
  createOrGetPregenWallet,
  createViemClient,
  createAlchemyClient,
} from "./clients"
import { encodeFunctionData } from "viem"
import {
  BatchUserOperationCallData,
  SendUserOperationResult,
} from "@alchemy/aa-core"

const app = express()
app.use(express.json())

app.post("/", async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email: string }

    if (!email) {
      return res.status(400).json({ error: "Email is required" })
    }

    const capsuleClient = await initializeCapsule()

    // Create or get pregen wallet. If a userShare exists it will set it on the capsule
    const wallet = await createOrGetPregenWallet(capsuleClient, email)

    console.log("Capsule Pregen Wallet:", wallet)

    if (!wallet) {
      return res.status(500).json({ error: "Failed to create wallet" })
    }

    const viemClient = await createViemClient(capsuleClient)

    console.log("Creating alchemy client")

    const alchemyClient = await createAlchemyClient(viemClient)

    const userOperations: BatchUserOperationCallData = [1, 2, 3, 4, 5].map(
      (x) => {
        return {
          target: EXAMPLE_CONTRACT_ADDRESS,
          data: encodeFunctionData({
            abi: EXAMPLE_CONTRACT_ABI,
            functionName: "changeX",
            args: [x],
          }),
        }
      }
    )

    console.log("Sending user operations")

    const userOperationResult: SendUserOperationResult =
      await alchemyClient.sendUserOperation({
        uo: userOperations,
      })

    console.log(
      "User operation result hash:",
      JSON.stringify(userOperationResult)
    )

    res.json({
      address: wallet.address,
      userOperationResult,
    })
  } catch (error) {
    res.status(500).json({ error: JSON.stringify(error) })
  }
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err)
  res.status(500).send({
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  })
})

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
})
