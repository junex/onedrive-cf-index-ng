import { posix as pathPosix } from 'path-browserify'
import axios from 'redaxios'

import { driveApi, cacheControlHeader } from '../../../config/api.config'
import { encodePath, getAccessToken, checkAuthRoute } from '.'
import { NextRequest } from 'next/server'
import { getKVConfig } from '../../utils/kvConfigStore'

export const runtime = 'edge'

export default async function handler(req: NextRequest): Promise<Response> {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'No access token.' }), { status: 403 })
  }

  const { path = '/', odpt = '', proxy = false } = Object.fromEntries(req.nextUrl.searchParams)

  // Sometimes the path parameter is defaulted to '[...path]' which we need to handle
  if (path === '[...path]') {
    return new Response(JSON.stringify({ error: 'No path specified.' }), { status: 400 })
  }
  // If the path is not a valid path, return 400
  if (typeof path !== 'string') {
    return new Response(JSON.stringify({ error: 'Path query invalid.' }), { status: 400 })
  }
  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))

  // Handle protected routes authentication
  const odTokenHeader = (req.headers.get('od-protected-token') as string) ?? odpt

  const { code, message } = await checkAuthRoute(cleanPath, accessToken, odTokenHeader)
  // Status code other than 200 means user has not authenticated yet
  if (code !== 200) {
    return new Response(JSON.stringify({ error: message }), { status: code })
  }

  let headers = {
    'Cache-Control': cacheControlHeader,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  // If message is empty, then the path is not protected.
  // Conversely, protected routes are not allowed to serve from cache.
  if (message !== '') {
    headers['Cache-Control'] = 'no-cache'
  }

  try {
    const { allowedDirectories, hiddenDirectories } = await getKVConfig();
    // Handle response from OneDrive API
    const requestUrl = `${driveApi}/root${encodePath(cleanPath)}`
    // 根据 allowedDirectories 过滤结果
    if (allowedDirectories.length > 0) {
      // 预处理 allowedDirectories，使用 encodePath 处理每个目录
      const processedAllowedDirs = allowedDirectories.map(dir =>
        `:/${encodeURIComponent(dir)}`.toLowerCase()
      );
      const isAllowed = processedAllowedDirs.some(allowedDir =>
        encodePath(cleanPath).includes(allowedDir)
      );
      if (!isAllowed) throw new Error('Access denied.')
    }

    const { data } = await axios.get(requestUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        // OneDrive international version fails when only selecting the downloadUrl (what a stupid bug)
        select: 'id,size,@microsoft.graph.downloadUrl',
      },
    })

    if ('@microsoft.graph.downloadUrl' in data) {
      // Only proxy raw file content response for files up to 4MB
      if (proxy && 'size' in data && data['size'] < 4194304) {
        const { headers, data: stream } = await axios.get(data['@microsoft.graph.downloadUrl'] as string, {
          responseType: 'stream',
        })
        headers['Cache-Control'] = cacheControlHeader
        // Send data stream as response
        // TODO
        // res.writeHead(200, headers as AxiosResponseHeaders)
        // stream.pipe(res)
        return new Response()
      } else {
        headers['Location'] = data['@microsoft.graph.downloadUrl'] as string
        return new Response(null, { status: 302, headers: headers })
      }
    } else {
      return new Response(JSON.stringify({ error: 'No download url found.' }), { status: 404, headers: headers })
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.response?.data ?? 'Internal server error.' }), {
      status: error?.response?.status ?? 500,
      headers: headers
    })
  }
}
