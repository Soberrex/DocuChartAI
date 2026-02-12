import React, { useState, useEffect } from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    IconButton,
    Typography,
    Box,
    Divider,
    TextField,
    InputAdornment,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import type { Conversation } from '../services/api';

interface ConversationSidebarProps {
    open: boolean;
    conversations: Conversation[];
    currentConversationId: string | null;
    onSelectConversation: (conversationId: string) => void;
    onNewConversation: () => void;
    onDeleteConversation: (conversationId: string) => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
    open,
    conversations,
    currentConversationId,
    onSelectConversation,
    onNewConversation,
    onDeleteConversation,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredConversations, setFilteredConversations] = useState(conversations);

    useEffect(() => {
        if (searchQuery) {
            setFilteredConversations(
                conversations.filter((conv) =>
                    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        } else {
            setFilteredConversations(conversations);
        }
    }, [searchQuery, conversations]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <Drawer
            anchor="left"
            open={open}
            variant="persistent"
            sx={{
                width: 280,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: 280,
                    boxSizing: 'border-box',
                    mt: '64px',
                    bgcolor: '#16162a',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                },
            }}
        >
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Conversations</Typography>
                    <IconButton onClick={onNewConversation} size="small" sx={{ color: 'primary.main' }}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                </Box>

                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" sx={{ opacity: 0.4 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontSize: '0.8rem',
                        },
                    }}
                />
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

            <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
                {filteredConversations.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ opacity: 0.4 }}>
                            {searchQuery ? 'No results' : 'No conversations yet'}
                        </Typography>
                    </Box>
                ) : (
                    filteredConversations.map((conversation) => (
                        <ListItem
                            key={conversation.id}
                            disablePadding
                            secondaryAction={
                                <IconButton
                                    edge="end"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteConversation(conversation.id);
                                    }}
                                    size="small"
                                    sx={{ opacity: 0.3, '&:hover': { opacity: 1, color: 'error.main' } }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            }
                        >
                            <ListItemButton
                                selected={conversation.id === currentConversationId}
                                onClick={() => onSelectConversation(conversation.id)}
                                sx={{
                                    py: 1.5,
                                    '&.Mui-selected': {
                                        bgcolor: 'rgba(102, 126, 234, 0.12)',
                                        borderLeft: '3px solid',
                                        borderColor: 'primary.main',
                                    },
                                }}
                            >
                                <ListItemText
                                    primary={conversation.title}
                                    secondary={formatDate(conversation.updated_at || conversation.created_at)}
                                    primaryTypographyProps={{
                                        noWrap: true,
                                        variant: 'body2',
                                        sx: { fontSize: '0.8rem' },
                                    }}
                                    secondaryTypographyProps={{
                                        variant: 'caption',
                                        sx: { opacity: 0.4 },
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))
                )}
            </List>
        </Drawer>
    );
};

export default ConversationSidebar;
