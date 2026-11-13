import React, { useEffect, useState, useCallback } from 'react';
import {
  DriveFile,
  DriveAuthError,
  listDriveFiles,
  downloadDriveFileBlob,
  isFolder,
  isImageFile,
} from '../services/googleDriveService';
import { GoogleSignInButton } from './GoogleSignInButton';
import { LoadingSpinner } from './LoadingSpinner';

interface DrivePickerModalProps {
  isOpen: boolean;
  accessToken: string | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  language: 'ar' | 'en';
  onLogin: () => Promise<void>;
  onAuthExpired: () => void;
  onSelectFile: (file: File) => void;
  onClose: () => void;
}

export const DrivePickerModal: React.FC<DrivePickerModalProps> = ({
  isOpen,
  accessToken,
  needsAuth,
  isLoggingIn,
  language,
  onLogin,
  onAuthExpired,
  onSelectFile,
  onClose,
}) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: language === 'ar' ? 'ملفاتي' : 'My Drive' },
  ]);
  const [error, setError] = useState<string | null>(null);

  const isAr = language === 'ar';
  const currentFolder = folderStack[folderStack.length - 1];

  const loadFiles = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await listDriveFiles(accessToken, {
        folderId: currentFolder.id,
        searchQuery,
        filterType: 'images',
        pageSize: 40,
      });
      setFiles(res.files);
    } catch (err) {
      if (err instanceof DriveAuthError) {
        onAuthExpired();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load Google Drive files.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, currentFolder.id, searchQuery, onAuthExpired]);

  useEffect(() => {
    if (isOpen && accessToken && !needsAuth) {
      loadFiles();
    }
  }, [isOpen, accessToken, needsAuth, loadFiles]);

  if (!isOpen) return null;

  const handlePickImage = async (driveFile: DriveFile) => {
    if (!accessToken) {
      onAuthExpired();
      return;
    }
    setDownloadingId(driveFile.id);
    setError(null);
    try {
      const blob = await downloadDriveFileBlob(accessToken, driveFile.id);
      const localFile = new File([blob], driveFile.name, {
        type: driveFile.mimeType || blob.type || 'image/png',
      });
      onSelectFile(localFile);
      onClose();
    } catch (err) {
      if (err instanceof DriveAuthError) {
        onAuthExpired();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to download image from Drive.');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl bg-brand-red-900 border border-brand-red-600 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 bg-brand-red-800/80 border-b border-brand-red-600">
          <h3 className="text-xl font-bold text-white">
            {isAr ? 'اختر صورة من Google Drive' : 'Select an Image from Google Drive'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-red-200 hover:text-white p-1 rounded-lg transition"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {needsAuth || !accessToken ? (
            <div className="py-12 text-center flex flex-col items-center gap-4">
              <p className="text-red-100 max-w-md">
                {isAr
                  ? 'قم بتسجيل الدخول بحساب Google للوصول إلى صورك في Google Drive واستيرادها مباشرة إلى محرر الصور.'
                  : 'Sign in with your Google account to browse your Google Drive images and load them directly into the editor.'}
              </p>
              <GoogleSignInButton
                onClick={onLogin}
                isLoading={isLoggingIn}
                label={isAr ? 'تسجيل الدخول عبر Google' : 'Sign in with Google'}
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث في Google Drive...' : 'Search Google Drive...'}
                  className="flex-1 bg-brand-red-800/70 border border-brand-red-600 rounded-lg px-3 py-2 text-sm text-white placeholder-red-200/60 focus:ring-2 focus:ring-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={loadFiles}
                  className="px-4 py-2 bg-brand-red-700 hover:bg-brand-red-600 text-white rounded-lg text-sm font-semibold transition"
                >
                  {isAr ? 'تحديث' : 'Refresh'}
                </button>
              </div>

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

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-400 text-red-100 text-sm">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner text={isAr ? 'جاري تحميل الملفات...' : 'Loading Drive files...'} />
                </div>
              ) : files.length === 0 ? (
                <p className="py-12 text-center text-red-200">
                  {isAr ? 'لا توجد صور أو مجلدات مطابقة.' : 'No matching images or folders found.'}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {files.map((file) => {
                    const folder = isFolder(file);
                    const image = isImageFile(file);
                    const isDownloading = downloadingId === file.id;

                    return (
                      <button
                        key={file.id}
                        type="button"
                        disabled={isDownloading}
                        onClick={() => {
                          if (folder) {
                            setSearchQuery('');
                            setFolderStack([...folderStack, { id: file.id, name: file.name }]);
                          } else if (image) {
                            handlePickImage(file);
                          }
                        }}
                        className="group flex flex-col items-center p-3 rounded-lg bg-brand-red-800/60 hover:bg-brand-red-700/80 border border-brand-red-600/80 transition text-start disabled:opacity-60"
                      >
                        <div className="w-full aspect-square rounded-md bg-brand-red-900/70 flex items-center justify-center overflow-hidden mb-2">
                          {folder ? (
                            <svg className="w-12 h-12 text-red-200" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                            </svg>
                          ) : file.thumbnailLink ? (
                            <img
                              src={file.thumbnailLink}
                              alt={file.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <svg className="w-10 h-10 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <span className="w-full text-xs font-medium text-white truncate text-center">
                          {isDownloading ? (isAr ? 'جاري التحميل...' : 'Loading...') : file.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
