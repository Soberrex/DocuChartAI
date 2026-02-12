import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Paper,
    CircularProgress,
    Typography,
    useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MessageBubble from './MessageBubble';
import type { Message } from '../services/api';

interface ChatInterfaceProps {
    messages: Message[];
    onSendMessage: (message: string) => void;
    loading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    onSendMessage,
    loading,
}) => {
    const theme = useTheme();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (input.trim() && !loading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
            }}
        >
            {/* Messages Area */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 3,
                }}
            >
                {messages.length === 0 ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'text.secondary',
                            gap: 2,
                            opacity: 0.7,
                        }}
                    >
                        <AutoAwesomeIcon sx={{ fontSize: 64, opacity: 0.2, color: 'primary.main' }} />
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Welcome to DocuChat AI
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.6, textAlign: 'center', maxWidth: 400 }}>
                            Upload documents and ask questions. I can visualize data and cite sources.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))}
                        {loading && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 6, my: 2, opacity: 0.6 }}>
                                <CircularProgress size={18} />
                                <Typography variant="caption">Thinking...</Typography>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </Box>

            {/* Input Area */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(26, 26, 46, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Ask a question about your documents..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        variant="outlined"
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'primary.main',
                                },
                            },
                        }}
                    />
                    <IconButton
                        color="primary"
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        sx={{
                            background: theme.palette.mode === 'dark'
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            color: 'white',
                            borderRadius: 2,
                            width: 44,
                            height: 44,
                            '&:hover': {
                                background: theme.palette.mode === 'dark'
                                    ? 'linear-gradient(135deg, #5a6fd6 0%, #6a4396 100%)'
                                    : 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
                            },
                            '&:disabled': {
                                background: theme.palette.action.disabledBackground,
                            },
                        }}
                    >
                        <SendIcon />
                    </IconButton>
                </Box>
            </Paper>
        </Box>
    );
};

export default ChatInterface;
