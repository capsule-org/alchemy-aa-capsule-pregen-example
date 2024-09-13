import {
  Capsule,
  WalletType,
  PregenIdentifierType,
  Wallet,
  hexStringToBase64,
  SuccessfulSignatureRes,
} from "@usecapsule/server-sdk"
import {
  createCapsuleViemClient,
  createCapsuleAccount,
} from "@usecapsule/viem-v2-integration"
import { createModularAccountAlchemyClient } from "@alchemy/aa-alchemy"
import { WalletClientSigner, arbitrumSepolia } from "@alchemy/aa-core"
import {
  http,
  WalletClientConfig,
  WalletClient,
  SignableMessage,
  Hash,
  hashMessage,
} from "viem"
import {
  CAPSULE_API_KEY,
  CAPSULE_ENVIRONMENT,
  ALCHEMY_RPC_URL,
  ALCHEMY_API_KEY,
  ALCHEMY_GAS_POLICY_ID,
} from "./constants"
import { getUserShareFromDatabase, storeUserShare } from "./database"

export async function initializeCapsule() {
  return new Capsule(CAPSULE_ENVIRONMENT, CAPSULE_API_KEY)
}

export async function createOrGetPregenWallet(
  capsule: Capsule,
  email: string
): Promise<Wallet | undefined> {
  const hasWallet = await capsule.hasPregenWallet(
    email,
    PregenIdentifierType.EMAIL
  )
  let pregenWallet: Wallet | undefined
  let userShare: string

  if (!hasWallet) {
    pregenWallet = await capsule.createWalletPreGen(
      WalletType.EVM,
      email,
      PregenIdentifierType.EMAIL
    )
    userShare = (await capsule.getUserShare()) ?? ""

    await storeUserShare(email, userShare)
  } else {
    userShare = (await getUserShareFromDatabase(email)) ?? ""
    if (!userShare) {
      throw new Error("User share not found for existing wallet")
    }
    await capsule.setUserShare(userShare)
    pregenWallet = Object.values(await capsule.getWallets())[0]
  }

  return pregenWallet
}

export function createViemClient(capsule: Capsule): WalletClient {
  const viemCapsuleAccount = createCapsuleAccount(capsule)

  const walletClientConfig: WalletClientConfig = {
    account: viemCapsuleAccount,
    chain: arbitrumSepolia,
    transport: http(ALCHEMY_RPC_URL),
  }

  const viemClient = createCapsuleViemClient(capsule, walletClientConfig)

  // This is a workaround to fix the v value of the signature on signMessage. This method overrides the default signMessage method with a custom implementation. See the customSignMessage function below.
  viemClient.signMessage = async ({
    message,
  }: {
    message: SignableMessage
  }): Promise<Hash> => {
    return customSignMessage(capsule, message)
  }

  return viemClient
}

export async function createAlchemyClient(viemClient: WalletClient) {
  const walletClientSigner: WalletClientSigner = new WalletClientSigner(
    viemClient,
    "capsule"
  )

  const client = await createModularAccountAlchemyClient({
    apiKey: ALCHEMY_API_KEY,
    chain: arbitrumSepolia,
    signer: walletClientSigner,
    gasManagerConfig: {
      policyId: ALCHEMY_GAS_POLICY_ID,
    },
  })

  return client
}

async function customSignMessage(
  capsule: Capsule,
  message: SignableMessage
): Promise<Hash> {
  const hashedMessage = hashMessage(message)
  const res = await capsule.signMessage(
    Object.values(capsule.wallets!)[0]!.id,
    hexStringToBase64(hashedMessage)
  )

  let signature = (res as SuccessfulSignatureRes).signature

  // Fix the v value of the signature
  const lastByte = parseInt(signature.slice(-2), 16)
  if (lastByte < 27) {
    const adjustedV = (lastByte + 27).toString(16).padStart(2, "0")
    signature = signature.slice(0, -2) + adjustedV
  }

  return `0x${signature}`
}
