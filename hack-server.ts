import { NS } from "./types/NetscriptDefinitions/index"


export async function main(ns: NS) {
    const target = ns.args[0] as string | undefined
    ns.print(`TARGET SERVER: ${target}`)
    while (true) {
        let targetServer = ns.getServer(target)
        if (targetServer.hostname != 'home') {
            while (Math.round(targetServer.hackDifficulty) > targetServer.minDifficulty || targetServer.moneyAvailable < (targetServer.moneyMax * .9)) {
                targetServer = ns.getServer(target)
                if (Math.round(targetServer.hackDifficulty) > targetServer.minDifficulty) {
                    ns.print(`Attempting Weaken from ${targetServer.hackDifficulty} to ${targetServer.minDifficulty} : ${targetServer.hostname}`)
                    await ns.weaken(targetServer.hostname)
                } else if (targetServer.moneyAvailable < (targetServer.moneyMax * .9)) {
                    ns.print(`Attempting grow from ${targetServer.moneyAvailable} to ${targetServer.moneyMax}: ${targetServer.hostname}`)
                    await ns.grow(targetServer.hostname)
                }
            }
            const result = await ns.hack(targetServer.hostname)
            ns.print(`Hack Result: ${result}`)
        } else {
            ns.exit()
        }
        eval("window.skipTimeoutHack = true")
        await ns.sleep(500)
    }
}
