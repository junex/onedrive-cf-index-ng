import axios from 'redaxios'
import type { NextApiRequest, NextApiResponse } from 'next'

import { encodePath, getAccessToken } from '.'
import apiConfig from '../../../config/api.config'
import siteConfig from '../../../config/site.config'
import { NextRequest, NextResponse } from 'next/server'
import { getKVConfig } from '../../utils/kvConfigStore'
import { OdSearchResult } from '../../types'

export const runtime = 'edge'

/**
 * Sanitize the search query
 *
 * @param query User search query, which may contain special characters
 * @returns Sanitised query string, which:
 * - encodes the '<' and '>' characters,
 * - replaces '?' and '/' characters with ' ',
 * - replaces ''' with ''''
 * Reference: https://stackoverflow.com/questions/41491222/single-quote-escaping-in-microsoft-graph.
 */
function sanitiseQuery(query: string): string {
  const sanitisedQuery = query
    .replace(/'/g, "''")
    .replace('<', ' &lt; ')
    .replace('>', ' &gt; ')
    .replace('?', ' ')
    .replace('/', ' ')
  return encodeURIComponent(sanitisedQuery)
}

export default async function handler(req: NextRequest): Promise<Response> {
  // Get access token from storage
  const accessToken = await getAccessToken()
  const { allowedDirectories } = await getKVConfig()

  // Query parameter from request
  const { q: searchQuery = '' } = Object.fromEntries(req.nextUrl.searchParams)

  // TODO: Set edge function caching for faster load times

  if (typeof searchQuery === 'string') {
    // Construct Microsoft Graph Search API URL, and perform search only under the base directory
    const searchRootPath = encodePath('/')
    const encodedPath = searchRootPath === '' ? searchRootPath : searchRootPath + ':'

    const searchApi = `${apiConfig.driveApi}/root${encodedPath}/search(q='${sanitiseQuery(searchQuery)}')`

    try {
      const { data } = await axios.get(searchApi, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          select: 'id,name,file,folder,parentReference',
          top: siteConfig.maxItems,
        },
      })
      
      // 解析和处理搜索结果
      let processedResults: OdSearchResult = data.value.map(item => ({
        id: item.id,
        name: item.name,
        file: item.file,
        folder: item.folder,
        path: item.parentReference.path,
        parentReference: {
          id: item.parentReference.id,
          name: item.parentReference.name,
          path: item.parentReference.path
        }
      }))

      console.log('初始搜索结果数量:', processedResults.length)
      console.log('允许的目录列表:', allowedDirectories)

      // 根据 allowedDirectories 过滤结果
      if (allowedDirectories.length > 0) {
        // 预处理 allowedDirectories，使用 encodePath 处理每个目录
        const processedAllowedDirs = allowedDirectories.map(dir => {
          const encoded = `/drive/root:/${encodeURIComponent(dir)}`.toLowerCase()
          return encoded
        });

        processedResults = processedResults.filter(item => {
          const itemPath = item.path.toLowerCase()
          const isAllowed = processedAllowedDirs.some(allowedDir => 
            itemPath.includes(allowedDir)
          );
          return isAllowed
        });
      }

      return NextResponse.json(processedResults)
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error?.response?.data ?? 'Internal server error.' }), {
        status: error?.response?.status ?? 500,
      })
    }
  } else {
    return NextResponse.json([])
  }
}
