import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface ContactRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  sender: User;
  receiver: User;
}

interface ContactState {
  contacts: User[];
  contactRequests: {
    sent: ContactRequest[];
    received: ContactRequest[];
  };
  loading: boolean;
  error: string | null;
}

const initialState: ContactState = {
  contacts: [],
  contactRequests: {
    sent: [],
    received: [],
  },
  loading: false,
  error: null,
};

// Get all contacts
export const getContacts = createAsyncThunk('contact/getContacts', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('No token found');
    }

    const response = await axios.get('/api/contacts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch contacts');
  }
});

// Get all contact requests
export const getContactRequests = createAsyncThunk('contact/getContactRequests', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('No token found');
    }

    const response = await axios.get('/api/contacts/requests', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch contact requests');
  }
});

// Send a contact request
export const sendContactRequest = createAsyncThunk(
  'contact/sendContactRequest',
  async (username: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const response = await axios.post(
        '/api/contacts/requests',
        { username },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send contact request');
    }
  }
);

// Accept a contact request
export const acceptContactRequest = createAsyncThunk(
  'contact/acceptContactRequest',
  async (requestId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const response = await axios.patch(`/api/contacts/requests/${requestId}/accept`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept contact request');
    }
  }
);

// Reject a contact request
export const rejectContactRequest = createAsyncThunk(
  'contact/rejectContactRequest',
  async (requestId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const response = await axios.patch(`/api/contacts/requests/${requestId}/reject`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject contact request');
    }
  }
);

// Remove a contact
export const removeContact = createAsyncThunk(
  'contact/removeContact',
  async (contactId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }

      const response = await axios.delete(`/api/contacts/${contactId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { contactId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove contact');
    }
  }
);

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateContactStatus: (state, action: PayloadAction<{ userId: string; isOnline: boolean; lastSeen?: Date }>) => {
      const { userId, isOnline, lastSeen } = action.payload;
      
      // Update in contacts list
      const contactIndex = state.contacts.findIndex(c => c.id === userId);
      if (contactIndex !== -1) {
        state.contacts[contactIndex].isOnline = isOnline;
        if (lastSeen) {
          state.contacts[contactIndex].lastSeen = lastSeen;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get contacts
      .addCase(getContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getContacts.fulfilled, (state, action: PayloadAction<{ data: { contacts: User[] } }>) => {
        state.loading = false;
        state.contacts = action.payload.data.contacts;
      })
      .addCase(getContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get contact requests
      .addCase(getContactRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getContactRequests.fulfilled,
        (state, action: PayloadAction<{ data: { received: ContactRequest[]; sent: ContactRequest[] } }>) => {
          state.loading = false;
          state.contactRequests.received = action.payload.data.received;
          state.contactRequests.sent = action.payload.data.sent;
        }
      )
      .addCase(getContactRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send contact request
      .addCase(sendContactRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        sendContactRequest.fulfilled,
        (state, action: PayloadAction<{ data: { contactRequest: ContactRequest } }>) => {
          state.loading = false;
          state.contactRequests.sent.push(action.payload.data.contactRequest);
        }
      )
      .addCase(sendContactRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Accept contact request
      .addCase(acceptContactRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        acceptContactRequest.fulfilled,
        (state, action: PayloadAction<{ data: { contactRequest: ContactRequest } }>) => {
          state.loading = false;
          const requestId = action.payload.data.contactRequest.id;
          
          // Remove from received requests
          state.contactRequests.received = state.contactRequests.received.filter(
            (request) => request.id !== requestId
          );
          
          // Add to contacts (if not already in the list and sender exists)
          const contactRequest = action.payload.data.contactRequest;
          if (contactRequest.sender) {
            const newContact = contactRequest.sender;
            if (!state.contacts.some((contact) => contact.id === newContact.id)) {
              state.contacts.push(newContact);
            }
          } else {
            // If sender is not available in the response, try to find it in our received requests
            const originalRequest = state.contactRequests.received.find(
              req => req.id === requestId
            );
            if (originalRequest && originalRequest.sender) {
              const newContact = originalRequest.sender;
              if (!state.contacts.some((contact) => contact.id === newContact.id)) {
                state.contacts.push(newContact);
              }
            }
          }
        }
      )
      .addCase(acceptContactRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Reject contact request
      .addCase(rejectContactRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        rejectContactRequest.fulfilled,
        (state, action: PayloadAction<{ data: { contactRequest: ContactRequest } }>) => {
          state.loading = false;
          const requestId = action.payload.data.contactRequest.id;
          
          // Remove from received requests
          state.contactRequests.received = state.contactRequests.received.filter(
            (request) => request.id !== requestId
          );
        }
      )
      .addCase(rejectContactRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Remove contact
      .addCase(removeContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeContact.fulfilled, (state, action: PayloadAction<{ contactId: string }>) => {
        state.loading = false;
        state.contacts = state.contacts.filter((contact) => contact.id !== action.payload.contactId);
      })
      .addCase(removeContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateContactStatus } = contactSlice.actions;
export default contactSlice.reducer; 