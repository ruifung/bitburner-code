import { NS } from "../types/NetscriptDefinitions/index"


export async function main(ns: NS) {
    const hacknet = ns.hacknet
    while (true) {
        const nodes = hacknet.numNodes()
        let totalProduction = 0
        for (let idx = 0; idx < nodes; idx++) {
            totalProduction += hacknet.getNodeStats(idx).production
        }

        for (let idx = 0; idx < nodes; idx++) {
            ns.print(`Upgrading node ${idx}`)
            const nodeStats = hacknet.getNodeStats(idx)
            if (nodeStats.level <= 300) {
                const upgradeCost = hacknet.getLevelUpgradeCost(idx, 1)
                hacknet.upgradeLevel(idx, 1)
                await ns.sleep((upgradeCost / totalProduction) * 1000)
            }
        }
        ns.print("Cycle complete.")
    }
}