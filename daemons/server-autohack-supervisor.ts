import { Path } from "../scan-all-hackables"
import { NS, Server } from "../types/NetscriptDefinitions/index"

const hackScript = "hack-server.js"

export async function main(ns: NS) {
    ns.disableLog("getHackingLevel")
    ns.disableLog("scan")
    ns.disableLog("sleep")

    let currentServer = ns.getServer()
    let prevTargetCount: number = 0
    const targetHackResults: Map<string, number> = new Map()
    const lastAssignedTarget: Map<string, string> = new Map()
    let targetIdx = 0
    while (true) {
        const targets: Path[] = JSON.parse(ns.read("/data/best-hack-targets.txt"))

        if (prevTargetCount != targets.length) {
            prevTargetCount = targets.length
            ns.exec('kill-all-autohacks.js', 'home')
            targetHackResults.clear()
            targetIdx = 0
        }

        ns.print("Starting search cycle.")
        const blacklist: string[] = [currentServer.hostname]

        const serverQueue = deepScan(ns, 'home', blacklist).sort((a, b) => a.maxRam - b.maxRam)

        while(serverQueue.length > 0) {
            const nextServer = serverQueue.pop() as Server
            const hackTarget = targets[targetIdx].hostname
            const threadsAvailable = Math.floor((nextServer.maxRam - nextServer.ramUsed) / ns.getScriptRam(hackScript, 'home'))
            let expectedHackResult = (ns.hackAnalyze(hackTarget) * threadsAvailable) + (targetHackResults.get(hackTarget) ?? 0)

            if (lastAssignedTarget.has(nextServer.hostname)) {
                expectedHackResult -= (ns.hackAnalyze(lastAssignedTarget.get(nextServer.hostname) as string) * threadsAvailable)
            }

            targetHackResults.set(hackTarget, expectedHackResult)
            if (expectedHackResult > 1) {
                targetIdx++
                while(!ns.hasRootAccess(targets[targetIdx].hostname)) {
                    if (!breachTarget(ns, targets[targetIdx].hostname)) {
                        targetIdx++
                    }
                }
            }
            await attackTarget(ns, nextServer, hackTarget)
            lastAssignedTarget.set(nextServer.hostname, hackTarget)
        }

        ns.print("Cycle complete.")
        await ns.sleep(1000)
    }
}

function deepScan(ns: NS, startHost: string, blacklist: string[]): Server[] {
    const visited = new Set([startHost, ...blacklist])
    const scanQueue: string[] = [startHost]
    const results: Server[] = []

    while(scanQueue.length > 0) {
        const toScan = scanQueue.pop() as string
        const servers = filteredScan(ns, toScan, visited)
        scanQueue.push(...servers.map(it => it.hostname))
        results.push(...servers)
        visited.add(toScan)
    }

    return [...new Set(results)]
}

function filteredScan(ns: NS, hostname: string, blacklist: Set<string>): Server[] {
    return ns.scan(hostname)
    .map(host => ns.getServer(host))
    .filter(target => !blacklist.has(target.hostname))
    .filter(target => target.requiredHackingSkill <= ns.getHackingLevel())
}

async function attackTarget(ns: NS, server: Server, hackTarget: string = server.hostname) {
    if (server.hostname == 'home') {
        return
    }
    ns.print(`Checking: ${server.hostname}`)
    let nuked = breachTarget(ns, server.hostname)

    const ramAvailable = server.maxRam - server.ramUsed
    const hackScriptRam = ns.getScriptRam(hackScript, 'home')
    if ((server.hasAdminRights || nuked) 
        && !ns.ps(server.hostname).map( ps => ps.filename).includes(hackScript) && ramAvailable > hackScriptRam) {
        ns.print(`Launching HackHelper: ${server.hostname}`)
        await ns.scp(hackScript, 'home', server.hostname)
        ns.exec(hackScript, server.hostname, Math.floor(ramAvailable / hackScriptRam), hackTarget)
    }
    await ns.sleep(1000)
}

function breachTarget(ns: NS, hostname: string): boolean {
    const server = ns.getServer(hostname)
    if (!server.hasAdminRights) {
        if (server.numOpenPortsRequired > server.openPortCount) {
            ns.print(`Attempting Port Open: ${server.hostname}`)
            if (ns.fileExists("BruteSSH.exe", 'home') && !server.sshPortOpen) {
                ns.print(`BruteSSH: ${server.hostname}`)
                ns.brutessh(server.hostname)
            }
            if (ns.fileExists("FTPCrack.exe", 'home') && !server.ftpPortOpen) {
                ns.print(`FTPCrack: ${server.hostname}`)
                ns.ftpcrack(server.hostname)
            }
            if (ns.fileExists("relaySMTP.exe", 'home') && !server.smtpPortOpen) {
                ns.print(`RelaySMTP: ${server.hostname}`)
                ns.relaysmtp(server.hostname)
            }
            if (ns.fileExists("HTTPWorm.exe", 'home') && !server.httpPortOpen) {
                ns.print(`HTTPWorm: ${server.hostname}`)
                ns.httpworm(server.hostname)
            }
            if (ns.fileExists("SQLInject.exe", 'home') && !server.sqlPortOpen) {
                ns.print(`SQLInject: ${server.hostname}`)
                ns.sqlinject(server.hostname)
            }
        }
        if (server.numOpenPortsRequired <= server.openPortCount) {
            ns.print(`Nuking: ${server.hostname}`)
            ns.nuke(server.hostname)
            return true
        }
        return false
    } else {
        return true
    }
}