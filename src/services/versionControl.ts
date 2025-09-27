export interface VersionInfo {
  version: number;
  timestamp: number;
  data: any;
  changedBy: string;
  name: string;
  changeDescription: string;
}

export class VersionControlService {
  private versions: Map<string, VersionInfo[]> = new Map();

  async getVersionHistory(designId: string): Promise<VersionInfo[]> {
    const versions = this.versions.get(designId) || [];
    return versions.sort((a, b) => b.version - a.version);
  }

  async rollbackToVersion(designId: string, version: number, user: string): Promise<VersionInfo> {
    const versions = this.versions.get(designId);
    if (!versions) {
      throw new Error('Design not found');
    }

    const targetVersion = versions.find(v => v.version === version);
    if (!targetVersion) {
      throw new Error('Version not found');
    }

    // Create a new version that is a copy of the target version
    const newVersion = this.createNewVersion(
      designId,
      targetVersion.data,
      {
        name: `Rollback to version ${version}`,
        changedBy: user,
        changeDescription: `Rolled back to version ${version}`
      }
    );

    return newVersion;
  }

  createNewVersion(
    designId: string,
    data: any,
    metadata: {
      name: string;
      changedBy: string;
      changeDescription: string;
    }
  ): VersionInfo {
    const versions = this.versions.get(designId) || [];
    const nextVersion = versions.length + 1;

    const newVersion: VersionInfo = {
      version: nextVersion,
      timestamp: Date.now(),
      data,
      changedBy: metadata.changedBy,
      name: metadata.name,
      changeDescription: metadata.changeDescription
    };

    versions.push(newVersion);
    this.versions.set(designId, versions);
    return newVersion;
  }

  getVersion(designId: string, version?: number): VersionInfo | null {
    const versions = this.versions.get(designId);
    if (!versions) return null;

    if (version === undefined) {
      // Get latest version
      return versions[versions.length - 1];
    }

    return versions.find(v => v.version === version) || null;
  }

  getHistory(designId: string): VersionInfo[] | null {
    return this.versions.get(designId) || null;
  }

  revertToVersion(designId: string, version: number): VersionInfo | null {
    const versions = this.versions.get(designId);
    if (!versions) return null;

    const targetVersion = versions.find(v => v.version === version);
    if (!targetVersion) return null;

    // Create new version with reverted content
    return this.createNewVersion(
      designId,
      targetVersion.data,
      {
        name: targetVersion.name,
        changedBy: targetVersion.changedBy,
        changeDescription: `Reverted to version ${version}`
      }
    );
  }

  deleteVersion(designId: string, version: number): boolean {
    const versions = this.versions.get(designId);
    if (!versions) return false;

    const index = versions.findIndex(v => v.version === version);
    if (index === -1) return false;

    // Don't allow deleting the only version
    if (versions.length === 1) return false;

    versions.splice(index, 1);
    this.versions.set(designId, versions);
    return true;
  }
}

export const versionControl = new VersionControlService();