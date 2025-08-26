import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Sparkles, Zap, BookOpen } from 'lucide-react';
import { DocumentFile } from '@/types';

interface FileUploadProps {
  onFileUploaded: (file: DocumentFile) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  acceptedFileTypes = ['.pdf', '.docx', '.odt'],
  maxFileSize = 50 * 1024 * 1024 // 50MB
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<DocumentFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      return `File type ${fileExtension} is not supported. Please upload ${acceptedFileTypes.join(', ')} files.`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<DocumentFile> => {
    const formData = new FormData();
    formData.append('pdf', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const documentFile: DocumentFile = {
            file,
            type: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.docx') ? 'docx' : 'odt',
            pages: 0, // Will be calculated by backend
            validationStatus: 'normalized'
          };
          resolve(documentFile);
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', '/api/upload-pdf');
      xhr.send(formData);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    setUploadProgress(0);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);

    try {
      const documentFile = await uploadFile(file);
      setUploadedFile(documentFile);
      onFileUploaded(documentFile);
    } catch (err) {
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onFileUploaded, maxFileSize, acceptedFileTypes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.oasis.opendocument.text': ['.odt']
    },
    multiple: false,
    disabled: uploading || !!uploadedFile
  });

  const resetUpload = () => {
    setUploadedFile(null);
    setError(null);
    setUploadProgress(0);
  };

  if (uploadedFile) {
    return (
      <div className="w-full">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 p-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-emerald-400 animate-pulse" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-emerald-800 mb-2">Fichier téléchargé avec succès !</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <p className="text-lg font-medium text-emerald-700">
                    {uploadedFile.file.name}
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-sm text-emerald-600">
                  <span className="bg-emerald-100 px-3 py-1 rounded-full font-medium">
                    {Math.round(uploadedFile.file.size / 1024)} KB
                  </span>
                  <span className="bg-emerald-100 px-3 py-1 rounded-full font-medium">
                    {uploadedFile.type.toUpperCase()}
                  </span>
                  <span className="bg-emerald-100 px-3 py-1 rounded-full font-medium">
                    ✓ Validé
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={resetUpload}
                className="bg-white/80 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 px-6 py-3 rounded-xl font-medium shadow-sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Changer de fichier
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
        </Alert>
      )}
      
      <div
        {...getRootProps()}
        className={`relative overflow-hidden border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer group ${
          isDragActive
            ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 scale-105 shadow-xl'
            : uploading
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:scale-102 hover:shadow-lg'
        }`}
      >
        <input {...getInputProps()} />
        
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 left-4 w-8 h-8 bg-blue-400 rounded-full"></div>
          <div className="absolute top-8 right-8 w-6 h-6 bg-purple-400 rounded-full"></div>
          <div className="absolute bottom-8 left-8 w-4 h-4 bg-green-400 rounded-full"></div>
          <div className="absolute bottom-4 right-4 w-10 h-10 bg-yellow-400 rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          {uploading ? (
            <div className="space-y-6">
              <div className="relative">
                <div className="w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-blue-500 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-800">Téléchargement en cours...</h3>
                <div className="max-w-md mx-auto">
                  <Progress value={uploadProgress} className="h-3 bg-gray-200" />
                  <p className="text-lg font-semibold text-blue-600 mt-2">{uploadProgress}% terminé</p>
                </div>
                <p className="text-gray-600">Votre document est en cours de traitement</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-8 w-8 text-yellow-400 animate-bounce" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-gray-800">
                  {isDragActive ? '📄 Déposez votre document ici' : '📚 Téléchargez votre document'}
                </h3>
                <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
                  {isDragActive 
                    ? 'Relâchez pour commencer la transformation magique !'
                    : 'Glissez-déposez un fichier PDF, DOCX ou ODT ici, ou cliquez pour parcourir'
                  }
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <span className="bg-gradient-to-r from-red-100 to-red-200 text-red-700 px-4 py-2 rounded-full font-semibold text-sm shadow-sm">
                  📄 PDF
                </span>
                <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 px-4 py-2 rounded-full font-semibold text-sm shadow-sm">
                  📝 DOCX
                </span>
                <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-700 px-4 py-2 rounded-full font-semibold text-sm shadow-sm">
                  📋 ODT
                </span>
                <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 px-4 py-2 rounded-full font-semibold text-sm shadow-sm">
                  📏 Max {Math.round(maxFileSize / (1024 * 1024))}MB
                </span>
              </div>
              
              <div className="pt-4">
                <div className="inline-flex items-center space-x-2 text-gray-500 text-sm">
                  <BookOpen className="h-4 w-4" />
                  <span>Transformez votre document en livre professionnel</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
