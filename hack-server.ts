import { NS } from "./types/NetscriptDefinitions/index"


export async function main(ns: NS) {
    const target = ns.args[0] as string | undefined
    let targetServer = ns.getServer(target)
    while (true) {
        if (targetServer.hostname != 'home') {
            while (targetServer.hackDifficulty > targetServer.minDifficulty || targetServer.moneyAvailable < targetServer.moneyMax) {
                targetServer = ns.getServer()
                if (targetServer.hackDifficulty > targetServer.minDifficulty) {
                    ns.print(`Attempting Weaken from ${targetServer.hackDifficulty} to ${targetServer.minDifficulty} : ${targetServer.hostname}`)
                    await ns.weaken(targetServer.hostname)
                }
                if (targetServer.hackDifficulty == targetServer.minDifficulty && targetServer.moneyAvailable < targetServer.moneyMax) {
                    ns.print(`Attempting grow from ${targetServer.moneyAvailable} to ${targetServer.moneyMax}: ${targetServer.hostname}`)
                    await ns.grow(targetServer.hostname)
                }
            }
            const result = await ns.hack(targetServer.hostname)
            ns.print(`Hack Result: ${result}`)
        } else {
            ns.exit()
        }
        await ns.sleep(0)
    }
}
