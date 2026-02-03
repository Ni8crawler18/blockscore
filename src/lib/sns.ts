// Use Bonfida SNS proxy for domain resolution
export async function resolveSolDomain(domain: string): Promise<string | null> {
  const name = domain.replace(/\.sol$/, '')
  
  try {
    const res = await fetch(`https://sns-sdk-proxy.bonfida.workers.dev/resolve/${name}`)
    
    if (!res.ok) {
      return null
    }
    
    const data = await res.json()
    
    // Response format: { s: "ok", result: "address" }
    if (data.s === 'ok' && data.result) {
      return data.result
    }
    
    return null
  } catch (e) {
    console.error(`[SNS] Failed to resolve ${domain}:`, e)
    return null
  }
}
