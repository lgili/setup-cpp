import { extractZip } from "@actions/tool-cache"
import { setupBin, PackageInfo, InstallationInfo } from "../utils/setup/setupBin"

/** Get the platform name Ninja uses in their download links */
function getNinjaPlatform(platform: NodeJS.Platform) {
  switch (platform) {
    case "win32":
      return "win"
    case "darwin":
      return "mac"
    case "linux":
      return "linux"
    default:
      throw new Error(`Unsupported platform '${platform}'`)
  }
}

/** Get the platform data for ninja */
function getNinjaPackageInfo(version: string, platform: NodeJS.Platform): PackageInfo {
  const ninjaPlatform = getNinjaPlatform(platform)
  return {
    binRelativeDir: "",
    extractedFolderName: "",
    extractFunction: extractZip,
    url: `https://github.com/ninja-build/ninja/releases/download/v${version}/ninja-${ninjaPlatform}.zip`,
  }
}

const default_ninja_version = "1.10.2"

export function setupNinja(version: string, setupCppDir: string): Promise<InstallationInfo> {
  return setupBin("ninja", version === "true" ? default_ninja_version : version, getNinjaPackageInfo, setupCppDir)
}
