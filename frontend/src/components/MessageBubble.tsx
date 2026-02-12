import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    Chip,
    Collapse,
    IconButton,
    Tooltip,
} from '@mui/material';
import type { Message as MessageType } from '../services/api';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArticleIcon from '@mui/icons-material/Article';
import ChartVisualizer from './ChartVisualizer';

interface MessageBubbleProps {
    message: MessageType;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';
    const [sourcesOpen, setSourcesOpen] = useState(false);
    const hasSources = !isUser && message.sources && message.sources.length > 0;
    const hasChart = !isUser && message.chart_data;

    const getConfidenceColor = (confidence?: number) => {
        if (!confidence) return 'default';
        if (confidence >= 0.7) return 'success';
        if (confidence >= 0.4) return 'warning';
        return 'error';
    };

    const getConfidenceLabel = (confidence?: number) => {
        if (!confidence) return '';
        const pct = Math.round(confidence * 100);
        return `${pct}% confident`;
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                mb: 2,
                width: '100%',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    maxWidth: isUser ? '75%' : '85%', // Wider for assistant to fit charts
                    width: '100%',
                }}
            >
                <Avatar
                    sx={{
                        bgcolor: isUser
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        background: isUser
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
                        mx: 1,
                        width: 36,
                        height: 36,
                    }}
                >
                    {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
                </Avatar>

                <Box sx={{ maxWidth: '100%', minWidth: 0 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            bgcolor: isUser ? '#667eea' : 'rgba(255,255,255,0.08)',
                            color: isUser ? '#fff' : 'text.primary',
                            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            border: isUser ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {message.content}
                        </Typography>

                        {/* Chart Rendering */}
                        {hasChart && (
                            <Box sx={{ mt: 2, width: '100%', minWidth: 300 }}>
                                <ChartVisualizer
                                    data={message.chart_data}
                                    title={message.chart_data.title || "Data Visualization"}
                                    type={message.chart_data.type || 'bar'}
                                />
                            </Box>
                        )}
                    </Paper>

                    {/* Metadata row: confidence + sources toggle */}
                    {!isUser && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, px: 1 }}>
                            <Typography variant="caption" sx={{ opacity: 0.5 }}>
                                {new Date(message.created_at).toLocaleTimeString()}
                            </Typography>

                            {message.confidence !== undefined && message.confidence > 0 && (
                                <Tooltip title="RAG confidence score">
                                    <Chip
                                        icon={<VerifiedIcon />}
                                        label={getConfidenceLabel(message.confidence)}
                                        size="small"
                                        color={getConfidenceColor(message.confidence) as any}
                                        variant="outlined"
                                        sx={{ height: 22, fontSize: '0.7rem' }}
                                    />
                                </Tooltip>
                            )}

                            {hasSources && (
                                <Chip
                                    icon={sourcesOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    label={`${message.sources!.length} source${message.sources!.length > 1 ? 's' : ''}`}
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setSourcesOpen(!sourcesOpen)}
                                    sx={{ height: 22, fontSize: '0.7rem', cursor: 'pointer' }}
                                />
                            )}
                        </Box>
                    )}

                    {isUser && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, px: 1, opacity: 0.5, textAlign: 'right' }}>
                            {new Date(message.created_at).toLocaleTimeString()}
                        </Typography>
                    )}

                    {/* Collapsible sources */}
                    {hasSources && (
                        <Collapse in={sourcesOpen}>
                            <Box sx={{ mt: 1, px: 1, maxWidth: '100%' }}>
                                {message.sources!.map((source, idx) => (
                                    <Paper
                                        key={idx}
                                        elevation={0}
                                        sx={{
                                            p: 1.5,
                                            mb: 1,
                                            bgcolor: 'rgba(102, 126, 234, 0.08)',
                                            border: '1px solid rgba(102, 126, 234, 0.2)',
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                            <ArticleIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                {source.filename || `Source ${idx + 1}`}
                                            </Typography>
                                            {source.relevance_score && (
                                                <Typography variant="caption" sx={{ ml: 'auto', opacity: 0.6 }}>
                                                    {Math.round(source.relevance_score * 100)}% relevant
                                                </Typography>
                                            )}
                                        </Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                                            {source.content?.substring(0, 200)}
                                            {source.content && source.content.length > 200 ? '...' : ''}
                                        </Typography>
                                    </Paper>
                                ))}
                            </Box>
                        </Collapse>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default MessageBubble;
