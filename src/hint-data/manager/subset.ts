import { SystemdFileType } from "../../parser/file-info";
import { DirectiveCategory } from "../types-runtime";
import { HintDataManager } from "./base";

const runtimeCache: ReadonlyArray<HintDataManager>[] = [];
export function getSubsetOfManagers(managers: ReadonlyArray<HintDataManager | undefined>, fileInfo: SystemdFileType) {
    const cached = runtimeCache[fileInfo];
    if (cached) return cached;
    return (runtimeCache[fileInfo] = _getSubsetOfManagers(managers, fileInfo));
}

function _getSubsetOfManagers(
    managers: ReadonlyArray<HintDataManager | undefined>,
    fileInfo: SystemdFileType
): ReadonlyArray<HintDataManager> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: { [key in DirectiveCategory]: boolean } = [] as any;
    filters[DirectiveCategory.default] = true;
    filters[DirectiveCategory.fallback] = true;

    const result: Array<HintDataManager> = [];
    switch (fileInfo) {
        case SystemdFileType.service: {
            filters[DirectiveCategory.service] = true;
            break;
        }
        case SystemdFileType.dnssd: {
            filters[DirectiveCategory.dnssd] = true;
            break;
        }
        case SystemdFileType.path: {
            filters[DirectiveCategory.path] = true;
            break;
        }
        case SystemdFileType.link: {
            filters[DirectiveCategory.link] = true;
            break;
        }
        case SystemdFileType.netdev: {
            filters[DirectiveCategory.netdev] = true;
            break;
        }
        case SystemdFileType.socket: {
            filters[DirectiveCategory.socket] = true;
            break;
        }
        case SystemdFileType.timer: {
            filters[DirectiveCategory.timer] = true;
            break;
        }
        case SystemdFileType.mount: {
            filters[DirectiveCategory.mount] = true;
            break;
        }
        case SystemdFileType.network: {
            filters[DirectiveCategory.network] = true;
            break;
        }
        case SystemdFileType.podman_network: {
            filters[DirectiveCategory.network] = true;
            filters[DirectiveCategory.podman] = true;
            break;
        }
        case SystemdFileType.podman: {
            filters[DirectiveCategory.service] = true;
            filters[DirectiveCategory.podman] = true;
            break;
        }
        default: // unknown
            for (const it of managers) if (it && it.category !== DirectiveCategory.podman) result.push(it);
            return result;
    }
    for (const it of managers) if (it && filters[it.category]) result.push(it);
    return result;
}
