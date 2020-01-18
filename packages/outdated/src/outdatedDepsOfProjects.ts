import { Config } from '@pnpm/config'
import PnpmError from '@pnpm/error'
import {
  getLockfileImporterId,
  readCurrentLockfile,
  readWantedLockfile,
} from '@pnpm/lockfile-file'
import matcher from '@pnpm/matcher'
import { read as readModulesManifest } from '@pnpm/modules-yaml'
import storePath from '@pnpm/store-path'
import {
  IncludedDependencies,
  ProjectManifest,
} from '@pnpm/types'
import path = require('path')
import { createManifestGetter, ManifestGetterOptions } from './createManifestGetter'
import outdated from './outdated'

export default async function outdatedDepsOfProjects (
  pkgs: Array<{dir: string, manifest: ProjectManifest}>,
  args: string[],
  opts: Omit<ManifestGetterOptions, 'storeDir' | 'lockfileDir'> & {
    compatible?: boolean,
    include: IncludedDependencies,
  } & Partial<Pick<ManifestGetterOptions, 'storeDir' | 'lockfileDir'>>,
) {
  const lockfileDir = opts.lockfileDir ?? opts.dir
  const modules = await readModulesManifest(path.join(lockfileDir, 'node_modules'))
  const virtualStoreDir = modules?.virtualStoreDir ?? path.join(lockfileDir, 'node_modules/.pnpm')
  const currentLockfile = await readCurrentLockfile(virtualStoreDir, { ignoreIncompatible: false })
  const wantedLockfile = await readWantedLockfile(lockfileDir, { ignoreIncompatible: false }) || currentLockfile
  if (!wantedLockfile) {
    throw new PnpmError('OUTDATED_NO_LOCKFILE', 'No lockfile in this directory. Run `pnpm install` to generate one.')
  }
  const storeDir = await storePath(opts.dir, opts.storeDir)
  const getLatestManifest = createManifestGetter({
    ...opts,
    lockfileDir,
    storeDir,
  })
  return Promise.all(pkgs.map(async ({ dir, manifest }) => {
    let match = args.length && matcher(args) || undefined
    return {
      manifest,
      outdatedPackages: await outdated({
        compatible: opts.compatible,
        currentLockfile,
        getLatestManifest,
        include: opts.include,
        lockfileDir,
        manifest,
        match,
        prefix: dir,
        wantedLockfile,
      }),
      prefix: getLockfileImporterId(lockfileDir, dir),
    }
  }))
}
