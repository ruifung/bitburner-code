import { NS } from "./types/NetscriptDefinitions/index"

export async function main(ns: NS) {
    let currentServer = ns.getServer()
    const scriptName = ns.getScriptName()
    const scriptRam = ns.getScriptRam(scriptName)
    const hackScript = "/helpers/hack-current-server.js"
    const hackScriptRam = ns.getScriptRam(hackScript)

    while (true) {
        const hackingLevel = ns.getHackingLevel()
        const targets = ns.scan(currentServer.hostname)
            .map(host => ns.getServer(host))
            .filter(target => ![currentServer.hostname, ...ns.args].includes(target.hostname))
            .filter(target => target.requiredHackingSkill <= hackingLevel)
            .filter(target => (target.maxRam - target.ramUsed) >= scriptRam)

        ns.print(`Targets Found: ${targets.length}`)
        for (let target of targets) {
            ns.print(`Attempting: ${target.hostname}`)
            if (!target.hasAdminRights) {
                if (target.numOpenPortsRequired > target.openPortCount) {
                    ns.print(`Attempting Port Open: ${target.hostname}`)
                    if (ns.fileExists("BruteSSH.exe"), 'home') {
                        ns.print(`BruteSSH: ${target.hostname}`)
                        ns.brutessh(target.hostname)
                    }
                    if (ns.fileExists("FTPCrack.exe"), 'home') {
                        ns.print(`FTPCrack: ${target.hostname}`)
                        ns.ftpcrack(target.hostname)
                    }
                    if (ns.fileExists("relaySMTP.exe"), 'home') {
                        ns.print(`RelaySMTP: ${target.hostname}`)
                        ns.relaysmtp(target.hostname)
                    }
                    if (ns.fileExists("HTTPWorm.exe"), 'home') {
                        ns.print(`HTTPWorm: ${target.hostname}`)
                        ns.httpworm(target.hostname)
                    }
                    if (ns.fileExists("SQLInject.exe"), 'home') {
                        ns.print(`SQLInject: ${target.hostname}`)
                        ns.sqlinject(target.hostname)
                    }
                }
                if (target.numOpenPortsRequired <= target.openPortCount) {
                    ns.print(`Nuking: ${target.hostname}`)
                    ns.nuke(target.hostname)
                }
            }
            ns.print(`Propagating to: ${target.hostname}`)
            await ns.scp(scriptName, currentServer.hostname, target.hostname)
            const ramAvailable = target.maxRam - target.ramUsed
            const visited = new Set(['home', currentServer.hostname, ...ns.args])
            ns.exec(scriptName, target.hostname, 1, ...visited)

            if (!ns.ps(target.hostname).map( ps => ps.filename).includes(hackScript) && (ramAvailable - scriptRam) > hackScriptRam) {
                ns.print(`Launching HackHelper: ${target.hostname}`)
                await ns.scp(hackScript, 'home', target.hostname)
                ns.exec(hackScript, target.hostname, Math.floor((ramAvailable - scriptRam) / hackScriptRam))
            }
            await ns.sleep(0)
        }
        await ns.sleep(1000)
    }
}
