import { NS } from "./types/NetscriptDefinitions/index"

export async function main(ns: NS) {
    const count = ns.args[0] ?? 1

    for (let i = 0; i < count; i++) {
        let nodeIndex = ns.hacknet.purchaseNode()
        ns.hacknet.upgradeLevel(nodeIndex, 74)
        ns.hacknet.upgradeRam(nodeIndex, 1)
    }
}