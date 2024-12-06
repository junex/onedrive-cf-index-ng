// import { KVNamespace } from '@cloudflare/workers-types'

// 存储固定的 token
const HARDCODED_REFRESH_TOKEN = 'M.C506_SN1.0.U.-Cgg7OywmQAjFuJBmn*DPr9XuFeDVwJ4g5eUDzEfFTT4aKQ6k*lcqo74OoK3LNHThEben79wJt*N5wlBKwil4lhSg2rlQzqORH4R39S3hm!bLg7CSxpXXgkCkb7xRsLN3fVKhSBY4zkcQ2PBxS2XuomDyIMvWDuppHFoQRLABpCGBe0kl8XvDvPAxnhRdlXNdVOVYa2926fN*8HuJMDAbgFO8IQiW!D4vd1bzSro7ZpkBWqyH!YRJM*05M77kHGYkwzAK!TcqVQWknZV1U3vd6Nxzhv3vJaj!DU0I8AML4Ap6yGRuzz0wqc5lOMCFpHLYoJ0JhfMQXTdcpv!20D6GpSdo568XQVKeF!ncLJeohFwmY8l8BK2jM1K9FrroisgH*oOH5T06CZImOf6guvmjr!c$'
let localAccessToken: string | null = null

export async function getOdAuthTokens(): Promise<{ accessToken: unknown; refreshToken: unknown }> {
  // const { ONEDRIVE_CF_INDEX_KV } = process.env as unknown as { ONEDRIVE_CF_INDEX_KV: KVNamespace }

  // const accessToken = await ONEDRIVE_CF_INDEX_KV.get('access_token')
  // const refreshToken = await ONEDRIVE_CF_INDEX_KV.get('refresh_token')

  return {
    accessToken: localAccessToken,
    refreshToken: HARDCODED_REFRESH_TOKEN,
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

  // await ONEDRIVE_CF_INDEX_KV.put('access_token', accessToken, { expirationTtl: accessTokenExpiry })
  // await ONEDRIVE_CF_INDEX_KV.put('refresh_token', refreshToken)
  
  // 将 access token 存储在内存中
  localAccessToken = accessToken
}
