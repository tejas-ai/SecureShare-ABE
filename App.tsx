import React, { useState, useEffect } from 'react';
import { User, UserRole, SecureFile, AccessRequest, FileStatus } from './types';
import { MOCK_ADMIN, MOCK_USER, INITIAL_FILES } from './constants';
import { Button } from './components/Button';
import { SecurityChat } from './components/SecurityChat';
import { 
  Shield, 
  Lock, 
  Unlock, 
  FileText, 
  Download, 
  Upload, 
  UserCheck, 
  LogOut, 
  Key,
  AlertCircle,
  CheckCircle,
  Search,
  X
} from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [files, setFiles] = useState<SecureFile[]>(INITIAL_FILES);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [myUnlockedFiles, setMyUnlockedFiles] = useState<string[]>([]); // Array of file IDs
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'requests'>('files');
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // --- Temporary Key Input State ---
  const [keyInputFileId, setKeyInputFileId] = useState<string | null>(null);
  const [keyInputValue, setKeyInputValue] = useState('');

  // --- Upload Modal State ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState('');

  // --- Effects ---
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // --- Handlers ---

  const handleLogin = (role: UserRole) => {
    setCurrentUser(role === UserRole.ADMIN ? MOCK_ADMIN : MOCK_USER);
    setNotification({ msg: `Welcome back, ${role === UserRole.ADMIN ? 'Administrator' : 'User'}`, type: 'success' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMyUnlockedFiles([]);
    setKeyInputFileId(null);
    setIsUploadModalOpen(false);
    setUploadFile(null);
    setUploadKey('');
  };

  const handleRequestAccess = (file: SecureFile) => {
    if (!currentUser) return;
    
    // Check if already requested
    const existing = requests.find(r => r.fileId === file.id && r.userId === currentUser.id);
    if (existing) {
      setNotification({ msg: "Request already pending.", type: 'error' });
      return;
    }

    const newRequest: AccessRequest = {
      id: `req-${Date.now()}`,
      fileId: file.id,
      userId: currentUser.id,
      userName: currentUser.name,
      status: 'PENDING',
      requestDate: new Date().toLocaleDateString()
    };
    setRequests([...requests, newRequest]);
    setNotification({ msg: "Access request sent to Admin.", type: 'success' });
  };

  const handleApproveRequest = (reqId: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === reqId) {
        // Find the file to get its secret key (simulated logic)
        const file = files.find(f => f.id === req.fileId);
        return { 
          ...req, 
          status: 'APPROVED', 
          generatedKey: file?.encryptedKey || 'ABE-GEN-ERROR' 
        };
      }
      return req;
    }));
    setNotification({ msg: "Request approved. Key generated.", type: 'success' });
  };

  const handleDecrypt = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    if (keyInputValue === file.encryptedKey) {
      setMyUnlockedFiles([...myUnlockedFiles, fileId]);
      setKeyInputFileId(null);
      setKeyInputValue('');
      setNotification({ msg: "Decryption successful. File unlocked.", type: 'success' });
    } else {
      setNotification({ msg: "Invalid Secret Key.", type: 'error' });
    }
  };

  const handleDownload = (file: SecureFile) => {
    try {
      let blob: Blob;
      let filename = file.name;

      if (file.fileContent) {
        // Use the actual file content if available (uploaded in this session)
        blob = file.fileContent;
      } else {
        // Mock content for demo files that don't have real content attached
        const mockContent = `This is the decrypted content for ${file.name}.\n\nSecureShare employs Attribute-Based Encryption (ABE) to ensure only authorized personnel can access this data. In a real deployment, this file would be streamed from our secure encrypted cloud storage.`;
        blob = new Blob([mockContent], { type: 'text/plain' });
        // Ensure mock files have an extension for browser handling
        if (!filename.includes('.')) {
            filename += '.txt';
        }
      }

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setNotification({ msg: `Downloading ${filename}...`, type: 'success' });
    } catch (error) {
      console.error("Download failed:", error);
      setNotification({ msg: "Download failed. Please try again.", type: 'error' });
    }
  };

  const handleOpenUploadModal = () => {
    setUploadFile(null);
    setUploadKey('');
    setIsUploadModalOpen(true);
  };

  const handleConfirmUpload = () => {
    if (uploadFile && uploadKey && currentUser) {
      const newFile: SecureFile = {
        id: `f-${Date.now()}`,
        name: uploadFile.name,
        size: `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadDate: new Date().toLocaleDateString(),
        owner: currentUser.id,
        sensitivityLevel: 'Medium',
        description: 'Uploaded via SecureShare Portal',
        encryptedKey: uploadKey,
        fileContent: uploadFile // Store the actual file object for download
      };
      setFiles([newFile, ...files]);
      setNotification({ msg: "File encrypted and uploaded securely with custom key.", type: 'success' });
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadKey('');
    }
  };

  // --- Render Helpers ---

  const getFileStatusForUser = (file: SecureFile): FileStatus => {
    if (!currentUser) return FileStatus.LOCKED;
    if (currentUser.role === UserRole.ADMIN) return FileStatus.APPROVED; // Admin sees everything
    
    if (myUnlockedFiles.includes(file.id)) return FileStatus.UNLOCKED;

    const req = requests.find(r => r.fileId === file.id && r.userId === currentUser.id);
    if (req) {
      if (req.status === 'APPROVED') return FileStatus.APPROVED;
      if (req.status === 'PENDING') return FileStatus.PENDING;
    }
    return FileStatus.LOCKED;
  };

  // --- Main Render ---

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-blue-600 p-8 text-center">
            <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">SecureShare ABE</h1>
            <p className="text-blue-100 text-sm">Attribute-Based Encryption Storage System</p>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-slate-600 text-center mb-6">Select a role to simulate the secure environment.</p>
            <Button onClick={() => handleLogin(UserRole.ADMIN)} className="w-full justify-center py-3" variant="primary">
              <Shield className="w-4 h-4" /> Login as Administrator
            </Button>
            <Button onClick={() => handleLogin(UserRole.USER)} className="w-full justify-center py-3" variant="secondary">
              <UserCheck className="w-4 h-4" /> Login as Researcher
            </Button>
          </div>
          <div className="bg-slate-50 p-4 text-center text-xs text-slate-500 border-t border-slate-100">
            Powered by pyAesCrypt & Cloud Computing Principles
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0">
        <div className="p-6 flex items-center gap-2 text-white font-bold text-xl border-b border-slate-800">
          <Shield className="w-6 h-6 text-blue-500" />
          <span>SecureShare</span>
        </div>
        
        <div className="p-6">
          <div className="mb-8">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Menu</div>
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('files')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-3 ${activeTab === 'files' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
              >
                <FileText className="w-4 h-4" /> All Files
              </button>
              {currentUser.role === UserRole.ADMIN && (
                <button 
                  onClick={() => setActiveTab('requests')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-3 ${activeTab === 'requests' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
                >
                  <UserCheck className="w-4 h-4" /> 
                  Access Requests
                  {requests.filter(r => r.status === 'PENDING').length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {requests.filter(r => r.status === 'PENDING').length}
                    </span>
                  )}
                </button>
              )}
            </nav>
          </div>

          <div className="mt-auto">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <p className="text-xs text-slate-400 mb-1">Logged in as</p>
              <p className="font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
              <div className="mt-2 text-[10px] bg-slate-700 inline-block px-2 py-0.5 rounded text-blue-300">
                {currentUser.role}
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-slate-800" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            {activeTab === 'files' ? 'Encrypted File Repository' : 'Access Control Management'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <Button variant="ghost" size="sm" className="!p-2 text-slate-400 hover:text-blue-500">
                <Shield className="w-5 h-5" />
              </Button>
            </div>
            <Button variant="primary" onClick={handleOpenUploadModal}>
              <Upload className="w-4 h-4" /> Upload File
            </Button>
          </div>
        </header>

        {/* Notifications */}
        {notification && (
          <div className={`fixed top-20 right-6 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 animate-in slide-in-from-right fade-in ${
            notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
          }`}>
            {notification.msg}
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          
          {/* FILES TAB */}
          {activeTab === 'files' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {files.map(file => {
                const status = getFileStatusForUser(file);
                return (
                  <div key={file.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-2 rounded-lg ${
                          status === FileStatus.UNLOCKED ? 'bg-emerald-50 text-emerald-600' : 
                          status === FileStatus.APPROVED ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          <FileText className="w-6 h-6" />
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                           file.sensitivityLevel === 'Top Secret' ? 'bg-red-100 text-red-600' : 
                           file.sensitivityLevel === 'High' ? 'bg-orange-100 text-orange-600' :
                           'bg-blue-100 text-blue-600'
                        }`}>
                          {file.sensitivityLevel}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-800 truncate mb-1">{file.name}</h3>
                      <p className="text-sm text-slate-500 mb-4">{file.size} • {file.uploadDate}</p>
                      <p className="text-xs text-slate-400 line-clamp-2">{file.description}</p>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      {/* ADMIN VIEW */}
                      {currentUser.role === UserRole.ADMIN ? (
                         <div className="flex flex-col gap-2">
                            <span className="text-xs text-slate-400 font-mono block">Key: {file.encryptedKey}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50" 
                              onClick={() => handleDownload(file)}
                            >
                              <Download className="w-4 h-4" /> Admin Download
                            </Button>
                         </div>
                      ) : (
                        /* USER VIEW */
                        <>
                          {status === FileStatus.LOCKED && (
                            <Button onClick={() => handleRequestAccess(file)} className="w-full justify-center">
                              <Lock className="w-4 h-4" /> Request Access
                            </Button>
                          )}
                          {status === FileStatus.PENDING && (
                             <div className="text-center py-2 text-sm text-amber-600 font-medium bg-amber-50 rounded-lg">
                                Pending Approval...
                             </div>
                          )}
                          {status === FileStatus.APPROVED && keyInputFileId !== file.id && (
                             <Button onClick={() => setKeyInputFileId(file.id)} variant="secondary" className="w-full justify-center text-blue-700 bg-blue-50 hover:bg-blue-100">
                                <Key className="w-4 h-4" /> Enter Secret Key
                             </Button>
                          )}
                          {status === FileStatus.APPROVED && keyInputFileId === file.id && (
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Key..."
                                value={keyInputValue}
                                onChange={(e) => setKeyInputValue(e.target.value)}
                              />
                              <Button onClick={() => handleDecrypt(file.id)} className="!px-3">
                                <Unlock className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {status === FileStatus.UNLOCKED && (
                            <Button 
                              onClick={() => handleDownload(file)}
                              variant="secondary" 
                              className="w-full justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 shadow-sm transition-all"
                            >
                               <Download className="w-4 h-4" /> Download File
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* REQUESTS TAB (Admin Only) */}
          {activeTab === 'requests' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-200">
                     <tr>
                       <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Request ID</th>
                       <th className="px-6 py-4 font-semibold text-slate-700 text-sm">User</th>
                       <th className="px-6 py-4 font-semibold text-slate-700 text-sm">File Requested</th>
                       <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Date</th>
                       <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Status</th>
                       <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {requests.length === 0 ? (
                       <tr>
                         <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                           No requests found.
                         </td>
                       </tr>
                     ) : requests.map(req => {
                        const file = files.find(f => f.id === req.fileId);
                        return (
                          <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-slate-600 font-mono">{req.id}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                                  {req.userName.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-slate-700">{req.userName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{file?.name || 'Unknown File'}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{req.requestDate}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {req.status === 'PENDING' && (
                                <div className="flex justify-end gap-2">
                                  <Button onClick={() => handleApproveRequest(req.id)} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white !px-3 !py-1">
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="danger" className="!px-3 !py-1">
                                    Deny
                                  </Button>
                                </div>
                              )}
                              {req.status === 'APPROVED' && (
                                <div className="text-xs text-slate-400 font-mono">
                                  Key Sent: {req.generatedKey}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                     })}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Floating Chat */}
      {showChat && (
        <SecurityChat onClose={() => setShowChat(false)} />
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-800">Secure File Upload</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select File to Encrypt</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative group">
                  {uploadFile ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-blue-600">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                         <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium truncate max-w-xs">{uploadFile.name}</span>
                      <span className="text-xs text-slate-400">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">
                      <Upload className="w-8 h-8 mx-auto mb-2 opacity-50 group-hover:scale-110 transition-transform" />
                      <p className="font-medium text-slate-600">Click to browse files</p>
                      <p className="text-xs">Supports PDF, CSV, DOCX</p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => e.target.files && setUploadFile(e.target.files[0])}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Define Secret Key</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    placeholder="Enter custom encryption key..."
                    value={uploadKey}
                    onChange={(e) => setUploadKey(e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 text-amber-500 flex-shrink-0" />
                  This key will be required for decryption by authorized users.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmUpload} disabled={!uploadFile || !uploadKey} className="min-w-[120px]">
                <Lock className="w-4 h-4" /> Encrypt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;