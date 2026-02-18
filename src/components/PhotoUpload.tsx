import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';

interface Props {
  file: File | null;
  preview: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

export default function PhotoUpload({ file, preview, onFileSelect, onClear }: Props) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    multiple: false,
  });

  if (preview && file) {
    return (
      <div className="relative">
        <img src={preview} alt="Scoresheet preview" className="w-full max-h-96 object-contain rounded-lg border border-gray-200" />
        <button
          onClick={onClear}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
        >
          <X size={16} />
        </button>
        <p className="text-sm text-gray-500 mt-2">{file.name}</p>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto mb-3 text-gray-400" size={40} />
      <p className="text-gray-600 font-medium">Drop scoresheet photo here or click to browse</p>
      <p className="text-gray-400 text-sm mt-1">Supports JPEG, PNG, WebP</p>
    </div>
  );
}
