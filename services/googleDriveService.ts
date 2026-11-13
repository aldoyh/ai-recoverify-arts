export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  iconLink?: string;
  webViewLink?: string;
  parents?: string[];
}

export interface ListDriveFilesResult {
  files: DriveFile[];
  nextPageToken?: string;
}

export class DriveAuthError extends Error {
  constructor(message = 'Google Drive session expired. Please sign in again.') {
    super(message);
    this.name = 'DriveAuthError';
  }
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

async function handleDriveResponse(res: Response): Promise<Response> {
  if (res.status === 401) {
    throw new DriveAuthError();
  }
  if (!res.ok) {
    let message = `Google Drive request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error?.message) {
        message = data.error.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(message);
  }
  return res;
}

export const isFolder = (file: DriveFile): boolean =>
  file.mimeType === 'application/vnd.google-apps.folder';

export const isImageFile = (file: DriveFile): boolean =>
  file.mimeType.startsWith('image/');

export const listDriveFiles = async (
  accessToken: string,
  options: {
    folderId?: string;
    searchQuery?: string;
    filterType?: 'all' | 'images' | 'folders';
    pageToken?: string;
    pageSize?: number;
  } = {}
): Promise<ListDriveFilesResult> => {
  const {
    folderId = 'root',
    searchQuery = '',
    filterType = 'all',
    pageToken,
    pageSize = 30,
  } = options;

  const clauses: string[] = ['trashed = false'];

  if (searchQuery.trim()) {
    const escaped = searchQuery.trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    clauses.push(`name contains '${escaped}'`);
  } else if (folderId) {
    clauses.push(`'${folderId}' in parents`);
  }

  if (filterType === 'images') {
    clauses.push("(mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.folder')");
  } else if (filterType === 'folders') {
    clauses.push("mimeType = 'application/vnd.google-apps.folder'");
  }

  const params = new URLSearchParams({
    q: clauses.join(' and '),
    pageSize: String(pageSize),
    orderBy: 'folder,modifiedTime desc',
    fields:
      'nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, iconLink, webViewLink, parents)',
  });

  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  const res = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  await handleDriveResponse(res);
  const data = await res.json();
  return {
    files: data.files || [],
    nextPageToken: data.nextPageToken,
  };
};

export const findFilesByName = async (
  accessToken: string,
  fileName: string,
  parentId = 'root'
): Promise<DriveFile[]> => {
  const escaped = fileName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const params = new URLSearchParams({
    q: `trashed = false and name = '${escaped}' and '${parentId}' in parents`,
    fields: 'files(id, name, mimeType, webViewLink)',
  });
  const res = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  await handleDriveResponse(res);
  const data = await res.json();
  return data.files || [];
};

export const downloadDriveFileBlob = async (
  accessToken: string,
  fileId: string
): Promise<Blob> => {
  const res = await fetch(`${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  await handleDriveResponse(res);
  return await res.blob();
};

export const uploadFileToDrive = async (
  accessToken: string,
  params: {
    name: string;
    blob: Blob;
    mimeType?: string;
    parentId?: string;
  }
): Promise<DriveFile> => {
  const { name, blob, mimeType = blob.type || 'application/octet-stream', parentId } = params;

  const metadata: Record<string, unknown> = {
    name,
    mimeType,
  };
  if (parentId && parentId !== 'root') {
    metadata.parents = [parentId];
  }

  const formData = new FormData();
  formData.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  formData.append('file', blob, name);

  const res = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,thumbnailLink,iconLink,webViewLink,parents`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  await handleDriveResponse(res);
  return await res.json();
};

export const overwriteDriveFile = async (
  accessToken: string,
  fileId: string,
  blob: Blob,
  mimeType?: string
): Promise<DriveFile> => {
  const res = await fetch(
    `${DRIVE_UPLOAD_BASE}/files/${encodeURIComponent(fileId)}?uploadType=media&fields=id,name,mimeType,size,modifiedTime,thumbnailLink,iconLink,webViewLink`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType || blob.type || 'application/octet-stream',
      },
      body: blob,
    }
  );

  await handleDriveResponse(res);
  return await res.json();
};

export const createDriveFolder = async (
  accessToken: string,
  name: string,
  parentId?: string
): Promise<DriveFile> => {
  const metadata: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId && parentId !== 'root') {
    metadata.parents = [parentId];
  }

  const res = await fetch(
    `${DRIVE_API_BASE}/files?fields=id,name,mimeType,modifiedTime,webViewLink,parents`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    }
  );

  await handleDriveResponse(res);
  return await res.json();
};

export const renameDriveFile = async (
  accessToken: string,
  fileId: string,
  newName: string
): Promise<DriveFile> => {
  const res = await fetch(
    `${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,modifiedTime,thumbnailLink,iconLink,webViewLink`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName }),
    }
  );

  await handleDriveResponse(res);
  return await res.json();
};

export const deleteDriveFile = async (
  accessToken: string,
  fileId: string
): Promise<void> => {
  const res = await fetch(`${DRIVE_API_BASE}/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  await handleDriveResponse(res);
};

export const imageUrlToBlob = async (imageUrl: string): Promise<{ blob: Blob; mimeType: string }> => {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return {
    blob,
    mimeType: blob.type || 'image/png',
  };
};
