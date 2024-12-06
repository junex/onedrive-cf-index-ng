import axios from 'redaxios'

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
    .replace(/'/g, '\'\'')
    .replace('<', ' &lt; ')
    .replace('>', ' &gt; ')
    .replace('?', ' ')
    .replace('/', ' ')
  return encodeURIComponent(sanitisedQuery)
}

export default async function handler(req: NextRequest): Promise<Response> {
  // Get access token from storage
  const accessToken = await getAccessToken()
  const { allowedDirectories, hiddenDirectories } = await getKVConfig()

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
          top: siteConfig.maxItems
        }
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

      // 根据 allowedDirectories 过滤结果
      if (allowedDirectories.length > 0) {
        const processedAllowedDirs = allowedDirectories.map(dir => {
          return `/drive/root:/${encodeURIComponent(dir)}`.toLowerCase()
        })

        processedResults = processedResults.filter(item => {
          return processedAllowedDirs.some(allowedDir => {
            return item.path.toLowerCase().includes(allowedDir)
          })
        })
      }
      if (hiddenDirectories.length > 0) {
        const processedHiddenDirs = hiddenDirectories.map(dir => {
          return `/drive/root:/${encodeURIComponent(dir)}`.toLowerCase()
        })

        processedResults = processedResults.filter(item => {
          return processedHiddenDirs.some(hiddenDir => {
            return !item.path.toLowerCase().includes(hiddenDir)
          })
        })
      }

      return NextResponse.json(processedResults)
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error?.response?.data ?? 'Internal server error.' }), {
        status: error?.response?.status ?? 500
      })
    }
  } else {
    return NextResponse.json([])
  }
}
