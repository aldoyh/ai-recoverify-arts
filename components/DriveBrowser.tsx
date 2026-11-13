import React, { useEffect, useState, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  DriveFile,
  DriveAuthError,
  listDriveFiles,
  downloadDriveFileBlob,
  uploadFileToDrive,
  createDriveFolder,
  renameDriveFile,
  deleteDriveFile,
  isFolder,
  isImageFile,
} from '../services/googleDriveService';
import { GoogleSignInButton } from './GoogleSignInButton';
import { LoadingSpinner } from './LoadingSpinner';
import { ConfirmDialogState } from './ConfirmModal';

interface DriveBrowserProps {
  user: User | null;
  accessToken: string | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  language: 'ar' | 'en';
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onAuthExpired: () => void;
  onEditDriveImage: (file: File) => void;
  onRequestConfirm: (dialog: ConfirmDialogState) => void;
  onCloseConfirm: () => void;
}

const formatFileSize = (bytesStr?: string): string => {
  if (!bytesStr) return '—';
  const bytes = Number(bytesStr);
  if (Number.isNaN(bytes) || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DriveBrowser: React.FC<DriveBrowserProps> = ({
  user,
  accessToken,
  needsAuth,
  isLoggingIn,
  language,
  onLogin,
  onLogout,
  onAuthExpired,
  onEditDriveImage,
  onRequestConfirm,
  onCloseConfirm,
}) => {
  const isAr = language === 'ar';
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'folders'>('all');
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: isAr ? 'ملفاتي' : 'My Drive' },
  ]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [renamingFile, setRenamingFile] = useState<DriveFile | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyFileId, setBusyFileId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentFolder = folderStack[folderStack.length - 1];

  const loadFiles = useCallback(
    async (pageToken?: string) => {
      if (!accessToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await listDriveFiles(accessToken, {
          folderId: currentFolder.id,
          searchQuery,
          filterType,
          pageToken,
          pageSize: 25,
        });
        if (pageToken) {
          setFiles((prev) => [...prev, ...res.files]);
        } else {
          setFiles(res.files);
        }
        setNextPageToken(res.nextPageToken);
      } catch (err) {
        if (err instanceof DriveAuthError) {
          onAuthExpired();
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load files from Google Drive.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, currentFolder.id, searchQuery, filterType, onAuthExpired]
  );

  useEffect(() => {
    if (accessToken && !needsAuth) {
      loadFiles();
    }
  }, [accessToken, needsAuth, loadFiles]);

  const handleUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    e.target.value = '';

    setIsUploading(true);
    setError(null);
    setStatusMessage(null);
    try {
      await uploadFileToDrive(accessToken, {
        name: file.name,
        blob: file,
        mimeType: file.type,
        parentId: currentFolder.id,
      });
      setStatusMessage(
        isAr ? `تم رفع "${file.name}" إلى Google Drive.` : `Uploaded "${file.name}" to Google Drive.`
      );
      await loadFiles();
    } catch (err) {
      if (err instanceof DriveAuthError) {
        onAuthExpired();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to upload file.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !accessToken) return;
    setError(null);
    setStatusMessage(null);
    try {
      await createDriveFolder(accessToken, newFolderName.trim(), currentFolder.id);
      setStatusMessage(
        isAr
          ? `تم إنشاء المجلد "${newFolderName.trim()}".`
          : `Created folder "${newFolderName.trim()}".`
      );
      setNewFolderName('');
      setShowNewFolderInput(false);
      await loadFiles();
    } catch (err) {
      if (err instanceof DriveAuthError) {
        onAuthExpired();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create folder.');
      }
    }
  };

  const handleOpenInEditor = async (file: DriveFile) => {
    if (!accessToken) {
      onAuthExpired();
      return;
    }
    setBusyFileId(file.id);
    setError(null);
    try {
      const blob = await downloadDriveFileBlob(accessToken, file.id);
      const localFile = new File([blob], file.name, {
        type: file.mimeType || blob.type || 'image/png',
      });
      onEditDriveImage(localFile);
    } catch (err) {
      if (err instanceof DriveAuthError) {
        onAuthExpired();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to download image for editing.');
      }
    } finally {
      setBusyFileId(null);
    }
  };

  const handleRequestRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingFile || !renameValue.trim() || !accessToken) return;
    const targetFile = renamingFile;
    const targetNewName = renameValue.trim();

    onRequestConfirm({
      isOpen: true,
      title: isAr ? 'تأكيد إعادة التسمية' : 'Confirm Rename',
      message: isAr
        ? `هل تريد بالتأكيد تغيير اسم الملف في Google Drive إلى "${targetNewName}"؟`
        : `Are you sure you want to rename this Google Drive item to "${targetNewName}"?`,
      items: [`${targetFile.name} → ${targetNewName}`],
      confirmLabel: isAr ? 'تأكيد التعديل' : 'Confirm Rename',
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      isDestructive: false,
      onConfirm: async () => {
        try {
          await renameDriveFile(accessToken, targetFile.id, targetNewName);
          onCloseConfirm();
          setRenamingFile(null);
          setRenameValue('');
          setStatusMessage(
            isAr ? `تم تغيير الاسم إلى "${targetNewName}".` : `Renamed to "${targetNewName}".`
          );
          await loadFiles();
        } catch (err) {
          onCloseConfirm();
          if (err instanceof DriveAuthError) {
            onAuthExpired();
          } else {
            setError(err instanceof Error ? err.message : 'Failed to rename file.');
          }
        }
      },
    });
  };

  const handleRequestDelete = (file: DriveFile) => {
    if (!accessToken) {
      onAuthExpired();
      return;
    }
    onRequestConfirm({
      isOpen: true,
      title: isAr ? 'تأكيد الحذف من Google Drive' : 'Delete from Google Drive?',
      message: isAr
        ? `هل أنت متأكد من حذف "${file.name}" نهائيًا من Google Drive؟ لا يمكن التراجع عن هذا الإجراء.`
        : `Are you sure you want to permanently delete "${file.name}" from Google Drive? This action cannot be undone.`,
      items: [file.name],
      confirmLabel: isAr ? 'حذف نهائي' : 'Delete',
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDriveFile(accessToken, file.id);
          onCloseConfirm();
          setStatusMessage(
            isAr ? `تم حذف "${file.name}".` : `Deleted "${file.name}".`
          );
          await loadFiles();
        } catch (err) {
          onCloseConfirm();
          if (err instanceof DriveAuthError) {
            onAuthExpired();
          } else {
            setError(err instanceof Error ? err.message : 'Failed to delete file.');
          }
        }
      },
    });
  };

  if (needsAuth || !accessToken) {
    return (
      <main className="bg-brand-red-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-brand-red-600 text-center">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-red-900/80 border border-brand-red-600 flex items-center justify-center">
            <svg className="w-9 h-9 text-red-100" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5L7.71 3.5zm8.58 0H8.86l6.56 11.5h7.43L16.29 3.5zM9.73 16L6.3 22h13.71l3.43-6H9.73z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isAr ? 'اربط حسابك في Google Drive' : 'Connect Your Google Drive'}
          </h2>
          <p className="text-red-100 text-sm leading-relaxed">
            {isAr
              ? 'استعرض صورك وملفاتك، وحمّل الصور مباشرة إلى محرر الصور بالذكاء الاصطناعي، واحفظ أغلفة يوتيوب والتصاميم المعدلة مباشرة في Google Drive.'
              : 'Browse your files, import images directly into the AI Image Editor, and save generated YouTube covers and artwork straight to your Google Drive.'}
          </p>
          <GoogleSignInButton
            onClick={onLogin}
            isLoading={isLoggingIn}
            label={isAr ? 'تسجيل الدخول عبر Google' : 'Sign in with Google'}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-red-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-brand-red-600">
      {/* Connected account bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-brand-red-600/80">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google User'}
              className="w-10 h-10 rounded-full border border-red-200/40"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-red-700 flex items-center justify-center font-bold text-white">
              {(user?.displayName || user?.email || 'G')[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-white">{user?.displayName || 'Google Drive'}</p>
            <p className="text-xs text-red-200">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="px-3 py-1.5 rounded-lg bg-brand-red-900/80 hover:bg-brand-red-700 border border-brand-red-600 text-xs font-semibold text-red-100 transition"
        >
          {isAr ? 'تسجيل الخروج' : 'Disconnect'}
        </button>
      </div>

      {/* Controls toolbar */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isAr ? 'ابحث في Google Drive...' : 'Search files in Google Drive...'}
          className="flex-1 bg-brand-red-900 border border-brand-red-600 rounded-lg px-3 py-2 text-sm text-white placeholder-red-200/50 focus:ring-2 focus:ring-white focus:outline-none"
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'images' | 'folders')}
            className="bg-brand-red-900 border border-brand-red-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-white focus:outline-none"
          >
            <option value="all">{isAr ? 'كل الملفات' : 'All Files'}</option>
            <option value="images">{isAr ? 'الصور والمجلدات' : 'Images & Folders'}</option>
            <option value="folders">{isAr ? 'المجلدات فقط' : 'Folders Only'}</option>
          </select>

          <button
            type="button"
            onClick={() => setShowNewFolderInput((v) => !v)}
            className="px-3 py-2 bg-brand-red-700 hover:bg-brand-red-600 text-white rounded-lg text-sm font-semibold transition"
          >
            {isAr ? '+ مجلد جديد' : '+ New Folder'}
          </button>

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-white hover:bg-red-50 text-brand-red-800 rounded-lg text-sm font-bold transition disabled:opacity-60"
          >
            {isUploading
              ? isAr
                ? 'جاري الرفع...'
                : 'Uploading...'
              : isAr
              ? 'رفع ملف'
              : 'Upload File'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUploadChange}
          />

          <button
            type="button"
            onClick={() => loadFiles()}
            className="px-3 py-2 bg-brand-red-900/80 hover:bg-brand-red-700 border border-brand-red-600 text-red-100 rounded-lg text-sm font-medium transition"
          >
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* New Folder Input */}
      {showNewFolderInput && (
        <form onSubmit={handleCreateFolder} className="mb-4 flex gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={isAr ? 'اسم المجلد الجديد...' : 'New folder name...'}
            className="flex-1 bg-brand-red-900 border border-brand-red-600 rounded-lg px-3 py-2 text-sm text-white placeholder-red-200/50 focus:ring-2 focus:ring-white focus:outline-none"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-white hover:bg-red-50 text-brand-red-800 rounded-lg text-sm font-bold transition"
          >
            {isAr ? 'إنشاء' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowNewFolderInput(false);
              setNewFolderName('');
            }}
            className="px-3 py-2 bg-brand-red-900 hover:bg-brand-red-700 text-red-100 rounded-lg text-sm transition"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        </form>
      )}

      {/* Rename Modal/Bar */}
      {renamingFile && (
        <form
          onSubmit={handleRequestRename}
          className="mb-4 p-3 rounded-lg bg-brand-red-900/90 border border-brand-red-500 flex flex-wrap items-center gap-2"
        >
          <span className="text-xs font-semibold text-red-200">
            {isAr ? 'إعادة تسمية:' : 'Rename:'}
          </span>
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="flex-1 min-w-[180px] bg-brand-red-800 border border-brand-red-600 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-white focus:outline-none"
            required
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-white hover:bg-red-50 text-brand-red-800 rounded-lg text-xs font-bold transition"
          >
            {isAr ? 'حفظ الاسم' : 'Save Name'}
          </button>
          <button
            type="button"
            onClick={() => {
              setRenamingFile(null);
              setRenameValue('');
            }}
            className="px-3 py-1.5 bg-brand-red-800 hover:bg-brand-red-700 text-red-100 rounded-lg text-xs transition"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        </form>
      )}

      {/* Breadcrumbs */}
      {!searchQuery && (
        <div className="flex items-center flex-wrap gap-1.5 text-xs text-red-200 mb-4">
          {folderStack.map((folder, index) => (
            <React.Fragment key={folder.id}>
              {index > 0 && <span>/</span>}
              <button
                type="button"
                onClick={() => setFolderStack(folderStack.slice(0, index + 1))}
                className={`hover:underline ${
                  index === folderStack.length - 1 ? 'font-bold text-white' : ''
                }`}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {statusMessage && (
        <div className="mb-4 p-3 rounded-lg bg-brand-red-900/80 border border-red-300/60 text-white text-sm">
          {statusMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/90 border border-red-400 text-red-100 text-sm">
          {error}
        </div>
      )}

      {isLoading && files.length === 0 ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner text={isAr ? 'جاري تحميل ملفات Drive...' : 'Loading Drive files...'} />
        </div>
      ) : files.length === 0 ? (
        <div className="py-12 text-center text-red-200">
          {isAr ? 'هذا المجلد فارغ أو لا توجد نتائج مطابقة.' : 'This folder is empty or no matching files were found.'}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pe-1">
          {files.map((file) => {
            const folder = isFolder(file);
            const image = isImageFile(file);
            const isBusy = busyFileId === file.id;

            return (
              <div
                key={file.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brand-red-900/60 hover:bg-brand-red-900/80 border border-brand-red-700/70 p-3 rounded-lg transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-md bg-brand-red-800/80 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {folder ? (
                      <svg className="w-6 h-6 text-red-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                      </svg>
                    ) : file.thumbnailLink ? (
                      <img
                        src={file.thumbnailLink}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : file.iconLink ? (
                      <img
                        src={file.iconLink}
                        alt=""
                        className="w-6 h-6"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    {folder ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setFolderStack([...folderStack, { id: file.id, name: file.name }]);
                        }}
                        className="text-sm font-bold text-white hover:underline truncate block max-w-full text-start"
                      >
                        {file.name}
                      </button>
                    ) : (
                      <p className="text-sm font-semibold text-white truncate" title={file.name}>
                        {file.name}
                      </p>
                    )}
                    <p className="text-xs text-red-200/80">
                      {folder ? (isAr ? 'مجلد' : 'Folder') : formatFileSize(file.size)}
                      {file.modifiedTime &&
                        ` • ${new Date(file.modifiedTime).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  {image && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleOpenInEditor(file)}
                      className="px-3 py-1.5 rounded-md bg-white hover:bg-red-50 text-brand-red-800 text-xs font-bold transition disabled:opacity-50"
                    >
                      {isBusy
                        ? isAr
                          ? 'جاري الفتح...'
                          : 'Opening...'
                        : isAr
                        ? 'تعديل بالذكاء الاصطناعي'
                        : 'Edit with AI'}
                    </button>
                  )}

                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-md bg-brand-red-800 hover:bg-brand-red-700 text-red-100 text-xs font-medium transition"
                    >
                      {isAr ? 'فتح في Drive' : 'Open'}
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setRenamingFile(file);
                      setRenameValue(file.name);
                    }}
                    className="px-2.5 py-1.5 rounded-md bg-brand-red-800 hover:bg-brand-red-700 text-red-100 text-xs font-medium transition"
                  >
                    {isAr ? 'إعادة تسمية' : 'Rename'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestDelete(file)}
                    className="px-2.5 py-1.5 rounded-md bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold transition"
                  >
                    {isAr ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {nextPageToken && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => loadFiles(nextPageToken)}
            className="px-4 py-2 rounded-lg bg-brand-red-700 hover:bg-brand-red-600 text-white text-sm font-semibold transition disabled:opacity-50"
          >
            {isLoading ? (isAr ? 'جاري التحميل...' : 'Loading...') : isAr ? 'تحميل المزيد' : 'Load More'}
          </button>
        </div>
      )}
    </main>
  );
};
