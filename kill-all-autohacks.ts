

import { NS } from "./types/NetscriptDefinitions/index"


export async function main(ns: NS) {
    const scriptsToKill = ["hack-server.js"]

    const target = ns.args[0] as string | undefined
    const visited = new Set<string>()
    const queue: string[] = ['home']

    while(queue.length > 0) {
        const host = queue.pop() as string
        killScripts(ns, host, scriptsToKill)
        visited.add(host)
        queue.push(...(ns.scan(host).filter(it => !visited.has(it))))
    }
}

function killScripts(ns: NS, hostname: string, scripts: string[]) {
    ns.ps(hostname)
    .filter(it => scripts.includes(it.filename))
    .forEach(it => ns.kill(it.pid))
}
