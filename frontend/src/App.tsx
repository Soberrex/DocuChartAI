import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MenuIcon from '@mui/icons-material/Menu';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import DocumentList from './components/DocumentList';
import ConversationSidebar from './components/ConversationSidebar';
import {
  uploadDocument,
  sendMessage,
  getDocuments,
  getConversations,
  getConversationHistory,
  createConversation,
  deleteConversation,
  type Message,
  type Document,
  type Conversation,
} from './services/api';
import { v4 as uuidv4 } from 'uuid';

// Persist session ID in localStorage
const getSessionId = (): string => {
  const stored = localStorage.getItem('rag_session_id');
  if (stored) return stored;
  const newId = uuidv4();
  localStorage.setItem('rag_session_id', newId);
  return newId;
};

// Persist theme preference
const getInitialTheme = (): 'dark' | 'light' => {
  const stored = localStorage.getItem('rag_theme_mode');
  return (stored as 'dark' | 'light') || 'dark';
};

function App() {
  const [mode, setMode] = useState<'dark' | 'light'>(getInitialTheme);
  const [sessionId] = useState(getSessionId);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Track initialization to prevent double calls (React 18 Strict Mode)
  const initialized = useRef(false);

  // Toggle color mode
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('rag_theme_mode', newMode);
          return newMode;
        });
      },
    }),
    [],
  );

  // Dynamic theme creation
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#667eea' : '#4f46e5',
            light: '#8fa4f0',
            dark: '#4a5fc7',
          },
          secondary: {
            main: '#f093fb',
          },
          background: {
            default: mode === 'dark' ? '#0f0f23' : '#f3f4f6',
            paper: mode === 'dark' ? '#1a1a2e' : '#ffffff',
          },
          text: {
            primary: mode === 'dark' ? '#e8e8f0' : '#1f2937',
            secondary: mode === 'dark' ? '#a0a0b8' : '#6b7280',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
        },
      }),
    [mode],
  );

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await getDocuments(sessionId);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }, [sessionId]);

  const loadConversations = useCallback(async () => {
    try {
      const convs = await getConversations(sessionId);
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [sessionId]);

  // Initialize on mount - fix double init
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        await loadDocuments();
        await loadConversations();

        // Check if we should create a new conversation or load existing
        const convs = await getConversations(sessionId);
        if (convs.length > 0) {
          // Load most recent conversation
          const lastConv = convs[0]; // Assuming backend returns sorted by updated_at desc
          setConversationId(lastConv.id);
          const msgs = await getConversationHistory(lastConv.id);
          setMessages(msgs);
        } else {
          // Only create new if none exist
          const conv = await createConversation(sessionId);
          setConversationId(conv.id);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadDocument(file, sessionId);
      showSnackbar(`${file.name} uploaded successfully!`, 'success');
      setTimeout(loadDocuments, 1500);
    } catch (error: any) {
      console.error('Upload failed:', error);
      showSnackbar(
        error.response?.data?.detail || 'Upload failed',
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!conversationId) {
      showSnackbar('Chat not initialized', 'error');
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await sendMessage(messageText, conversationId, sessionId);
      const assistantMsg: Message = {
        ...response.message,
        sources: response.sources || response.message.sources || [],
        chart_data: response.chart_data || response.message.chart_data,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // Reload conversations to update "time ago"
      loadConversations();
    } catch (error: any) {
      console.error('Failed to send message:', error);
      const errorMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: error.response?.data?.detail || 'Failed to get response. Is the backend running?',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    if (convId === conversationId) return;
    setConversationId(convId);
    try {
      const msgs = await getConversationHistory(convId);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const handleNewConversation = async () => {
    try {
      const conv = await createConversation(sessionId);
      setConversationId(conv.id);
      setMessages([]);
      await loadConversations();
      showSnackbar('New conversation started', 'info');
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await deleteConversation(convId);
      if (convId === conversationId) {
        // If deleting current, switch to another or create new
        const remaining = conversations.filter(c => c.id !== convId);
        if (remaining.length > 0) {
          handleSelectConversation(remaining[0].id);
        } else {
          handleNewConversation();
        }
      }
      await loadConversations();
      showSnackbar('Conversation deleted', 'info');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleDocumentDeleted = (id: string) => {
    showSnackbar('Document deleted successfully', 'success');
    loadDocuments();
    // Optionally reload chat if needed, but not strictly required
  };

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar>
            <Tooltip title="Conversations">
              <IconButton
                color="inherit"
                onClick={() => {
                  setSidebarOpen(!sidebarOpen);
                  if (!sidebarOpen) loadConversations();
                }}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
            <AutoAwesomeIcon sx={{ mr: 1.5, color: 'primary.main' }} />
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)'
                  : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              DocuChat AI
            </Typography>

            <Tooltip title={mode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton onClick={colorMode.toggleColorMode} color="inherit">
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* Conversation Sidebar */}
        <ConversationSidebar
          open={sidebarOpen}
          conversations={conversations}
          currentConversationId={conversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            ml: sidebarOpen ? '280px' : 0,
            transition: 'margin-left 0.3s ease',
          }}
        >
          {/* Left Panel - Upload + Documents */}
          <Box
            sx={{
              width: 320,
              minWidth: 320,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              p: 2,
              borderRight: '1px solid',
              borderColor: 'divider',
            }}
          >
            <FileUpload onFileUpload={handleFileUpload} uploading={uploading} />
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <DocumentList documents={documents} onDocumentDeleted={handleDocumentDeleted} />
            </Box>
          </Box>

          {/* Main Chat Area */}
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                display: 'flex',
                bgcolor: 'transparent',
              }}
            >
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={loading}
              />
            </Paper>
          </Box>
        </Box>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
