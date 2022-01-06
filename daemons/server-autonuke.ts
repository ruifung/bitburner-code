import { NS, Server } from "../types/NetscriptDefinitions/index"

const hackScript = "hack-server.js"

export async function main(ns: NS) {
    ns.disableLog("getHackingLevel")
    ns.disableLog("scan")
    ns.disableLog("sleep")

    let currentServer = ns.getServer()
    let prevTarget: string | null = null
    while (true) {
        const bestTarget: string = ns.read("/data/best-hack-target.txt")

        if (prevTarget != bestTarget) {
            prevTarget = bestTarget
            ns.exec('kill-all-autohacks.js', 'home')
        }

        ns.print("Starting search cycle.")
        const blacklist: string[] = []
        const visited = new Set([currentServer.hostname, ...blacklist])

        let targetQueue = filteredScan(ns, 'home', visited).reverse()

        while(targetQueue.length > 0) {
            const nextTarget = targetQueue.pop() as Server
            await attackTarget(ns, nextTarget, bestTarget == "" || bestTarget == null ? nextTarget.hostname : bestTarget)
            visited.add(nextTarget.hostname)

            const curQueueSize = targetQueue.length
            const newQueueSize = targetQueue.push(...filteredScan(ns, nextTarget.hostname, visited))
            if (newQueueSize != curQueueSize)
                ns.print(`Found ${newQueueSize - curQueueSize} new targets.`)
        }

        ns.print("Cycle complete.")
        await ns.sleep(1000)
    }
}

function filteredScan(ns: NS, hostname: string, blacklist: Set<string>): Server[] {
    return ns.scan(hostname)
    .map(host => ns.getServer(host))
    .filter(target => !blacklist.has(target.hostname))
    .filter(target => target.requiredHackingSkill <= ns.getHackingLevel())
}

async function attackTarget(ns: NS, target: Server, hackTarget: string = target.hostname) {
    if (target.hostname == 'home') {
        return
    }
    ns.print(`Checking: ${target.hostname}`)
    let nuked = false
    if (!target.hasAdminRights) {
        if (target.numOpenPortsRequired > target.openPortCount) {
            ns.print(`Attempting Port Open: ${target.hostname}`)
            if (ns.fileExists("BruteSSH.exe", 'home') && !target.sshPortOpen) {
                ns.print(`BruteSSH: ${target.hostname}`)
                ns.brutessh(target.hostname)
            }
            if (ns.fileExists("FTPCrack.exe", 'home') && !target.ftpPortOpen) {
                ns.print(`FTPCrack: ${target.hostname}`)
                ns.ftpcrack(target.hostname)
            }
            if (ns.fileExists("relaySMTP.exe", 'home') && !target.smtpPortOpen) {
                ns.print(`RelaySMTP: ${target.hostname}`)
                ns.relaysmtp(target.hostname)
            }
            if (ns.fileExists("HTTPWorm.exe", 'home') && !target.httpPortOpen) {
                ns.print(`HTTPWorm: ${target.hostname}`)
                ns.httpworm(target.hostname)
            }
            if (ns.fileExists("SQLInject.exe", 'home') && !target.sqlPortOpen) {
                ns.print(`SQLInject: ${target.hostname}`)
                ns.sqlinject(target.hostname)
            }
        }
        if (target.numOpenPortsRequired <= target.openPortCount) {
            ns.print(`Nuking: ${target.hostname}`)
            ns.nuke(target.hostname)
            nuked = true
        }
    }

    const ramAvailable = target.maxRam - target.ramUsed
    const hackScriptRam = ns.getScriptRam(hackScript, 'home')
    if ((target.hasAdminRights || nuked) 
        && !ns.ps(target.hostname).map( ps => ps.filename).includes(hackScript) && ramAvailable > hackScriptRam) {
        ns.print(`Launching HackHelper: ${target.hostname}`)
        await ns.scp(hackScript, 'home', target.hostname)
        ns.exec(hackScript, target.hostname, Math.floor(ramAvailable / hackScriptRam), hackTarget)
    }
    await ns.sleep(1000)
}
