// import { KVNamespace } from '@cloudflare/workers-types'

var access_token

export async function getOdAuthTokens(): Promise<{ accessToken: unknown; refreshToken: unknown }> {
  // const { ONEDRIVE_CF_INDEX_KV } = process.env as unknown as { ONEDRIVE_CF_INDEX_KV: KVNamespace }

  // const accessToken = await ONEDRIVE_CF_INDEX_KV.get('access_token')
  // const refreshToken = await ONEDRIVE_CF_INDEX_KV.get('refresh_token')
  const accessToken = access_token
  const refreshToken = "M.C506_BL2.0.U.-CjpVX60BZXJzeeY72Wm2iEMZLR8LtFH8WgVfUIkAXP6ncxlFwWWNJBYr1v*94fyZAATKbOh3MQux*yTPPT1SAx8Y!ECe2oLw!9mIy!QhMxQGAfKnYpXCk8MB3fVL!0GN0*acsH5Xx2RRfgyH3Dm!DuVPanmmvxJyAzm*ybSJPwpBtwz1TuI4SzLApxvVL*1U9GIbU7ZRNbwVntuQjpK8TsJuCCdrNjSn33miGecwS!sDM3yIGDvSuRhcY1vqKDPokrO9iNfAmIUWw1CNPo4*S2CWgfLJ*IJ9PPWJ3y0tPDzkvi7EuhAZC4NT1hXOfA38uRsiMYVYcckoiZZgA34!*DarWqloYWAbFO210yQrkzejJwxA!WAV6mxE3OG!ABWQvm2ByWdgPe7tUM7ILNQcswM$"
  return {
    accessToken,
    refreshToken,
  }
}

export async function storeOdAuthTokens({
  accessToken,
  accessTokenExpiry,
  refreshToken,
}: {
  accessToken: string
  accessTokenExpiry: number
  refreshToken: string
}): Promise<void> {
  // const { ONEDRIVE_CF_INDEX_KV } = process.env as unknown as { ONEDRIVE_CF_INDEX_KV: KVNamespace }
  access_token = accessToken
  // await ONEDRIVE_CF_INDEX_KV.put('access_token', accessToken, { expirationTtl: accessTokenExpiry })
  // await ONEDRIVE_CF_INDEX_KV.put('refresh_token', refreshToken)
}
