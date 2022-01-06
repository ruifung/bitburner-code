import { NodeStats, NS } from "../types/NetscriptDefinitions/index"

interface Node {
    idx: number
    info: NodeStats
    cheapestUpgrade: UpgradeOption
}

interface UpgradeOption {
    type: 'LEVEL' | 'RAM' | 'CORE' | 'CACHE',
    cost: number,
    performUpgrade: () => {}
}

export async function main(ns: NS) {
    const hacknet = ns.hacknet
    while (true) {
        const nodes: Node[] = []
        let totalProduction = 0
        for (let idx = 0; idx < hacknet.numNodes(); idx++) {
            const info = hacknet.getNodeStats(idx)
            const cheapestUpgrade = determineCheapestUpgrade(ns, info, idx)
            
            if (cheapestUpgrade != undefined) {
                nodes.push({
                    idx,
                    info,
                    cheapestUpgrade
                })
            }
            totalProduction += info.production
        }

        ns.print(`Upgrade Cycle Start. Handling ${nodes.length} nodes.`)
        sortNodes(nodes)

        let idx = 0
        while(idx < nodes.length) {
            const node = nodes[idx]
            ns.print(`Upgrading node ${idx}`)
            const option = node.cheapestUpgrade
            ns.print(`Performing ${option.type} Upgrade on Node ${node.idx}`)
            option.performUpgrade()
            
            if (nodes.length != ns.hacknet.numNodes()) {
                ns.print("Node count changed, terminating cycle.")
                break;
            }

            const oldOrder = nodes.map(node => node.idx).join(',')

            const newOption = determineCheapestUpgrade(ns, node.info, node.idx)
            if (newOption == undefined) {
                nodes.splice(idx, 1)
            } else {
                node.cheapestUpgrade = newOption
            }

            sortNodes(nodes)
            const newOrder = nodes.map(node => node.idx).join(',')

            if (oldOrder == newOrder) {
                idx++
            } else {
                idx = 0
            }

            await ns.sleep(Math.ceil((option.cost / totalProduction) * 1000))
        }
        ns.print("Upgrade cycle complete.")
    }
}

function determineCheapestUpgrade(ns: NS, nodeStats: NodeStats, nodeIdx: number): UpgradeOption | undefined {
    let upgradeOptions: UpgradeOption[] = [
        {
            type: "RAM",
            cost: ns.hacknet.getRamUpgradeCost(nodeIdx, 1),
            performUpgrade: () => ns.hacknet.upgradeRam(nodeIdx, 1)
        },
        {
            type: "CORE",
            cost: ns.hacknet.getCoreUpgradeCost(nodeIdx, 1),
            performUpgrade: () => ns.hacknet.upgradeCore(nodeIdx, 1)
        }
    ]
    if (nodeStats.level <= 200) {
        upgradeOptions.push({
            type: "LEVEL",
            cost: ns.hacknet.getLevelUpgradeCost(nodeIdx, 1),
            performUpgrade: () => ns.hacknet.upgradeLevel(nodeIdx, 1)
        })
    }
    upgradeOptions = upgradeOptions.filter(a => Number.isFinite(a.cost)).sort((a, b) => a.cost - b.cost)
    return upgradeOptions.length > 0 ? upgradeOptions[0] : undefined
}

function sortNodes(nodes: Node[]) {
    nodes.sort((a, b) => a.cheapestUpgrade.cost - b.cheapestUpgrade.cost)
}