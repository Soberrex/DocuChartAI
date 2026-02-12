import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface FileUploadProps {
    onFileUpload: (file: File) => void;
    uploading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, uploading }) => {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                onFileUpload(acceptedFiles[0]);
            }
        },
        [onFileUpload]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/plain': ['.txt'],
            'text/csv': ['.csv'],
        },
        multiple: false,
        disabled: uploading,
    });

    return (
        <Paper
            {...getRootProps()}
            elevation={0}
            sx={{
                p: 3,
                textAlign: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'rgba(255,255,255,0.12)',
                bgcolor: isDragActive ? 'rgba(102, 126, 234, 0.08)' : 'rgba(255,255,255,0.02)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                    borderColor: uploading ? 'rgba(255,255,255,0.12)' : 'primary.main',
                    bgcolor: uploading ? 'transparent' : 'rgba(102, 126, 234, 0.05)',
                },
            }}
        >
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1, opacity: 0.7 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {isDragActive ? 'Drop here' : 'Drop file or click to upload'}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.5 }}>
                PDF, DOCX, XLSX, TXT, CSV
            </Typography>
            {uploading && (
                <Box sx={{ mt: 2 }}>
                    <LinearProgress sx={{ borderRadius: 1 }} />
                    <Typography variant="caption" sx={{ mt: 0.5, opacity: 0.6 }}>
                        Processing...
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default FileUpload;
