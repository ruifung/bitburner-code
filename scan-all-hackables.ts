import { NS, Server } from "./types/NetscriptDefinitions/index"

export interface Path {
    hostname: string,
    predecessors: string[]
}

export async function main(ns: NS) {
    const scriptsToKill = ["hack-server.js"]

    const target = ns.args[0] as string | undefined
    const hosts = new Map<string, Path>()
    const queue: Path[] = [{ hostname: 'home', predecessors: [] }]
    const hackLevel = ns.getHackingLevel()

    while (queue.length > 0) {
        const host = queue.pop() as Path
        hosts.set(host.hostname, host)
        queue.push(...(ns.scan(host.hostname)
            .filter(it => !hosts.has(it))
            .map(hostname => ({ hostname, predecessors: [...host.predecessors, host.hostname] }))
        ))
    }

    const sortedList = [...hosts.entries()]
        .map(it => ({path: it[1], server: ns.getServer(it[0])}))
        .filter(({path, server}) => !server.purchasedByPlayer && path.hostname != 'home')
        .filter(({path, server}) => server.requiredHackingSkill <= hackLevel)
        .sort((a, b) => a.server.moneyMax - b.server.moneyMax);

    const lookupMap: Map<string, Server> = new Map()
    lookupMap.set("home", ns.getServer("home"))
    sortedList.forEach(({path, server}) => lookupMap.set(path.hostname, server))

    const reverseList = sortedList.map(it => it.path).reverse()
    await ns.write("/data/best-hack-targets.txt", JSON.stringify(reverseList, undefined, 2), "w")

    sortedList.forEach(({path, server}, idx) => {
        ns.tprint("===================================")
        ns.tprint(`"Server #${idx}: ${server.hostname}`)
        ns.tprint("===================================")
        ns.tprint(` -     Money: ${server.moneyAvailable}/${server.moneyMax}`)
        ns.tprint(` -  RAM Used: ${server.ramUsed}/${server.maxRam}`)
        ns.tprint(` - CPU Cores: ${server.cpuCores}`)
        ns.tprint(` -  Sec. Lvl: ${server.hackDifficulty}/${server.minDifficulty}`)
        ns.tprint(` -    Growth: ${server.serverGrowth}`)
        ns.tprint(` -       Org: ${server.organizationName}`)
        ns.tprint(` - Skill Lvl: ${server.requiredHackingSkill}`)
        ns.tprint(` - Ports Req: ${server.openPortCount}/${server.numOpenPortsRequired}`)
        ns.tprint(` -  Has Root: ${server.hasAdminRights}`)
        ns.tprint(` -  Backdoor: ${server.backdoorInstalled}`)
        ns.tprint(` -      Path: ${[...path.predecessors, path.hostname].join(" -> ")}`)
        ns.tprint("===================================")
    })
}
