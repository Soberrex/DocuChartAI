import React, { useState } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemText,
    Typography,
    Chip,
    Paper,
    Divider,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Snackbar,
    Alert,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Document } from '../services/api';
import { deleteDocument } from '../services/api';

interface DocumentListProps {
    documents: Document[];
    onDocumentDeleted?: (id: string) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDocumentDeleted }) => {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await deleteDocument(deleteId);
            if (onDocumentDeleted) {
                onDocumentDeleted(deleteId);
            }
            setDeleteId(null);
        } catch (err: any) {
            console.error('Delete failed:', err);
            setError(err.response?.data?.detail || 'Failed to delete document');
        } finally {
            setDeleting(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ready':
                return <CheckCircleIcon color="success" fontSize="small" />;
            case 'processing':
                return <HourglassEmptyIcon color="warning" fontSize="small" />;
            case 'failed':
                return <ErrorIcon color="error" fontSize="small" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready':
                return 'success';
            case 'processing':
                return 'warning';
            case 'failed':
                return 'error';
            default:
                return 'default';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'transparent',
            }}
        >
            <Box sx={{ py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, opacity: 0.8 }}>
                    📁 Documents ({documents.length})
                </Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {documents.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <DescriptionIcon sx={{ fontSize: 36, mb: 1, opacity: 0.15 }} />
                        <Typography variant="caption" sx={{ opacity: 0.4, display: 'block' }}>
                            No documents yet
                        </Typography>
                    </Box>
                ) : (
                    <List dense disablePadding>
                        {documents.map((doc) => (
                            <ListItem
                                key={doc.id}
                                sx={{
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    py: 1.5,
                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                    position: 'relative',
                                    '&:hover': {
                                        bgcolor: 'rgba(102, 126, 234, 0.05)',
                                        '& .delete-btn': {
                                            opacity: 1,
                                        }
                                    },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                                    <DescriptionIcon sx={{ mr: 1, color: 'primary.main', fontSize: 18, opacity: 0.7 }} />
                                    <ListItemText
                                        primary={doc.original_filename}
                                        primaryTypographyProps={{
                                            variant: 'body2',
                                            noWrap: true,
                                            sx: { fontWeight: 500, fontSize: '0.8rem', pr: 4 },
                                        }}
                                    />
                                    <Tooltip title="Delete document">
                                        <IconButton
                                            className="delete-btn"
                                            size="small"
                                            onClick={(e) => handleDeleteClick(doc.id, e)}
                                            sx={{
                                                position: 'absolute',
                                                right: 8,
                                                top: 8,
                                                opacity: 0,
                                                transition: 'opacity 0.2s',
                                                color: 'error.main',
                                                padding: 0.5,
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', width: '100%', pl: 3.5 }}>
                                    <Chip
                                        label={doc.status}
                                        size="small"
                                        color={getStatusColor(doc.status) as any}
                                        icon={getStatusIcon(doc.status) || undefined}
                                        sx={{ fontSize: '0.65rem', height: 20 }}
                                    />
                                    <Typography variant="caption" sx={{ opacity: 0.5 }}>
                                        {formatFileSize(doc.file_size)}
                                    </Typography>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                PaperProps={{
                    sx: { bgcolor: 'background.paper', backgroundImage: 'none' }
                }}
            >
                <DialogTitle>Delete this document?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this document? This action cannot be undone.
                        Associated embeddings and chat context will be removed.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteId(null)} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" disabled={deleting} autoFocus>
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
            >
                <Alert onClose={() => setError(null)} severity="error">
                    {error}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default DocumentList;
