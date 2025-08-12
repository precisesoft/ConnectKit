import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  IconButton,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close,
  Warning,
  Error,
  Info,
  CheckCircle,
  Help,
} from '@mui/icons-material';

export interface ConfirmDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  
  /**
   * Dialog title
   */
  title: string;
  
  /**
   * Dialog message/content
   */
  message: string | React.ReactNode;
  
  /**
   * Confirm button text
   */
  confirmText?: string;
  
  /**
   * Cancel button text
   */
  cancelText?: string;
  
  /**
   * Dialog type/severity
   */
  type?: 'default' | 'danger' | 'warning' | 'info' | 'success';
  
  /**
   * Whether the action is dangerous
   */
  danger?: boolean;
  
  /**
   * Whether to show close button
   */
  showCloseButton?: boolean;
  
  /**
   * Custom icon
   */
  icon?: React.ReactNode;
  
  /**
   * Whether confirm button is loading
   */
  loading?: boolean;
  
  /**
   * Whether confirm button is disabled
   */
  disabled?: boolean;
  
  /**
   * Called when confirm button is clicked
   */
  onConfirm: () => void;
  
  /**
   * Called when cancel button is clicked or dialog is closed
   */
  onCancel: () => void;
  
  /**
   * Called when dialog is closed (ESC, backdrop click, etc.)
   */
  onClose?: () => void;
  
  /**
   * Maximum width of the dialog
   */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Additional props for the Dialog component
   */
  DialogProps?: any;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default',
  danger = false,
  showCloseButton = true,
  icon,
  loading = false,
  disabled = false,
  onConfirm,
  onCancel,
  onClose,
  maxWidth = 'sm',
  DialogProps = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Determine dialog type based on props
  const dialogType = danger ? 'danger' : type;

  // Get icon based on type
  const getTypeIcon = () => {
    if (icon) return icon;
    
    switch (dialogType) {
      case 'danger':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'info':
        return <Info color="info" />;
      case 'success':
        return <CheckCircle color="success" />;
      default:
        return <Help color="action" />;
    }
  };

  // Get confirm button color
  const getConfirmButtonColor = () => {
    switch (dialogType) {
      case 'danger':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      default:
        return 'primary';
    }
  };

  const handleClose = (_: any, reason?: string) => {
    // Don't close on backdrop click for dangerous actions
    if (reason === 'backdropClick' && danger) {
      return;
    }
    
    if (onClose) {
      onClose();
    } else {
      onCancel();
    }
  };

  const handleConfirm = () => {
    if (!loading && !disabled) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onCancel();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={isMobile && maxWidth === 'xl'}
      disableEscapeKeyDown={danger}
      {...DialogProps}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: theme.spacing(1.5),
          ...DialogProps.sx,
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pr: showCloseButton ? 6 : 3,
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          {getTypeIcon()}
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        
        {showCloseButton && !danger && (
          <IconButton
            aria-label="close"
            onClick={handleCancel}
            disabled={loading}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <Close />
          </IconButton>
        )}
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ pt: 0 }}>
        {typeof message === 'string' ? (
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>
            {message}
          </DialogContentText>
        ) : (
          message
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          gap: 1,
          flexDirection: isMobile ? 'column-reverse' : 'row',
        }}
      >
        <Button
          onClick={handleCancel}
          disabled={loading}
          fullWidth={isMobile}
          sx={{ 
            textTransform: 'none',
            minWidth: isMobile ? undefined : 100,
          }}
        >
          {cancelText}
        </Button>
        
        <Button
          onClick={handleConfirm}
          color={getConfirmButtonColor() as any}
          variant="contained"
          disabled={loading || disabled}
          fullWidth={isMobile}
          sx={{ 
            textTransform: 'none',
            minWidth: isMobile ? undefined : 100,
            ...(loading && {
              pointerEvents: 'none',
            }),
          }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Convenience function to show confirmation dialog
export const showConfirmDialog = (options: Omit<ConfirmDialogProps, 'open'>) => {
  return new Promise<boolean>((resolve) => {
    const handleConfirm = () => {
      options.onConfirm();
      resolve(true);
    };

    const handleCancel = () => {
      options.onCancel();
      resolve(false);
    };

    // This would typically be implemented with a global dialog provider/context
    // For now, this is just a placeholder for the API
    console.log('showConfirmDialog called with options:', {
      ...options,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    });
  });
};

export default ConfirmDialog;