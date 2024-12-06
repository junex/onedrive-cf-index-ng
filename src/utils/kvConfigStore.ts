import { KVNamespace } from '@cloudflare/workers-types'
import siteConfig from '../../config/site.config'

export async function getKVConfig(): Promise<{ allowedDirectories: string[] }> {

    const { ONEDRIVE_CF_INDEX_KV } = process.env as unknown as { ONEDRIVE_CF_INDEX_KV: KVNamespace }
    
    const allowedDirectories = await ONEDRIVE_CF_INDEX_KV.get('allowed_directories')
    const ceAllowedDirectories = siteConfig.allowedDirectories 
        ? siteConfig.allowedDirectories.split(',').map(dir => dir.trim()).filter(Boolean)
        : []

    const directoriesArray = (allowedDirectories || ceAllowedDirectories.length > 0) 
        ? (allowedDirectories ? allowedDirectories.split(',').map(dir => dir.trim()).filter(Boolean) : ceAllowedDirectories)
        : []

    return {
        allowedDirectories: directoriesArray,
    }
}