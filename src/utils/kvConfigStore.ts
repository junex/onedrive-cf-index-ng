// import { KVNamespace } from '@cloudflare/workers-types'
import siteConfig from '../../config/site.config'

export async function getKVConfig(): Promise<{ allowedDirectories: string[],hiddenDirectories: string[] }> {
    // const { ONEDRIVE_CF_INDEX_KV } = process.env as unknown as { ONEDRIVE_CF_INDEX_KV: KVNamespace }

    // const allowedDirectories = await ONEDRIVE_CF_INDEX_KV.get('allowed_directories')
    // const hiddenDirectories = await ONEDRIVE_CF_INDEX_KV.get('hidden_directories')
    const allowedDirectories = '公开,游戏,工具'
    const hiddenDirectories = '公开'
    const ceAllowedDirectories = siteConfig.allowedDirectories
        ? siteConfig.allowedDirectories.split(',').map(dir => dir.trim()).filter(Boolean)
        : []

    const ceHiddenDirectories = siteConfig.hiddenDirectories
        ? siteConfig.hiddenDirectories.split(',').map(dir => dir.trim()).filter(Boolean)
        : []

    const allowedDirectoriesArray = (allowedDirectories || ceAllowedDirectories.length > 0)
        ? (allowedDirectories ? allowedDirectories.split(',').map(dir => dir.trim()).filter(Boolean) : ceAllowedDirectories)
        : []
    const hiddenDirectoriesArray = (hiddenDirectories || ceHiddenDirectories.length > 0)
        ? (hiddenDirectories ? hiddenDirectories.split(',').map(dir => dir.trim()).filter(Boolean) : ceHiddenDirectories)
        : []

    return {
        allowedDirectories: allowedDirectoriesArray,
        hiddenDirectories: hiddenDirectoriesArray,
    }
}