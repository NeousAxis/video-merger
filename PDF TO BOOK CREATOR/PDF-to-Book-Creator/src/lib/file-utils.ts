export const getFileType = (file: File): 'pdf' | 'docx' | 'odt' | 'unsupported' => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    case 'odt':
      return 'odt';
    default:
      return 'unsupported';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const estimatePageCount = async (file: File): Promise<number> => {
  // This is a simplified estimation - in a real app, you'd use a proper PDF parsing library
  const fileSizeInKB = file.size / 1024;
  
  // Rough estimation based on file type and size
  switch (getFileType(file)) {
    case 'pdf':
      // Average PDF page is ~50KB
      return Math.max(1, Math.round(fileSizeInKB / 50));
    case 'docx':
      // Average DOCX page is ~20KB
      return Math.max(1, Math.round(fileSizeInKB / 20));
    case 'odt':
      // Average ODT page is ~15KB
      return Math.max(1, Math.round(fileSizeInKB / 15));
    default:
      return 1;
  }
};

export const uploadFileToStorage = async (file: File): Promise<string> => {
  // In a real application, this would upload to a cloud storage service
  // For demo purposes, we'll create a mock URL
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Mock upload - replace with actual file upload service
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a mock URL - in production, this would be the actual uploaded file URL
    return `https://storage.example.com/uploads/${Date.now()}-${file.name}`;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
};

export const generateCoverFromTemplate = async (
  title: string,
  author: string,
  style: string,
  dimensions: { width: number; height: number },
  spineWidth: number,
  customImage?: File
): Promise<Blob> => {
  // This would generate a cover using canvas or a service like Bannerbear
  // For now, we'll create a simple colored rectangle as a placeholder
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Set dimensions (300 DPI)
  const dpi = 300;
  const width = (dimensions.width + spineWidth + dimensions.width) * dpi;
  const height = dimensions.height * dpi;
  
  canvas.width = width;
  canvas.height = height;
  
  // Fill background based on style
  const colors = {
    minimalist: '#f8f9fa',
    photo: '#1a1a1a',
    illustration: '#4f46e5',
  };
  
  ctx.fillStyle = colors[style as keyof typeof colors] || colors.minimalist;
  ctx.fillRect(0, 0, width, height);
  
  // Add title and author
  ctx.fillStyle = style === 'photo' ? '#ffffff' : '#1a1a1a';
  ctx.font = `${Math.round(48 * dpi / 72)}px Arial`;
  ctx.textAlign = 'center';
  
  const frontCenterX = dimensions.width * dpi / 2;
  const centerY = height / 2;
  
  ctx.fillText(title, frontCenterX, centerY - 50);
  ctx.font = `${Math.round(24 * dpi / 72)}px Arial`;
  ctx.fillText(author, frontCenterX, centerY + 100);
  
  return new Promise(resolve => {
    canvas.toBlob(resolve as BlobCallback, 'image/png', 1.0);
  });
};