import api from './api';

export interface Note {
  _id: string;
  title: string;
  educationalLevel: string;
  courseId: string;
  description: string;
  price: number;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoteOrder {
  _id: string;
  noteId: string;
  userId: string;
  name: string;
  studentPhone: string;
  guardianPhone: string;
  address: string;
  paymentMethod: 'cash';
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  orderedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Get all notes (public)
export const getNotes = async (): Promise<Note[]> => {
  try {
    const response = await api.get('/notes');
    return response.data.data;
  } catch (error) {
    // Fallback to mock data if API is not available
    console.warn('API not available, using mock data');
    return [
      {
        _id: 'n1',
        title: 'مذكرة الفيزياء - الشهر الأول',
        educationalLevel: 'الثانوية العامة - 3',
        courseId: '',
        description: 'مذكرة شاملة لمنهج الشهر الأول مع أمثلة محلولة',
        price: 50,
        image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: 'n2',
        title: 'مذكرة الرياضيات - التفاضل',
        educationalLevel: 'الثانوية العامة - 3',
        courseId: '',
        description: 'مذكرة متخصصة في التفاضل مع تمارين متنوعة',
        price: 45,
        image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: 'n3',
        title: 'مذكرة الكيمياء العضوية',
        educationalLevel: 'الثانوية العامة - 3',
        courseId: '',
        description: 'شرح مبسط للكيمياء العضوية مع رسومات توضيحية',
        price: 40,
        image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
};

// Get all notes (admin)
export const getAllNotes = async (page: number = 1, limit: number = 10): Promise<{ notes: Note[], pagination: any }> => {
  try {
    const response = await api.get('/admin/notes', {
      params: { page, limit }
    });
    return {
      notes: response.data.data,
      pagination: response.data.pagination
    };
  } catch (error) {
    throw error;
  }
};

// Get note by ID
export const getNoteById = async (id: string): Promise<Note> => {
  try {
    const response = await api.get(`/notes/${id}`);
    return response.data.data.note;
  } catch (error) {
    // Fallback to mock data if API is not available
    console.warn('API not available, using mock data');
    return {
      _id: id,
      title: 'مذكرة الفيزياء - الشهر الأول',
      educationalLevel: 'الثانوية العامة - 3',
      courseId: '',
      description: 'مذكرة شاملة لمنهج الشهر الأول مع أمثلة محلولة',
      price: 50,
      image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
};

// Create note (admin)
export const createNote = async (noteData: Partial<Note> | FormData): Promise<Note> => {
  try {
    const config = noteData instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : {};

    const response = await api.post('/admin/notes', noteData, config);
    return response.data.data.note;
  } catch (error) {
    throw error;
  }
};

// Update note (admin)
export const updateNote = async (id: string, noteData: Partial<Note> | FormData): Promise<Note> => {
  try {
    const config = noteData instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : {};

    const response = await api.put(`/admin/notes/${id}`, noteData, config);
    return response.data.data.note;
  } catch (error) {
    throw error;
  }
};

// Delete note (admin)
export const deleteNote = async (id: string): Promise<void> => {
  try {
    await api.delete(`/admin/notes/${id}`);
  } catch (error) {
    throw error;
  }
};

// Create note order
export const createNoteOrder = async (orderData: Omit<NoteOrder, '_id' | 'createdAt' | 'updatedAt'>): Promise<NoteOrder> => {
  try {
    const response = await api.post('/notes/orders', orderData);
    return response.data.data.order;
  } catch (error) {
    // Fallback to localStorage if API is not available
    console.warn('API not available, using localStorage');
    const orders = JSON.parse(localStorage.getItem('electron_note_orders') || '[]');
    const newOrder = {
      _id: `order_${Date.now()}`,
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    orders.push(newOrder);
    localStorage.setItem('electron_note_orders', JSON.stringify(orders));
    return newOrder;
  }
};

// Get user's note orders
export const getNoteOrders = async (userId: string): Promise<NoteOrder[]> => {
  try {
    const response = await api.get(`/notes/orders?userId=${userId}`);
    return response.data.data;
  } catch (error) {
    // Fallback to localStorage if API is not available
    console.warn('API not available, using localStorage');
    return JSON.parse(localStorage.getItem('electron_note_orders') || '[]');
  }
};

// Get all note orders (admin)
export const getAllNoteOrders = async (page: number = 1, limit: number = 10, status?: string): Promise<{ orders: NoteOrder[], pagination: any }> => {
  try {
    const params: any = { page, limit };
    if (status) params.status = status;

    const response = await api.get('/admin/notes/orders', { params });
    return {
      orders: response.data.data,
      pagination: response.data.pagination
    };
  } catch (error) {
    throw error;
  }
};

// Update note order status (admin)
export const updateNoteOrderStatus = async (id: string, status: string): Promise<NoteOrder> => {
  try {
    const response = await api.put(`/admin/notes/orders/${id}/status`, { status });
    return response.data.data.order;
  } catch (error) {
    throw error;
  }
};