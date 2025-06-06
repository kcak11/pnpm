import { PnpmError } from '@pnpm/error'
import { parseWantedDependency } from '@pnpm/parse-wanted-dependency'
import { type WorkspacePackages } from '@pnpm/resolver-base'
import { type IncludedDependencies, type ProjectManifest } from '@pnpm/types'

export function updateToWorkspacePackagesFromManifest (
  manifest: ProjectManifest,
  include: IncludedDependencies,
  workspacePackages: WorkspacePackages
): string[] {
  const allDeps = {
    ...(include.devDependencies ? manifest.devDependencies : {}),
    ...(include.dependencies ? manifest.dependencies : {}),
    ...(include.optionalDependencies ? manifest.optionalDependencies : {}),
  } as Record<string, string>
  return Object.keys(allDeps)
    .filter(depName => workspacePackages.has(depName))
    .map(depName => `${depName}@workspace:*`)
}

export function createWorkspaceSpecs (specs: string[], workspacePackages: WorkspacePackages): string[] {
  return specs.map((spec) => {
    const parsed = parseWantedDependency(spec)
    if (!parsed.alias) throw new PnpmError('NO_PKG_NAME_IN_SPEC', `Cannot update/install from workspace through "${spec}"`)
    if (!workspacePackages.has(parsed.alias)) throw new PnpmError('WORKSPACE_PACKAGE_NOT_FOUND', `"${parsed.alias}" not found in the workspace`)
    if (!parsed.bareSpecifier) return `${parsed.alias}@workspace:*`
    if (parsed.bareSpecifier.startsWith('workspace:')) return spec
    return `${parsed.alias}@workspace:${parsed.bareSpecifier}`
  })
}
